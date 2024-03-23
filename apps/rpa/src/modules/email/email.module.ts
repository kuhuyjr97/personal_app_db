import * as aws from '@aws-sdk/client-ses';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { EmailService } from '@/modules/email/email.service';

import { join } from 'path';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (
          ['staging', 'production'].includes(
            configService.get<string>('app.env') || '',
          )
        ) {
          const ses = new aws.SES({
            region: configService.get<string>('ses.region'),
            credentials: {
              accessKeyId: configService.get<string>('ses.accessKey')!,
              secretAccessKey: configService.get<string>('ses.secretKey')!,
            },
          });

          return {
            transport: {
              SES: { ses, aws },
            },
            defaults: {
              from: `${configService.get<string>(
                'email.fromName',
              )} <${configService.get<string>('email.fromAddress')}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
            options: {
              partials: {
                dir: join(__dirname, 'templates/partials'),
                options: {
                  strict: true,
                },
              },
            },
          };
        } else {
          return {
            transport: {
              host: configService.get<string>('email.host'),
              port: Number(configService.get<string>('email.port')),
              secure: false,
              auth: {
                user: configService.get<string>('email.user'),
                pass: configService.get<string>('email.password'),
              },
            },
            defaults: {
              from: `${configService.get<string>(
                'email.fromName',
              )} <${configService.get<string>('email.fromAddress')}>`,
            },
            template: {
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
            options: {
              partials: {
                dir: join(__dirname, 'templates/partials'),
                options: {
                  strict: true,
                },
              },
            },
          };
        }
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
