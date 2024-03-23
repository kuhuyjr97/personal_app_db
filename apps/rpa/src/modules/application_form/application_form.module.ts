import { Module } from '@nestjs/common';

import { ApplicationFormController } from './application_form.controller';

@Module({
  controllers: [ApplicationFormController],
})
export class ApplicationFormModule {}
