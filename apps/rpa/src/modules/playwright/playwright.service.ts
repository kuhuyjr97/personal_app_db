import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HinataoParams, PlaywrightResponse } from 'api';
import { exec } from 'child_process';
import { promisify } from 'node:util';

import { EmailService } from '@/modules/email/email.service';

import { FAILED, RESPONSE, SUCCESS } from './response_types';

const execAsync = promisify(exec);

@Injectable()
export class PlaywrightService {
  constructor(
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  IS_DEV = this.config.get<string>('app.env') === 'development';
  SCRIPTS_PATH = 'modules/playwright/scripts';
  BASE_PATH = this.IS_DEV
    ? `tsx src/${this.SCRIPTS_PATH}`
    : `node apps/rpa/dist/${this.SCRIPTS_PATH}`;
  FILE_EXT = this.IS_DEV ? 'ts' : 'js';

  async sendHinataoTermsAgreement(email: string): Promise<PlaywrightResponse> {
    const { stderr, stdout } = await execAsync(
      `${this.BASE_PATH}/send_terms_agreement.${this.FILE_EXT} --email ${email}`,
    );
    if (stderr) console.log('stderr', stderr);

    if (stdout) {
      console.log('stdout', stdout);

      const response = JSON.parse(
        Buffer.from(stdout, 'base64').toString('utf8'),
      ) as RESPONSE;
      console.log('decoded response', response);

      if (response.code === SUCCESS) {
        return {
          message: 'ok',
        } as PlaywrightResponse;
      }

      if (response.code === FAILED) {
        return {
          message: response.image ? 'has_image' : 'no_image',
          image: response.image || undefined,
        } as PlaywrightResponse;
      }
    }

    await this.reportUnknownError(email);

    throw new InternalServerErrorException();
  }

  async applyHinataoForm(params: HinataoParams): Promise<PlaywrightResponse> {
    const paramsString = JSON.stringify(params);
    const buffer = Buffer.from(paramsString).toString('base64');
    const { stderr, stdout } = await execAsync(
      `${this.BASE_PATH}/apply_form.${this.FILE_EXT} --params ${buffer}`,
    );

    if (stderr) console.log('stderr', stderr);

    if (stdout) {
      console.log('stdout', stdout);

      const response = JSON.parse(
        Buffer.from(stdout, 'base64').toString('utf8'),
      ) as RESPONSE;
      console.log('decoded response', response);

      if (response.code === SUCCESS) {
        return {
          message: 'ok',
        } as PlaywrightResponse;
      }

      if (response.code === FAILED) {
        return {
          message: response.image ? 'has_image' : 'no_image',
          image: response.image || undefined,
        } as PlaywrightResponse;
      }
    }

    await this.reportUnknownError(params.email);

    throw new InternalServerErrorException();
  }

  private async reportUnknownError(email: string) {
    await this.emailService.sendEmail(
      this.config.get<string>('app.itsEmail')!,
      'unknown error occurred at playwright application',
      'report_playwright_unknown_error',
      {
        email,
      },
    );
  }
}
