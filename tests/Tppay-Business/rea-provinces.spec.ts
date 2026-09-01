import { test } from '../../utils/businessFixture';

/**
 * REA — იტალიის პროვინციების კოდების შემოწმება (Azienda · REA ველი).
 * თითო ტესტი კონკრეტულ province code-ს ამოწმებს: flow.checkRea('XX').
 * მასივი: config/rea-provinces.ts | flow: utils/WalletFlowHelper.ts
 *
 * POSITIVE (118): ვალიდური province code (AG, MI, RM, ...) → REA "XX-987654" მიიღება → ვერიფიკაცია გრძელდება.
 * NEGATIVE (5): არარსებული province code (GG, OO, ...) → REA უარყოფილია (error) → ვერიფიკაცია არ გრძელდება.
 */
test.describe('KYB — REA province codes', () => {

  test.describe('positive — valid province codes', () => {

    test('REA — AGRIGENTO AG', async ({ flow }) => {
      await flow.checkRea('AG');
    });

    test('REA — ALESSANDRIA AL', async ({ flow }) => {
      await flow.checkRea('AL');
    });

    test('REA — ANCONA AN', async ({ flow }) => {
      await flow.checkRea('AN');
    });

    test('REA — AOSTA AO', async ({ flow }) => {
      await flow.checkRea('AO');
    });

    test('REA — ASCOLI PICENO AP', async ({ flow }) => {
      await flow.checkRea('AP');
    });

    test('REA — LAQUILA AQ', async ({ flow }) => {
      await flow.checkRea('AQ');
    });

    test('REA — AREZZO AR', async ({ flow }) => {
      await flow.checkRea('AR');
    });

    test('REA — ASTI AT', async ({ flow }) => {
      await flow.checkRea('AT');
    });

    test('REA — AVELLINO AV', async ({ flow }) => {
      await flow.checkRea('AV');
    });

    test('REA — BARI BA', async ({ flow }) => {
      await flow.checkRea('BA');
    });

    test('REA — BERGAMO BG', async ({ flow }) => {
      await flow.checkRea('BG');
    });

    test('REA — BIELLA BI', async ({ flow }) => {
      await flow.checkRea('BI');
    });

    test('REA — BELLUNO BL', async ({ flow }) => {
      await flow.checkRea('BL');
    });

    test('REA — BENEVENTO BN', async ({ flow }) => {
      await flow.checkRea('BN');
    });

    test('REA — BOLOGNA BO', async ({ flow }) => {
      await flow.checkRea('BO');
    });

    test('REA — BRINDISI BR', async ({ flow }) => {
      await flow.checkRea('BR');
    });

    test('REA — BRESCIA BS', async ({ flow }) => {
      await flow.checkRea('BS');
    });

    test('REA — BARLETTA-ANDRIA-TRANI BT', async ({ flow }) => {
      await flow.checkRea('BT');
    });

    test('REA — BOLZANO BZ', async ({ flow }) => {
      await flow.checkRea('BZ');
    });

    test('REA — CAGLIARI CA', async ({ flow }) => {
      await flow.checkRea('CA');
    });

    test('REA — CAMPOBASSO CB', async ({ flow }) => {
      await flow.checkRea('CB');
    });

    test('REA — CASERTA CE', async ({ flow }) => {
      await flow.checkRea('CE');
    });

    test('REA — CHIETI CH', async ({ flow }) => {
      await flow.checkRea('CH');
    });

    test('REA — CARBONIA-IGLESIAS CI', async ({ flow }) => {
      await flow.checkRea('CI');
    });

    test('REA — CALTANISSETTA CL', async ({ flow }) => {
      await flow.checkRea('CL');
    });

    test('REA — CUNEO CN', async ({ flow }) => {
      await flow.checkRea('CN');
    });

    test('REA — COMO CO', async ({ flow }) => {
      await flow.checkRea('CO');
    });

    test('REA — CREMONA CR', async ({ flow }) => {
      await flow.checkRea('CR');
    });

    test('REA — COSENZA CS', async ({ flow }) => {
      await flow.checkRea('CS');
    });

    test('REA — CATANIA CT', async ({ flow }) => {
      await flow.checkRea('CT');
    });

    test('REA — CATANZARO CZ', async ({ flow }) => {
      await flow.checkRea('CZ');
    });

    test('REA — ENNA EN', async ({ flow }) => {
      await flow.checkRea('EN');
    });

    test('REA — FORLI-CESENA FC', async ({ flow }) => {
      await flow.checkRea('FC');
    });

    test('REA — FERRARA FE', async ({ flow }) => {
      await flow.checkRea('FE');
    });

    test('REA — FOGGIA FG', async ({ flow }) => {
      await flow.checkRea('FG');
    });

    test('REA — FIRENZE FI', async ({ flow }) => {
      await flow.checkRea('FI');
    });

    test('REA — FERMO FM', async ({ flow }) => {
      await flow.checkRea('FM');
    });

    test('REA — FORLI FO', async ({ flow }) => {
      await flow.checkRea('FO');
    });

    test('REA — FROSINONE FR', async ({ flow }) => {
      await flow.checkRea('FR');
    });

    test('REA — FIUME FU', async ({ flow }) => {
      await flow.checkRea('FU');
    });

    test('REA — GENOVA GE', async ({ flow }) => {
      await flow.checkRea('GE');
    });

    test('REA — GORIZIA GO', async ({ flow }) => {
      await flow.checkRea('GO');
    });

    test('REA — GROSSETO GR', async ({ flow }) => {
      await flow.checkRea('GR');
    });

    test('REA — IMPERIA IM', async ({ flow }) => {
      await flow.checkRea('IM');
    });

    test('REA — ISERNIA IS', async ({ flow }) => {
      await flow.checkRea('IS');
    });

    test('REA — CROTONE KR', async ({ flow }) => {
      await flow.checkRea('KR');
    });

    test('REA — LECCO LC', async ({ flow }) => {
      await flow.checkRea('LC');
    });

    test('REA — LECCE LE', async ({ flow }) => {
      await flow.checkRea('LE');
    });

    test('REA — LIVORNO LI', async ({ flow }) => {
      await flow.checkRea('LI');
    });

    test('REA — LODI LO', async ({ flow }) => {
      await flow.checkRea('LO');
    });

    test('REA — LATINA LT', async ({ flow }) => {
      await flow.checkRea('LT');
    });

    test('REA — LUCCA LU', async ({ flow }) => {
      await flow.checkRea('LU');
    });

    test('REA — MONZA E BRIANZA MB', async ({ flow }) => {
      await flow.checkRea('MB');
    });

    test('REA — MACERATA MC', async ({ flow }) => {
      await flow.checkRea('MC');
    });

    test('REA — MESSINA ME', async ({ flow }) => {
      await flow.checkRea('ME');
    });

    test('REA — MILANO MI', async ({ flow }) => {
      await flow.checkRea('MI');
    });

    test('REA — MANTOVA MN', async ({ flow }) => {
      await flow.checkRea('MN');
    });

    test('REA — MODENA MO', async ({ flow }) => {
      await flow.checkRea('MO');
    });

    test('REA — MASSA-CARRARA MS', async ({ flow }) => {
      await flow.checkRea('MS');
    });

    test('REA — MATERA MT', async ({ flow }) => {
      await flow.checkRea('MT');
    });

    test('REA — NAPOLI NA', async ({ flow }) => {
      await flow.checkRea('NA');
    });

    test('REA — NOVARA NO', async ({ flow }) => {
      await flow.checkRea('NO');
    });

    test('REA — NUORO NU', async ({ flow }) => {
      await flow.checkRea('NU');
    });

    test('REA — OGLIASTRA OG', async ({ flow }) => {
      await flow.checkRea('OG');
    });

    test('REA — ORISTANO OR', async ({ flow }) => {
      await flow.checkRea('OR');
    });

    test('REA — OLBIA-TEMPIO OT', async ({ flow }) => {
      await flow.checkRea('OT');
    });

    test('REA — PALERMO PA', async ({ flow }) => {
      await flow.checkRea('PA');
    });

    test('REA — PIACENZA PC', async ({ flow }) => {
      await flow.checkRea('PC');
    });

    test('REA — PADOVA PD', async ({ flow }) => {
      await flow.checkRea('PD');
    });

    test('REA — PESCARA PE', async ({ flow }) => {
      await flow.checkRea('PE');
    });

    test('REA — PERUGIA PG', async ({ flow }) => {
      await flow.checkRea('PG');
    });

    test('REA — PISA PI', async ({ flow }) => {
      await flow.checkRea('PI');
    });

    test('REA — POLA PL', async ({ flow }) => {
      await flow.checkRea('PL');
    });

    test('REA — PORDENONE PN', async ({ flow }) => {
      await flow.checkRea('PN');
    });

    test('REA — PRATO PO', async ({ flow }) => {
      await flow.checkRea('PO');
    });

    test('REA — PARMA PR', async ({ flow }) => {
      await flow.checkRea('PR');
    });

    test('REA — PESARO PS', async ({ flow }) => {
      await flow.checkRea('PS');
    });

    test('REA — PISTOIA PT', async ({ flow }) => {
      await flow.checkRea('PT');
    });

    test('REA — PESARO-URBINO PU', async ({ flow }) => {
      await flow.checkRea('PU');
    });

    test('REA — PESARO E URBINO PU', async ({ flow }) => {
      await flow.checkRea('PU');
    });

    test('REA — PAVIA PV', async ({ flow }) => {
      await flow.checkRea('PV');
    });

    test('REA — POTENZA PZ', async ({ flow }) => {
      await flow.checkRea('PZ');
    });

    test('REA — RAVENNA RA', async ({ flow }) => {
      await flow.checkRea('RA');
    });

    test('REA — REGGIO DI CALABRIA RC', async ({ flow }) => {
      await flow.checkRea('RC');
    });

    test('REA — REGGIO CALABRIA RC', async ({ flow }) => {
      await flow.checkRea('RC');
    });

    test('REA — REGGIO NELLEMILIA RE', async ({ flow }) => {
      await flow.checkRea('RE');
    });

    test('REA — RAGUSA RG', async ({ flow }) => {
      await flow.checkRea('RG');
    });

    test('REA — RIETI RI', async ({ flow }) => {
      await flow.checkRea('RI');
    });

    test('REA — ROMA RM', async ({ flow }) => {
      await flow.checkRea('RM');
    });

    test('REA — RIMINI RN', async ({ flow }) => {
      await flow.checkRea('RN');
    });

    test('REA — ROVIGO RO', async ({ flow }) => {
      await flow.checkRea('RO');
    });

    test('REA — SALERNO SA', async ({ flow }) => {
      await flow.checkRea('SA');
    });

    test('REA — SIENA SI', async ({ flow }) => {
      await flow.checkRea('SI');
    });

    test('REA — SONDRIO SO', async ({ flow }) => {
      await flow.checkRea('SO');
    });

    test('REA — LA SPEZIA SP', async ({ flow }) => {
      await flow.checkRea('SP');
    });

    test('REA — SIRACUSA SR', async ({ flow }) => {
      await flow.checkRea('SR');
    });

    test('REA — SASSARI SS', async ({ flow }) => {
      await flow.checkRea('SS');
    });

    test('REA — SUD SARDEGNA SU', async ({ flow }) => {
      await flow.checkRea('SU');
    });

    test('REA — SAVONA SV', async ({ flow }) => {
      await flow.checkRea('SV');
    });

    test('REA — TARANTO TA', async ({ flow }) => {
      await flow.checkRea('TA');
    });

    test('REA — TERAMO TE', async ({ flow }) => {
      await flow.checkRea('TE');
    });

    test('REA — TRENTO TN', async ({ flow }) => {
      await flow.checkRea('TN');
    });

    test('REA — TORINO TO', async ({ flow }) => {
      await flow.checkRea('TO');
    });

    test('REA — TRAPANI TP', async ({ flow }) => {
      await flow.checkRea('TP');
    });

    test('REA — TERNI TR', async ({ flow }) => {
      await flow.checkRea('TR');
    });

    test('REA — TRIESTE TS', async ({ flow }) => {
      await flow.checkRea('TS');
    });

    test('REA — TREVISO TV', async ({ flow }) => {
      await flow.checkRea('TV');
    });

    test('REA — UDINE UD', async ({ flow }) => {
      await flow.checkRea('UD');
    });

    test('REA — VARESE VA', async ({ flow }) => {
      await flow.checkRea('VA');
    });

    test('REA — VERBANIA VB', async ({ flow }) => {
      await flow.checkRea('VB');
    });

    test('REA — VERCELLI VC', async ({ flow }) => {
      await flow.checkRea('VC');
    });

    test('REA — VENEZIA VE', async ({ flow }) => {
      await flow.checkRea('VE');
    });

    test('REA — VICENZA VI', async ({ flow }) => {
      await flow.checkRea('VI');
    });

    test('REA — VERONA VR', async ({ flow }) => {
      await flow.checkRea('VR');
    });

    test('REA — MEDIO CAMPIDANO VS', async ({ flow }) => {
      await flow.checkRea('VS');
    });

    test('REA — VITERBO VT', async ({ flow }) => {
      await flow.checkRea('VT');
    });

    test('REA — VIBO VALENTIA VV', async ({ flow }) => {
      await flow.checkRea('VV');
    });

    test('REA — ZARA ZA', async ({ flow }) => {
      await flow.checkRea('ZA');
    });
  });

  test.describe('negative — invalid province codes', () => {

    test('REA — invalid code GG', async ({ flow }) => {
      await flow.checkReaInvalid('GG');
    });

    test('REA — invalid code OO', async ({ flow }) => {
      await flow.checkReaInvalid('OO');
    });

    test('REA — invalid code XX', async ({ flow }) => {
      await flow.checkReaInvalid('XX');
    });

    test('REA — invalid code ZZ', async ({ flow }) => {
      await flow.checkReaInvalid('ZZ');
    });

    test('REA — invalid code QQ', async ({ flow }) => {
      await flow.checkReaInvalid('QQ');
    });

    // ─── არასწორი ფორმატი / სიმბოლოები (raw REA მნიშვნელობა) ───

    test('REA — invalid symbol underscore MI_987654', async ({ flow }) => {
      await flow.checkReaInvalidRaw('MI_987654'); // ტირის მაგივრად _
    });

    test('REA — invalid symbol double equals MI==987654', async ({ flow }) => {
      await flow.checkReaInvalidRaw('MI==987654');
    });

    test('REA — invalid symbol at MI@987654', async ({ flow }) => {
      await flow.checkReaInvalidRaw('MI@987654');
    });

    test('REA — invalid symbol hash MI#987654', async ({ flow }) => {
      await flow.checkReaInvalidRaw('MI#987654');
    });

    test('REA — invalid symbol slash MI/987654', async ({ flow }) => {
      await flow.checkReaInvalidRaw('MI/987654');
    });
  });
});
