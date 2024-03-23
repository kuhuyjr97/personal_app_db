import { NoSuchKey, S3 } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectS3 } from 'nestjs-s3';

import { randomUUID } from 'crypto';
import path from 'path';

@Injectable()
export class S3Client {
  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly configService: ConfigService,
  ) {}

  DEFAULT_BUCKET = this.configService.get<string>('s3.bucket');

  async getFileStream(key: string) {
    try {
      const response = await this.s3.getObject({
        Bucket: this.DEFAULT_BUCKET,
        Key: key,
      });

      const {
        $metadata: { httpStatusCode },
      } = response;

      if (httpStatusCode !== 200 || !response.Body) {
        throw new Error('FILE_FETCH_FAILED');
      }

      return await response.Body.transformToByteArray();
    } catch (error) {
      if (error instanceof NoSuchKey) {
        throw new Error('FILE_NOT_FOUND');
      }

      throw new Error('FILE_FETCH_FAILED');
    }
  }

  async upload(
    buffer: Buffer | Uint8Array,
    originalname: string,
    uploadPath: string | null,
  ): Promise<string> {
    try {
      const fileName = uploadPath || randomUUID();
      const ext = path.extname(originalname);

      let key = fileName;
      if (ext) key += `${ext}`;

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

  async delete(key: string) {
    try {
      await this.s3.deleteObject({
        Bucket: this.DEFAULT_BUCKET,
        Key: key,
      });
    } catch (error) {
      console.error('delete error', JSON.stringify(error));
    }
  }
}
