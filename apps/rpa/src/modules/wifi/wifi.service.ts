import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { wifi_applications } from 'database';
import { eq } from 'drizzle-orm';

import { NonNullableForSpecificKeys } from '@/common/utils/non_nullable_for_specific_keys';
import { Applciation } from '@/modules/automation/automation.service';
import { Database } from '@/modules/database/database.providers';
import { EmailService } from '@/modules/email/email.service';
import { FileService } from '@/modules/file/file.service';
import {
  LeadRecord,
  SalesforceClient,
} from '@/modules/common/salesforce/salesforce.client';

type WifiApplication = NonNullableForSpecificKeys<Applciation, 'wifi'>;

@Injectable()
export class WifiService {
  constructor(
    private readonly config: ConfigService,
    @Inject('DATABASE') private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly fileSercive: FileService,
    private readonly salesforce: SalesforceClient,
  ) {}

  async apply(application: WifiApplication) {
    let leadId = '';
    try {
      const { id, wifi } = application;

      const params = this.parseToLeadRecordParams(application);
      // post to salesforce without visa images
      leadId = await this.salesforce.createLeadRecord(params);

      console.log('SF record created');
      const visaFrontKey = await this.fileSercive.uploadRecidenceCardFront(
        wifi.visaFrontUrl,
        leadId,
      );
      const visaBackKey = await this.fileSercive.uploadRecidenceCardBack(
        wifi.visaBackUrl,
        leadId,
      );
      console.log('uploaded visa to S3');

      await this.salesforce.updateLeadRecord(leadId, {
        Hikari_IdentityCardImage1__c: visaFrontKey,
        Hikari_IdentityCardImage2__c: visaBackKey,
      });
      console.log('uploaded SF record');

      await this.updateApplicationStatus(id, 'application_form_completed');
      console.log('status updated');

      console.log('complete');
    } catch (error) {
      if (leadId)
        console.log('something when failed while updating lead', leadId);

      await this.updateApplicationStatus(
        application.id,
        'application_form_failed',
      );

      await this.emailService.sendEmail(
        this.config.get<string>('app.itsEmail')!,
        'Wifi申込の自動化に失敗しました。',
        'failed_notification_email',
        {
          applicationId: application.id,
          message:
            'ログを確認して修正箇所をアフィリエイトチームに報告してください。',
        },
      );

      throw error;
    }
  }

  private async updateApplicationStatus(
    applicationId: number,
    // TODO: refer from database
    status: 'application_form_completed' | 'application_form_failed',
  ) {
    await this.db
      .update(wifi_applications)
      .set({
        status,
      })
      .where(eq(wifi_applications.applicationId, applicationId));
  }

  private parseToLeadRecordParams(application: WifiApplication): LeadRecord {
    const { applicant, agency, ...rest } = application;
    const { address, ...applicantRest } = applicant;
    const { addressDetail, ...addressRest } = address;

    const wifi = rest.wifi;
    const languages = [
      {
        name: '日本語',
        code: 'japanese',
      },
      {
        name: 'Tiếng Việt',
        code: 'vietnamese',
      },
      {
        name: '中文',
        code: 'chinese',
      },
      {
        name: 'English',
        code: 'english',
      },
      {
        name: '한국어',
        code: 'korean',
      },
      {
        name: '中文',
        code: 'taiwan',
      },
    ];

    return {
      LastName: applicantRest.lastName,
      FirstName: applicantRest.firstName,
      Hikari_Mei_Kana__c: applicantRest.firstNameKana,
      Hikari_Sei_Kana__c: applicantRest.lastNameKana,
      Hikari_Mei_Kanji__c: applicantRest.firstName,
      Hikari_Sei_Kanji__c: applicantRest.lastName,

      Hikari_Birthday__c: applicantRest.birthdate,
      Hikari_Country__c: applicantRest.nationality,
      Hikari_Email__c: applicantRest.email,
      Hikari_PhoneNumber__c: applicantRest.phoneNumber,

      Hikari_Language__c:
        (languages.find(
          (language) => language.code === applicantRest.desiredLanguageCode,
        )?.name as any) || null,

      Hikari_IdentityCardName__c: wifi.visaName,
      Hikari_Visa_ExpiryDate__c: wifi.visaExpDate,

      Hiraki_Postcode__c: addressRest.postalCode,
      Hiraki_Prefecture__c: addressRest.prefecture,
      Hiraki_City__c: addressRest.city,
      Hiraki_Street_Number__c: addressDetail,
      Hiraki_BuildingName__c: addressRest.building
        ? `${addressRest.building} `
        : '' + addressRest.roomNumber || '',
    };
  }
}
