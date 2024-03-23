import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/auth.guard';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello() {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('get_secret')
  async getEnv() {
    return this.appService.getEnv();
  }
}
