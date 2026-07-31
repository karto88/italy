import { Page } from '@playwright/test';
import { PORTAL } from '../config/portal.config';

/**
 * BasePage — საერთო ლოგიკა ყველა Page Object-ისთვის
 */
export class BasePage {
  constructor(protected page: Page) {}

  /** გადასვლა route-ზე (baseURL + path) */
  async goto(path: string = '') {
    await this.page.goto(`${PORTAL.BASE_URL}${path}`);
  }

  /** მიმდინარე URL */
  url(): string {
    return this.page.url();
  }
}
