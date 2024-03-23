import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getEnv() {
    return {
      APP_ENV: this.config.get<string>('app.env'),
      GOOGLE_CLIENT_ID: this.config.get<string>('google.clientId') || '',
      GOOGLE_CLIENT_SECRET:
        this.config.get<string>('google.clientSecret') || '',
      GOOGLE_REDIRECT_URI: this.config.get<string>('google.redirectUri') || '',
      S3_VISA_BUCKET: this.config.get<string>('s3.bucket') || '',
    };
  }
}
