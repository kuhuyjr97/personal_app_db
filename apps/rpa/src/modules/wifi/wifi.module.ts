import { Module } from '@nestjs/common';

import { SalesforceModule } from '@/modules/common/salesforce/salesforce.module';

import { WifiService } from './wifi.service';

@Module({
  imports: [SalesforceModule],
  providers: [WifiService],
  exports: [WifiService],
})
export class WifiModule {}
