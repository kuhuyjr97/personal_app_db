import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';

import { CalculateBillngsCommand } from '@/modules/commands/calculate_billings.command';

@Module({
  imports: [CommandModule],
  providers: [CalculateBillngsCommand],
})
export class CommandApplicationModule {}
