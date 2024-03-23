import minimist from 'minimist';
import { chromium, Browser, BrowserContext, Page, errors } from 'playwright';

import { DEFAULT_CHROME_LAUNCH_OPTIONS } from '@/modules/playwright/default_launch_option';
import { FAILED, RESPONSE, SUCCESS } from '@/modules/playwright/response_types';

const sendTermsAgreement = async (email: string): Promise<RESPONSE> => {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  try {
    browser = await chromium.launch(DEFAULT_CHROME_LAUNCH_OPTIONS);
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto(
      'https://area18.smp.ne.jp/area/servlet/area.MyPageBundle?MyPageID=135ca5c5_pcsb1mamhlj9lele4',
    );

    // login
    await page
      .locator('label')
      .filter({ hasText: '企業コード' })
      .fill('GTN-affiliate');
    const goToNextPageButton = page
      .locator('input')
      .filter({ hasText: 'ログイン' });
    await goToNextPageButton.click();

    // fill in the form
    await page
      .locator('label')
      .filter({ hasText: 'ご入居者さまのメールアドレス' })
      .fill(email);
    (await page.locator('.input').all())[1].fill('李');
    const goToConfirmPageButton = page
      .locator('input')
      .filter({ hasText: '次へ' });
    await goToConfirmPageButton.click();
    await page.waitForTimeout(5000);

    const sendButton = page.locator('input').filter({ hasText: '送信' });
    if (process.env.APP_ENV === 'production') {
      await sendButton.click();
    }

    return {
      code: SUCCESS,
    };
  } catch (e) {
    if (!(e instanceof errors.TimeoutError)) throw e;

    let image: string | undefined = undefined;
    if (page) {
      const now = new Date().toISOString();
      image = `${now}_error_terms_screenshot.png`;
      await page.screenshot({ path: image });
    }
    return {
      code: FAILED,
      image,
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
};

const main = async () => {
  const args = minimist(process.argv.slice(2));
  const email = args['email'];

  const response = await sendTermsAgreement(email);
  const buffer = Buffer.from(JSON.stringify(response)).toString('base64');
  console.log(buffer);
};
main();
