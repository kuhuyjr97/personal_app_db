import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HinataoParams, PlaywrightResponseMessage } from 'api';
import { utility_applications } from 'database';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

import { Applciation } from '@/modules/automation/automation.service';
import { Database } from '@/modules/database/database.providers';
import { EmailService } from '@/modules/email/email.service';
import { PlaywrightService } from '@/modules/playwright/playwright.service';
import { NonNullableForSpecificKeys } from '@/common/utils/non_nullable_for_specific_keys';

type UtilityApplication = NonNullableForSpecificKeys<Applciation, 'utility'>;

@Injectable()
export class HinataoService {
  constructor(
    private readonly config: ConfigService,
    @Inject('DATABASE') private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly playwright: PlaywrightService,
  ) {}

  async sendTermsAgreement(id: number, email: string) {
    const { message, image } =
      await this.playwright.sendHinataoTermsAgreement(email);

    if (message === PlaywrightResponseMessage.enum.SUCCESS) {
      // SUCCESS
      await this.updateApplicationStatus(id, 'agreement_email_sent_not_agreed');

      return true;
    } else {
      // FAILED
      await this.updateApplicationStatus(id, 'agreement_email_sent_failed');

      // TODO: attach image to email
      await this.emailService.sendEmail(
        this.config.get<string>('app.adminEmail')!,
        'ヒナタオの規約同意メールの送信に失敗しました。',
        'failed_hinatao_agreement',
        {
          id,
        },
      );
    }

    return false;
  }

  async applyFormRequest(application: UtilityApplication) {
    const { id } = application;
    const params = this.parseToHinataoParams({
      ...application,
      // TODO: fix this
      utility: application.utility,
    });

    const { message, image } = await this.playwright.applyHinataoForm(params);

    if (message === PlaywrightResponseMessage.enum.SUCCESS) {
      // SUCCESS
      await this.updateApplicationStatus(id, 'application_form_completed');

      return true;
    } else {
      // FAILED
      await this.updateApplicationStatus(id, 'application_form_failed');

      // TODO: attach image to email
      await this.emailService.sendEmail(
        this.config.get<string>('app.adminEmail')!,
        'ヒナタオの申し込みフォームの入力に失敗しました。',
        'failed_hinatao_form',
        {
          id,
        },
      );
    }

    return false;
  }

  private async updateApplicationStatus(
    applicationId: number,
    // TODO: refer from database
    status:
      | 'agreement_email_sent_not_agreed'
      | 'agreement_email_sent_failed'
      | 'application_form_completed'
      | 'application_form_failed',
  ) {
    await this.db
      .update(utility_applications)
      .set({
        status,
      })
      .where(eq(utility_applications.applicationId, applicationId));
  }

  private parseToHinataoParams(application: UtilityApplication): HinataoParams {
    const { applicant, agency, ...rest } = application;
    const { address, ...applicantRest } = applicant;
    const { addressDetail, ...addressRest } = address;

    const utility = rest.utility;
    let desiredContacts = ['electric', 'gas'];
    if (utility.utilityTypeCode === 'electric') {
      desiredContacts = ['electric'];
    }
    if (utility.utilityTypeCode === 'gas') {
      desiredContacts = ['gas'];
    }
    if (utility.withWaterSupply) {
      desiredContacts.push('water');
    }

    return v.parse(HinataoParams, {
      ...applicantRest,
      ...addressRest,
      address: addressDetail,
      electricStartDate: utility.electricStartDate,
      desiredContacts: desiredContacts,
      gasStartDate: utility.gasStartDate,
      gasStartTime: utility.gasStartTimeCode,
    });
  }
}
