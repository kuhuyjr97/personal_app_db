import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const LeadFixedValues = {
  Status: 'アポ前',
  OwnerId: '0057F000001z74UQAQ',
  Salutation: '様',
  Hikari_Service__c: '光回線',
  RecordTypeId: '012GA000000hznIYAQ',
};

export type LeadRecord = {
  LastName: string;
  FirstName: string;

  Hikari_Mei_Kana__c: string;
  Hikari_Sei_Kana__c: string;
  Hikari_Mei_Kanji__c: string;
  Hikari_Sei_Kanji__c: string;

  // YYYY-MM-DD
  Hikari_Birthday__c: string;
  Hikari_Country__c: string;
  Hikari_Email__c: string;
  // no "-"
  Hikari_PhoneNumber__c: string;

  Hikari_Language__c:
    | '日本語'
    | 'English'
    | '中文'
    | '한국어'
    | 'Tiếng Việt'
    | 'नेपाली भाषा'
    | 'Bahasa Indonesia'
    | 'Tagalog';

  // Upper case
  Hikari_IdentityCardName__c: string;
  // YYYY-MM-DD
  Hikari_Visa_ExpiryDate__c: string | null;

  // no "-"
  Hiraki_Postcode__c: string;
  Hiraki_Prefecture__c: string;
  Hiraki_City__c: string;
  Hiraki_Street_Number__c: string;
  Hiraki_BuildingName__c: string | null;
};

type LeadVisa = {
  // front
  Hikari_IdentityCardImage1__c: string;
  // back
  Hikari_IdentityCardImage2__c: string;
};

@Injectable()
export class SalesforceClient {
  constructor(private readonly config: ConfigService) {}
  BASE_URL = 'https://ap5.salesforce.com/services/data/v52.0';

  // data: { id: '00QGA00000wNCtH2AW', success: true, errors: [] }
  async createLeadRecord(body: LeadRecord): Promise<string> {
    if (this.config.get<string>('app.env') !== 'production') return 'testing';

    const url: URL = new URL(`${this.BASE_URL}/sobjects/Lead`);
    const headers = await this.headers();

    this.formatBody(body);
    try {
      const response = await axios.post(
        url.toString(),
        { ...LeadFixedValues, ...body },
        headers,
      );
      console.log('leadId', response.data.id);

      return response.data.id;
    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response) {
        throw new InternalServerErrorException(
          'Unknown error occurred while creating a lead record',
        );
      }
      switch (error.response.status) {
        case 400:
          throw new Error(
            `Invalid request while creating a lead record. ${
              error.response.data[0]?.message || 'unknown reason'
            }`,
          );
        case 401:
          throw new InternalServerErrorException(
            'Failed to login to Salesforce',
          );
        default:
          throw error;
      }
    }
  }

  async updateLeadRecord(leadId: string, body: LeadVisa): Promise<string> {
    if (this.config.get<string>('app.env') !== 'production') return 'testing';

    const url: URL = new URL(`${this.BASE_URL}/sobjects/Lead/${leadId}`);
    const headers = await this.headers();

    try {
      const response = await axios.patch(url.toString(), body, headers);

      return response.data.id;
    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response) {
        throw new InternalServerErrorException(
          'Unknown error occurred while updating a lead record',
        );
      }
      switch (error.response.status) {
        case 400:
          throw new Error(
            `Invalid request while updating a lead record. ${
              error.response.data[0]?.message || 'unknown reason'
            }`,
          );
        case 401:
          throw new InternalServerErrorException(
            'Failed to login to Salesforce',
          );
        default:
          throw error;
      }
    }
  }

  private formatBody(body: LeadRecord) {
    const dateFormat = 'sv-SE';
    body.Hikari_Birthday__c = new Date(
      body.Hikari_Birthday__c,
    ).toLocaleDateString(dateFormat);
    body.Hikari_IdentityCardName__c =
      body.Hikari_IdentityCardName__c.toUpperCase();
    body.Hikari_PhoneNumber__c = body.Hikari_PhoneNumber__c.replace(/-/g, '');
    body.Hiraki_Postcode__c = body.Hiraki_Postcode__c.replace(/-/g, '');
    body.Hikari_Visa_ExpiryDate__c = body.Hikari_Visa_ExpiryDate__c
      ? new Date(body.Hikari_Visa_ExpiryDate__c).toLocaleDateString(dateFormat)
      : null;
  }

  private async headers() {
    const token = await this.login();
    return {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private async login() {
    const url: URL = new URL(
      'https://login.salesforce.com/services/oauth2/token',
    );
    url.searchParams.append('grant_type', 'password');
    url.searchParams.append(
      'client_id',
      this.config.get<string>('sf.clientId')!,
    );
    url.searchParams.append(
      'client_secret',
      this.config.get<string>('sf.clientSecret')!,
    );
    url.searchParams.append(
      'password',
      this.config.get<string>('sf.password')!,
    );
    url.searchParams.append(
      'username',
      this.config.get<string>('sf.username')!,
    );

    const response = await axios.post(url.toString());
    if (response.status !== 200) {
      throw new Error('Failed to login to Salesforce');
    }

    return response.data.access_token;
  }

  // async getLeadRecord(leadId: string) {
  //   const url: URL = new URL(
  //     `${this.BASE_URL}/sobjects/Lead/${leadId}`
  //   );
  //   const headers = await this.headers();
  //   try {
  //     const response = await axios.get(
  //       url.toString(),
  //       headers,
  //     );

  //     return response.data;
  //   } catch (error) {
  //     if (!axios.isAxiosError(error) || !error.response) {
  //       throw new InternalServerErrorException(
  //         'Unknown error occurred while creating a lead record',
  //       );
  //     }
  //     switch (error.response.status) {
  //       case 400:
  //         throw new Error(
  //           `Invalid request while creating a lead record. ${
  //             error.response.data[0]?.message || 'unknown reason'
  //           }`,
  //         );
  //       case 401:
  //         throw new InternalServerErrorException(
  //           'Failed to login to Salesforce',
  //         );
  //       default:
  //         throw error;
  //     }
  //   }
  // }
}
