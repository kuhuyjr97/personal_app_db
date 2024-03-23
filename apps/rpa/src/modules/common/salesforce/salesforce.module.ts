import { Module } from '@nestjs/common';

import { SalesforceClient } from './salesforce.client';

@Module({
  providers: [SalesforceClient],
  exports: [SalesforceClient],
})
export class SalesforceModule {}
