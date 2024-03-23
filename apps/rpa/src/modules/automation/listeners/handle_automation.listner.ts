import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AutomationService } from '@/modules/automation/automation.service';
import { NewApplicationCreatedEvent } from '@/modules/automation/events/new_application_created.event';

@Injectable()
export class HandleAutomationListener {
  constructor(private automationService: AutomationService) {}

  @OnEvent('new_application_created', { async: true, promisify: true })
  async handle(event: NewApplicationCreatedEvent) {
    await this.automationService.execute(event.applicationId);
  }
}
