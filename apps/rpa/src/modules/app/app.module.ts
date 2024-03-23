import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';

import { configuration, validate } from '@/config/configuration';
import { ApplicationFormModule } from '@/modules/application_form/application_form.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AutomationModule } from '@/modules/automation/automation.module';
import { CommandApplicationModule } from '@/modules/commands/command_application.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { EmailModule } from '@/modules/email/email.module';
import { FileModule } from '@/modules/file/file.module';
import { HealthModule } from '@/modules/health/health.module';
import { HinataoModule } from '@/modules/hinatao/hinatao.module';
import { PlaywrightModule } from '@/modules/playwright/playwright.module';
import { WifiModule } from '@/modules/wifi/wifi.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ApplicationFormModule,
    AuthModule,
    AutomationModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    CommandApplicationModule,
    DatabaseModule,
    EmailModule,
    EventEmitterModule.forRoot({
      global: true,
    }),
    FileModule,
    HealthModule,
    HinataoModule,
    LoggerModule.forRoot({
      exclude: [{ method: RequestMethod.ALL, path: 'health' }],
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    PlaywrightModule,
    WifiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
