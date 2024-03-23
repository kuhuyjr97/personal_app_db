import { Module } from '@nestjs/common';

import { HinataoModule } from '@/modules/hinatao/hinatao.module';
import { WifiModule } from '@/modules/wifi/wifi.module';

import { AutomationService } from './automation.service';
import { HandleAutomationListener } from './listeners/handle_automation.listner';

@Module({
  imports: [HinataoModule, WifiModule],
  providers: [AutomationService, HandleAutomationListener],
  exports: [AutomationService],
})
export class AutomationModule {}
