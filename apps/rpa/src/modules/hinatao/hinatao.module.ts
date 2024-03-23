import { Module } from '@nestjs/common';

import { HinataoService } from './hinatao.service';

@Module({
  providers: [HinataoService],
  exports: [HinataoService],
})
export class HinataoModule {}
