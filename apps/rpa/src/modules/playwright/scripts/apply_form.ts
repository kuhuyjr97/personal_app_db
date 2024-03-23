import { GasStartTimeOptions, HinataoParams } from 'api';
import { AsYouTypeFormatter } from 'google-libphonenumber';
import minimist from 'minimist';
import { chromium, Browser, BrowserContext, Page, errors } from 'playwright';

import { DEFAULT_CHROME_LAUNCH_OPTIONS } from '@/modules/playwright/default_launch_option';
import { FAILED, RESPONSE, SUCCESS } from '@/modules/playwright/response_types';

const getStartDate = (params: HinataoParams) => {
  if (params.electricStartDate) return params.electricStartDate;
  if (params.gasStartDate) return params.gasStartDate;

  throw new Error('No start date');
};

const getGasStartTime = (selected: GasStartTimeOptions) => {
  switch (selected) {
    case '9am-12pm':
      return '1';
    case '1pm-3pm':
      return '2';
    case '3pm-5pm':
      return '3';
    case '5pm-7pm':
      return '4';
    default:
      throw new Error('Invalid gas start time');
  }
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
};

const getRemarks = (params: HinataoParams) => {
  let remarks = '';
  // not required electric
  if (!params.desiredContacts.includes('electric')) {
    remarks += `ガスのみ契約希望（電気不要）、開始日は${formatDate(
      new Date(params.gasStartDate!),
    )} (${params.gasStartTime!})時でお願いいたします。\n`;
  }

  // electric and gas start date is different
  if (
    params.electricStartDate &&
    params.gasStartDate &&
    params.electricStartDate !== params.gasStartDate
  ) {
    remarks += `ガスの開始日は${formatDate(
      new Date(params.gasStartDate!),
    )} (${params.gasStartTime!})時でお願いいたします。\n`;
  }

  return remarks;
};

const applyForm = async (params: HinataoParams): Promise<RESPONSE> => {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  try {
    browser = await chromium.launch(DEFAULT_CHROME_LAUNCH_OPTIONS);
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto('https://krs.bz/hinatao/m?f=1');

    // form top
    // companyID
    await page.locator('#e_26').fill('GTN-affiliate');
    // personInCharge
    await page.locator('#e_3').fill('李');
    // personInChargeEmail
    await page.locator('#e_38').fill('gtn-affiliate@gtn.co.jp');
    // personInChargePhone required "-"
    await page.locator('#e_36').fill('070-1372-7690');
    // sentServicePolicy
    await page.locator('#e_5').selectOption('1');
    // isProvideArea
    await page.locator('#e_6').selectOption('1');
    // paymentMethod
    await page.locator('#e_7').selectOption('3');

    // form applicant
    // lastName
    await page.locator('#e_9').fill(params.lastName);
    // firstName
    await page.locator('#e_10').fill(params.firstName);
    // lastNameKana
    await page.locator('#e_11').fill(params.lastNameKana);
    // firstNameKana
    await page.locator('#e_12').fill(params.firstNameKana);
    // birthdate Y/M/D
    await page.locator('#e_91').fill(formatDate(new Date(params.birthdate)));
    // email
    await page.locator('#e_13').fill(params.email);
    // phoneNumber required "-"
    await page
      .locator('#e_37')
      .fill(new AsYouTypeFormatter('JP').inputDigit(params.phoneNumber));

    // address
    // postalCode
    await page.locator('#e_35').fill(params.postalCode);
    // addressDetail
    await page
      .locator('#e_34')
      .fill(params.prefecture + params.city + params.address);
    // building
    await page.locator('#e_93').fill(params.building || '');
    // roomNumber
    await page.locator('#e_97').fill(params.roomNumber || '');

    // form electric
    // startDate Y/M/D
    const requiredDate = new Date(getStartDate(params));

    await page.evaluate((date) => {
      const picker = (window as any).flatpickr('#e_64', {});
      picker.setDate(date);
    }, requiredDate);

    // priceMenu
    await page.locator('#e_17').selectOption('1');
    // hasPowerContract
    await page.locator('#e_18').selectOption('3');

    // form gas
    const isGasRequired = params.desiredContacts.includes('gas');
    // isGasRequired
    await page.locator('#e_19').selectOption(isGasRequired ? '2' : '1');
    // gasStartTime
    await page
      .locator('#e_20')
      .selectOption(
        isGasRequired
          ? getGasStartTime(params.gasStartTime as GasStartTimeOptions)
          : '5',
      );
    // fastOrLate
    await page.locator('#e_21').selectOption(isGasRequired ? '1' : '3');
    // attendancePerson
    await page.locator('#e_22').selectOption('2');

    // form water
    const isWaterRequired = params.desiredContacts.includes('water');
    // isWaterRequired
    await page.locator('#e_23').selectOption(isWaterRequired ? '2' : '1');

    // remarks
    await page.locator('#e_24').fill(getRemarks(params));

    const goToConfirmScreenButton = page.locator('#__send');
    await goToConfirmScreenButton.click();

    const commitButton = page.locator('#__commit');
    if (process.env.APP_ENV === 'production') {
      await commitButton.click();
    }

    return {
      code: SUCCESS,
    };
  } catch (e) {
    if (!(e instanceof errors.TimeoutError)) throw e;

    let image: string | undefined = undefined;
    if (page) {
      const now = new Date().toISOString();
      image = `${now}_error_form_screenshot.png`;
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
  const paramsString = args['params'];
  const params = JSON.parse(
    Buffer.from(paramsString, 'base64').toString('utf8'),
  );
  HinataoParams._parse(params);

  const response = await applyForm(params);
  const buffer = Buffer.from(JSON.stringify(response)).toString('base64');
  console.log(buffer);
};
main();
