import { Global, Module } from '@nestjs/common';

import { PlaywrightService } from './playwright.service';

@Global()
@Module({
  providers: [PlaywrightService],
  exports: [PlaywrightService],
})
export class PlaywrightModule {}
