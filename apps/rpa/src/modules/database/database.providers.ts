import { ConfigModule, ConfigService } from '@nestjs/config';
import { Schema } from 'database';
import { type ExtractTablesWithRelations } from 'drizzle-orm';
import { type PgTransaction } from 'drizzle-orm/pg-core';
import {
  type PostgresJsDatabase,
  type PostgresJsQueryResultHKT,
  drizzle,
} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const databaseProviders = [
  {
    imports: [ConfigModule],
    inject: [ConfigService],
    provide: 'DATABASE',
    useFactory: async (configService: ConfigService) => {
      const url = configService.get<string>('database.url')!;

      const client = postgres(url, { ssl: 'require' });
      const db = drizzle(client, { schema: Schema });

      return db;
    },
  },
];
export type Database = PostgresJsDatabase<Schema>;
export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;
