import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MobileS3Client } from '@/modules/file/mobile_s3.client';
import { S3Client } from '@/modules/file/s3.client';

@Injectable()
export class FileService {
  constructor(
    private readonly s3Client: S3Client,
    private readonly mobileS3Client: MobileS3Client,
    private readonly configService: ConfigService,
  ) {}

  SALESFORCE_BASE_DIR = 'Home_Internet_User_Registration';

  async uploadRecidenceCardFront(key: string, leadId: string): Promise<any> {
    const uploadPath = `${
      this.SALESFORCE_BASE_DIR
    }/${leadId}/residence_front_${Math.floor(new Date().getTime() / 1000)}`;

    return await this.upload(key, uploadPath);
  }

  async uploadRecidenceCardBack(key: string, leadId: string): Promise<any> {
    const uploadPath = `${
      this.SALESFORCE_BASE_DIR
    }/${leadId}/residence_left_${Math.floor(new Date().getTime() / 1000)}`;

    return await this.upload(key, uploadPath);
  }

  // get from appsmith S3
  private async getUploadedFileFromAppsmith(key: string) {
    const appsmithBaseDir = 'img';
    return this.s3Client.getFileStream(`${appsmithBaseDir}/${key}`);
  }

  // upload to mobile S3
  private async upload(key: string, uploadPath: string) {
    const fileUint8Array = await this.getUploadedFileFromAppsmith(key);
    const originalName = key.split('/').pop() || key;

    if (this.configService.get<string>('app.env') !== 'development') {
      return await this.mobileS3Client.upload(
        fileUint8Array,
        originalName,
        uploadPath,
      );
    } else {
      return await this.s3Client.upload(
        fileUint8Array,
        originalName,
        uploadPath,
      );
    }
  }
}
