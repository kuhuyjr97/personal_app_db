import { ENV, Schemas } from './schema';

export const configuration = () => {
  const env: ENV = ENV.parse(process.env);

  return {
    app: {
      env: env.APP_ENV,
      adminEmail: env.ADMIN_EMAIL,
      itsEmail: env.ITS_EMAIL,
    },
    appsmith: {
      secret: env.APPSMITH_JWT_SECRET,
    },
    aws: {
      accessKey: env.AWS_ACCESS_KEY,
      region: env.AWS_REGION,
      secretKey: env.AWS_KEY_SECRET,
    },
    database: {
      url: env.DATABASE_URL,
    },
    email: {
      // prod/stg
      fromAddress: env.EMAIL_FROM_ADDRESS,
      fromName: env.EMAIL_FROM_NAME,

      // local
      host: env.EMAIL_HOST,
      password: env.EMAIL_PASSWORD,
      port: env.EMAIL_PORT,
      user: env.EMAIL_USER,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
    },
    mobileS3: {
      accessKey: env.MOBILE_S3_ACCESS_KEY,
      bucket: env.MOBILE_S3_BUCKET,
      secretKey: env.MOBILE_S3_KEY_SECRET,
      region: env.MOBILE_S3_REGION,
    },
    s3: {
      bucket: env.AWS_S3_BUCKET,
    },
    ses: {
      accessKey: env.SES_AWS_ACCESS_KEY,
      region: env.SES_AWS_REGION,
      secretKey: env.SES_AWS_KEY_SECRET,
    },
    sf: {
      clientId: env.SF_CLIENT_ID,
      clientSecret: env.SF_CLIENT_SECRET,
      password: env.SF_PASSWORD,
      username: env.SF_USERNAME,
    },
  };
};

export const validate = (env: Record<string, any>) => {
  const appEnv = Schemas['common'].shape.APP_ENV.safeParse(env.APP_ENV);

  if (!appEnv.success) {
    return appEnv.error;
  }

  const schema = Schemas['common'].merge(Schemas[appEnv.data]);

  const result = schema.safeParse(env);

  if (result.success === false) {
    for (const error of result.error.errors) {
      console.error(JSON.stringify(error));
    }
    // TODO: ???
    throw Error('INVALID_CONFIG');
  }

  return result.data;
};
