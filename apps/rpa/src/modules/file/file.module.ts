import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';

import { FileService } from './file.service';
import { MobileS3Client } from './mobile_s3.client';
import { S3Client } from './s3.client';

@Global()
@Module({
  providers: [FileService, S3Client, MobileS3Client],
  imports: [
    S3Module.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          credentials: {
            accessKeyId: configService.get<string>('aws.accessKey')!,
            secretAccessKey: configService.get<string>('aws.secretKey')!,
          },
          region: configService.get<string>('aws.region'),
          endpoint:
            configService.get<string>('app.env') !== 'development'
              ? undefined
              : 'http://minio:9000',
          forcePathStyle:
            configService.get<string>('app.env') !== 'development'
              ? undefined
              : true,
        },
      }),
    }),
  ],
  exports: [FileService],
})
export class FileModule {}
