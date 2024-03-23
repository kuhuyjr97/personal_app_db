import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { applications } from 'database';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';

import { Database } from '@/modules/database/database.providers';
import { EmailService } from '@/modules/email/email.service';
import { HinataoService } from '@/modules/hinatao/hinatao.service';
import { WifiService } from '@/modules/wifi/wifi.service';

export type Applciation = NonNullable<
  Awaited<ReturnType<AutomationService['getApplicationQuery']>>
>;

@Injectable()
export class AutomationService {
  ADMIN_EMAIL = this.config.get<string>('app.adminEmail')!;

  constructor(
    @Inject('DATABASE') private readonly db: Database,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly hinatao: HinataoService,
    private readonly wifi: WifiService,
  ) {}

  async execute(id: number) {
    const application = await this.getApplicationQuery({
      where: eq(applications.id, id),
    });

    if (!application) throw new NotFoundException();

    const { agency, applicant, utility, wifi } = application;
    const representativeAccount = agency.accounts.find(
      ({ isRepresentative }) => isRepresentative,
    );
    const account = representativeAccount || agency.accounts.find(Boolean);

    console.log('execute');

    await this.emailService.sendEmail(
      this.ADMIN_EMAIL,
      '新規の申し込みがあります。',
      'new_application_created',
      {
        applicationId: id,
      },
    );
    console.log('sent email to GTN');

    if (utility) {
      if (utility.status === 'not_handle') {
        console.log('execute utility');

        const termsAgreementSuccess = await this.hinatao.sendTermsAgreement(
          application.id,
          application.applicant.email,
        );
        if (!termsAgreementSuccess) throw new Error('TermsAgreement failed');

        console.log('sent hinatao terms agreement');

        const formSuccess = await this.hinatao.applyFormRequest({
          ...application,
          // TODO: fix this
          utility,
        });
        if (!formSuccess) throw new Error('Form failed');

        console.log('applied hinatao form');

        try {
          // confirm to agency
          await this.emailService.sendEmail(
            agency.email!,
            '【GTN】GTN電気ガスセットアップサービスのお申込みを承りました',
            'application_recieved_to_agency',
            {
              agencyName: agency.name,
              // japanese
              personInCharge:
                account?.lastName || '' + ' ' + account?.firstName || '',
              // foreigner
              applicantName: applicant.firstName + ' ' + applicant.lastName,
              // TODO
              electricStartDate: utility?.electricStartDate
                ? format(new Date(utility.electricStartDate), 'yyyy-MM-dd')
                : '-',
              gasStartDate: utility?.gasStartDate
                ? format(new Date(utility.gasStartDate), 'yyyy-MM-dd')
                : '-',
              gasStartTime: utility?.gasStartTimeCode || '-',
              withWaterSupply: !!utility?.withWaterSupply
                ? '電気利用開始日と同じ'
                : '申込無し',
              hasWifiApplication: !!application.wifi
                ? '申込対応済み'
                : '申込無し',
              hasCreditCardApplication: !!application.creditCard
                ? 'ご案内済み'
                : '申込無し',
            },
            this.ADMIN_EMAIL,
          );
          console.log('sent confirm email to agency');
        } catch (error) {
          console.error(error);
          await this.sendEmailSendFailedNotification(
            id,
            '代理店への申し込み受付メールの送信に失敗しました。',
          );

          throw error;
        }

        try {
          // confirm to applicant
          const electricStartDate = utility?.electricStartDate
            ? new Date(utility.electricStartDate)
            : null;
          const gasStartDate = utility?.gasStartDate
            ? new Date(utility.gasStartDate)
            : null;

          await this.emailService.sendEmail(
            applicant.email!,
            '',
            'application_recieved_to_customer',
            {
              applicantName: applicant.firstName + ' ' + applicant.lastName,
              electricStartDate,
              electricStartDateYear: electricStartDate?.getFullYear() || '-',
              electricStartDateMonth: electricStartDate?.getMonth()
                ? electricStartDate.getMonth() + 1
                : '-',
              electricStartDateDay: electricStartDate?.getDate() || '-',
              gasStartDate,
              gasStartDateYear: gasStartDate?.getFullYear() || '-',
              gasStartDateMonth: gasStartDate?.getMonth()
                ? gasStartDate.getMonth() + 1
                : '-',
              gasStartDateDay: gasStartDate?.getDate() || '-',
              gasStartTime: utility?.gasStartTimeCode || '-',
              withWaterSupply: !!utility?.withWaterSupply,
            },
            this.ADMIN_EMAIL,
            'attachment.png',
            applicant.desiredLanguageCode,
          );
          console.log('sent confirm email to applicant');
        } catch (error) {
          console.error(error);
          await this.sendEmailSendFailedNotification(
            id,
            'お客様への申し込み受付メールの送信に失敗しました。',
          );

          throw error;
        }
      } else {
        console.log('skip utility');
      }
    }

    if (wifi) {
      if (wifi.status === 'not_handle') {
        console.log('execute wifi');
        await this.wifi.apply({
          ...application,
          // TODO: fix this
          wifi,
        });
        console.log('sf lead created');
      } else {
        console.log('skip wifi');
      }
    }

    console.log('execute completed');
  }

  private async getApplicationQuery(
    params: Omit<
      Parameters<typeof this.db.query.applications.findFirst>['0'],
      'with'
    >,
  ) {
    return this.db.query.applications.findFirst({
      with: {
        agency: {
          with: {
            accounts: true,
          },
        },
        applicant: {
          with: {
            address: true,
          },
        },
        creditCard: true,
        utility: true,
        wifi: true,
      },
      ...params,
    });
  }

  private async sendEmailSendFailedNotification(
    applicationId: number,
    message: string,
  ) {
    await this.emailService.sendEmail(
      this.ADMIN_EMAIL,
      '電気ガスの申し込み受付メールの送信に失敗しました。',
      'failed_notification_email',
      {
        applicationId,
        message,
      },
    );
  }
}
