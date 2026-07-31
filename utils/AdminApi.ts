import { APIRequestContext } from '@playwright/test';

/**
 * AdminApi — Italy admin panel API (auth + cleanup).
 * Flow: pre-login → login → access token.
 * credentials .env-იდან.
 */
export class AdminApi {
  private baseUrl = process.env.ADMIN_BASE_URL || 'https://newadmin.dev.keepz.it';

  constructor(private request: APIRequestContext) {}

  /** Step 1: pre-login */
  async preLogin(
    username = process.env.ADMIN_USERNAME || '',
    countryCode = process.env.ADMIN_COUNTRY_CODE || '39'
  ) {
    return this.request.post(`${this.baseUrl}/api/auth/pre-login`, {
      data: { username, countryCode },
    });
  }

  /** Step 2: login → access token */
  async login(
    username = process.env.ADMIN_USERNAME || '',
    password = process.env.ADMIN_PASSWORD || '',
    countryCode = process.env.ADMIN_COUNTRY_CODE || '39',
    deviceId = process.env.ADMIN_DEVICE_ID || ''
  ): Promise<string> {
    const response = await this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: {
        countryCode,
        deviceId,
        loginType: 'PASSWORD',
        password,
        userType: 'ADMIN',
        username,
      },
    });

    const data = await response.json();
    const token =
      data?.value?.accessToken ??
      data?.value?.access_token ??
      data?.accessToken;

    if (!token) {
      throw new Error(
        `Admin login failed: ${data?.message || 'no access token'} ` +
          `(status: ${response.status()}). შეამოწმე ADMIN_* .env-ში.`
      );
    }
    return token;
  }

  private token: string | null = null;

  /** სრული ავთენტიფიკაცია → token (ინახება instance-ში) */
  async authenticate(): Promise<string> {
    await this.preLogin();
    this.token = await this.login();
    return this.token;
  }

  /** auth header (საჭიროებისას login-ს ავტომატურად ასრულებს) */
  private async authHeaders() {
    if (!this.token) await this.authenticate();
    return { Authorization: `Bearer ${this.token}` };
  }

  /** მერჩანტების წამოღება (POST body-ით, paginated) */
  async getAllMerchants(overrides: Record<string, any> = {}): Promise<any[]> {
    const body = {
      endDate: null,
      groupIds: null,
      id: '',
      pageNumber: '1',
      pageSize: '50',
      salesIds: null,
      searchText: '',
      showMock: false,
      startDate: null,
      status: null,
      type: null,
      ...overrides,
    };
    const response = await this.request.post(
      `${this.baseUrl}/api/v1/merchant/getAllMerchant`,
      { headers: await this.authHeaders(), data: body }
    );
    const json = await response.json();
    return json?.value?.content ?? [];
  }

  /**
   * აქტიური (არა-DELETED) მერჩანტის პოვნა ნომრით.
   * სისტემაში phoneNumber = countryCode + phone (მაგ. '39' + '34004013').
   */
  async findMerchantByPhone(
    phone: string,
    { includeDeleted = false }: { includeDeleted?: boolean } = {}
  ): Promise<any | null> {
    const countryCode = process.env.TEST_COUNTRY_CODE || '39';
    const full = `${countryCode}${phone}`;
    const list = await this.getAllMerchants({ searchText: phone });
    return (
      list.find(
        (m) =>
          (m.phoneNumber || '').startsWith(full) &&
          (includeDeleted || m.status !== 'DELETED')
      ) ?? null
    );
  }

  /**
   * მერჩანტის პოვნა userId-ით — getAllMerchant-ს id-ის ველში userId გადაეცემა.
   * აბრუნებს merchant ობიექტს (მისი `id` საჭიროა წასაშლელად).
   */
  async findMerchantByUserId(userId: string): Promise<any | null> {
    const list = await this.getAllMerchants({ id: userId });
    return list.find((m) => m.status !== 'DELETED') ?? list[0] ?? null;
  }

  /** მერჩანტის წაშლა id-ით */
  async deleteMerchant(id: string) {
    return this.request.delete(`${this.baseUrl}/api/v1/merchant/${id}`, {
      headers: await this.authHeaders(),
    });
  }

  /**
   * cleanup userId-ით (ყველაზე ზუსტი) — userId-ით ვპოულობთ merchant-ს,
   * მისი `id`-ით ვშლით.
   * retry — delete-ზე: ახლადშექმნილი იუზერის "user auth entity" ცოტა ხანში
   * ხდება მზად (მანამდე DELETE 400-ს იძლევა), ამიტომ delete-ს ვიმეორებთ.
   */
  async deleteMerchantByUserId(
    userId: string,
    { retries = 10, delayMs = 3000 }: { retries?: number; delayMs?: number } = {}
  ): Promise<boolean> {
    // merchant-ის პოვნა (id-ფილტრი მყისიერია)
    let merchant: any = null;
    for (let i = 0; i < 5 && !merchant; i++) {
      merchant = await this.findMerchantByUserId(userId);
      if (!merchant) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!merchant || merchant.status === 'DELETED') return false;

    // delete-ის retry — auth entity-ს მზადყოფნამდე
    for (let attempt = 0; attempt < retries; attempt++) {
      const res = await this.deleteMerchant(merchant.id);
      if (res.ok()) return true;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return false;
  }

  /**
   * cleanup — ნომრით პოვნა და წაშლა (afterEach-ისთვის).
   *
   * ⚠️ უსაფრთხოება: თუ expectedName მოცემულია, წაშლა მოხდება მხოლოდ მაშინ,
   *    როცა იუზერის სახელი ზუსტად ემთხვევა — რომ სხვისი (არა-ჩვენი ტესტის)
   *    იუზერი შემთხვევით არ წავშალოთ.
   * retries — ახლადშექმნილი იუზერის indexing-ის timing-ისთვის.
   * აბრუნებს true თუ წაიშალა, false თუ ვერ მოიძებნა / სახელი არ დაემთხვა.
   */
  async deleteMerchantByPhone(
    phone: string,
    {
      retries = 1,
      delayMs = 1500,
      expectedName,
    }: { retries?: number; delayMs?: number; expectedName?: string } = {}
  ): Promise<boolean> {
    for (let attempt = 0; attempt < retries; attempt++) {
      const merchant = await this.findMerchantByPhone(phone);
      if (merchant) {
        // safety guard — მხოლოდ ჩვენი ტესტ-იუზერი
        if (expectedName && merchant.name !== expectedName) {
          console.warn(
            `⚠️ SKIP delete: phone ${phone} belongs to "${merchant.name}", not "${expectedName}"`
          );
          return false;
        }
        const res = await this.deleteMerchant(merchant.id);
        return res.ok();
      }
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return false;
  }
}