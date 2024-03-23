import { Global, Module } from '@nestjs/common';

import { databaseProviders } from './database.providers';

@Global()
@Module({
  exports: [...databaseProviders],
  providers: [...databaseProviders],
})
export class DatabaseModule {}
