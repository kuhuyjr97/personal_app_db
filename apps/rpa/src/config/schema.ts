import { z } from 'zod';

const commonSchema = z.object({
  APP_ENV: z.enum(['development', 'production', 'staging']),
  APPSMITH_JWT_SECRET: z.string(),
  ADMIN_EMAIL: z.string().email(),
  ITS_EMAIL: z.string().email(),
  DATABASE_URL: z.string(),
  AWS_ACCESS_KEY: z.string(),
  AWS_KEY_SECRET: z.string(),
  AWS_REGION: z.string(),
  AWS_S3_BUCKET: z.string(),
  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_FROM_NAME: z.string(),
  SF_CLIENT_ID: z.string(),
  SF_CLIENT_SECRET: z.string(),
  SF_PASSWORD: z.string(),
  SF_USERNAME: z.string(),
});
const developmentSchema = z.object({
  EMAIL_HOST: z.string(),
  EMAIL_PASSWORD: z.string(),
  EMAIL_PORT: z.string(),
  EMAIL_USER: z.string(),
});
const productionSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  MOBILE_S3_ACCESS_KEY: z.string(),
  MOBILE_S3_BUCKET: z.string(),
  MOBILE_S3_REGION: z.string(),
  MOBILE_S3_KEY_SECRET: z.string(),
  SES_AWS_ACCESS_KEY: z.string(),
  SES_AWS_REGION: z.string(),
  SES_AWS_KEY_SECRET: z.string(),
});
const stagingSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  MOBILE_S3_ACCESS_KEY: z.string(),
  MOBILE_S3_BUCKET: z.string(),
  MOBILE_S3_REGION: z.string(),
  MOBILE_S3_KEY_SECRET: z.string(),
  SES_AWS_ACCESS_KEY: z.string(),
  SES_AWS_REGION: z.string(),
  SES_AWS_KEY_SECRET: z.string(),
});
export const Schemas = {
  common: commonSchema,
  development: developmentSchema,
  production: productionSchema,
  staging: stagingSchema,
};
export const ENV = commonSchema
  .merge(developmentSchema.partial())
  .merge(productionSchema.partial())
  .merge(stagingSchema.partial());
export type ENV = z.infer<typeof ENV>;
