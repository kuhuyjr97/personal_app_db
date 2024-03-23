import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as iconv from 'iconv-lite';
import * as path from 'path';

type LangCode = 'cn' | 'en' | 'ja' | 'ko' | 'vi';
@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(
    to: string,
    title: string,
    template: string,
    context: object | null | any,
    bcc?: string,
    attachmentPath?: string,
    // todo lang type
    lang?:
      | 'japanese'
      | 'vietnamese'
      | 'chinese'
      | 'english'
      | 'korean'
      | 'taiwan',
  ) {
    let subject = title;
    let langCode: LangCode | undefined = undefined;
    const forCustomer = !!lang;
    if (forCustomer) {
      langCode = this.getLanguageCode(lang);
      subject = this.customerTitles()[langCode][template];
    }

    const templatePath = path.join(
      __dirname,
      `/templates/${langCode ? `customer/${langCode}/` : ''}${template}`,
    );

    const params = {
      to,
      bcc,
      subject,
      template: templatePath, // `.hbs` extension is appended automatically
      context,
      attachments: attachmentPath
        ? [
            {
              filename: 'file.png',
              content: fs.createReadStream(
                path.join(__dirname, `/assets/${attachmentPath}`),
              ),
            },
          ]
        : undefined,
    };

    try {
      await this.mailerService.sendMail(params);

      const logParams = { ...params, time: new Date().toLocaleDateString() };
      // console.log('EMAIL_SENT', logParams);
      // console.log('EMAIL_CONTENT', content);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('message', e.message);
        console.error('stack', e.stack);
      } else {
        console.error(e);
      }

      throw new BadRequestException('EMAIL_SENDING_FAILED');
    }
  }

  private async getTemplate(filePath: string): Promise<string> {
    return await new Promise((resolve, reject) => {
      fs.readFile(filePath + '.hbs', (err: any, data: any) => {
        if (err) {
          reject(err);
          return;
        }

        const buffer = Buffer.from(data, 'binary');
        resolve(iconv.decode(buffer, 'UTF-8'));
      });
    });
  }

  // TODO lang type
  private getLanguageCode(
    lang:
      | 'japanese'
      | 'vietnamese'
      | 'chinese'
      | 'english'
      | 'korean'
      | 'taiwan',
  ): LangCode {
    switch (lang) {
      case 'japanese':
        return 'ja';
      case 'vietnamese':
        return 'vi';
      case 'chinese':
        return 'cn';
      case 'korean':
        return 'ko';
      case 'taiwan':
        return 'cn';
      default:
        return 'en';
    }
  }

  private customerTitles() {
    return {
      cn: {
        application_recieved_to_customer:
          '【重要】请同意GTN电气燃气开通申请代理的请求',
      },
      en: {
        application_recieved_to_customer:
          '[Important] Request for Your Agreement to GTN Electricity and Gas Setup Service Terms and Conditions',
      },
      ja: {
        application_recieved_to_customer:
          '【重要】GTN電気ガスセットアップサービス申込規約同意のお願い',
      },
      ko: {
        application_recieved_to_customer:
          '【중요】GTN 전기 가스 셋업 서비스 신청 약관 동의를 부탁드립니다.',
      },
      vi: {
        application_recieved_to_customer:
          '(Quan trọng) Yêu cầu đồng ý các điều khoản sử dụng của dịch vụ lắp đặt điện và gas GTN',
      },
    };
  }
}
