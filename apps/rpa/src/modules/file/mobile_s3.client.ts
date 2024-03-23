import { S3 } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { randomUUID } from 'crypto';

@Injectable()
export class MobileS3Client {
  private readonly s3: S3;
  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      region: this.configService.get<string>('mobileS3.region')!,
      credentials: {
        accessKeyId: this.configService.get<string>('mobileS3.accessKey')!,
        secretAccessKey: this.configService.get<string>('mobileS3.secretKey')!,
      },
    });
  }

  DEFAULT_BUCKET = this.configService.get<string>('mobileS3.bucket');

  async upload(
    buffer: Buffer | Uint8Array,
    originalname: string,
    uploadPath: string | null,
  ): Promise<string> {
    try {
      const key = uploadPath || randomUUID();

      const response = await this.s3.putObject({
        Bucket: this.DEFAULT_BUCKET,
        Key: key,
        Body: buffer,
        ContentEncoding: 'base64',
      });

      const {
        $metadata: { httpStatusCode },
      } = response;

      if (httpStatusCode !== 200) {
        console.log('s3 error response', JSON.stringify(response));
        throw new Error();
      }

      return key;
    } catch (error) {
      console.error('upload error', JSON.stringify(error));
      throw new Error('FILE_UPLOAD_FAILED');
    }
  }
}
