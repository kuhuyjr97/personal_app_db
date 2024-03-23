import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { NewApplicationCreatedEvent } from '@/modules/automation/events/new_application_created.event';

import { ApplicationRequest } from './requests/application.request';

@UseGuards(JwtAuthGuard)
@Controller('application_forms')
export class ApplicationFormController {
  constructor(private readonly emitter: EventEmitter2) {}

  @Post()
  async runAutomation(@Body() req: ApplicationRequest) {
    this.emitter.emit(
      'new_application_created',
      new NewApplicationCreatedEvent({
        applicationId: req.id,
      }),
    );

    return 'sent';
  }
}
