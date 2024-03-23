import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import {
  AdminChangeEmailRequest,
  AdminChangePasswordRequest,
  AdminForgotPasswordRequest,
  AdminLoginRequest,
  AdminResetPasswordRequest,
  AdminVerifyEmailRequest,
} from "api";
import bcrypt from "bcryptjs";
import { admin, adminAccount } from "database";
import { eq } from "drizzle-orm";
import request from "supertest";

import { configuration } from "@/config/configuration";
import { appFilters } from "@/exception_filters/app_filters";
import { databaseReset } from "@/libs/cleanup_database";
import { AuthModule } from "@/modules/auth/auth.module";
import { DatabaseModule } from "@/modules/database/database.module";
import { Database } from "@/modules/database/database.providers";
import { EmailModule } from "@/modules/email/email.module";
import { EmailService } from "@/modules/email/email.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  let db: Database;
  let emailService: EmailService;
  let jwtService: JwtService;

  let adminId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ".env.testing",
          isGlobal: true,
          load: [configuration],
        }),
        DatabaseModule,
        EmailModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    emailService = moduleFixture.get<EmailService>(EmailService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    db = moduleFixture.get<Database>("DATABASE");

    app.useGlobalFilters(...appFilters);

    await app.init();

    await databaseReset();

    const result = await db
      .insert(admin)
      .values({
        firstName: "firstName",
      })
      .returning({ adminId: admin.id });

    adminId = result.find(Boolean)!.adminId;
  });

  afterEach(async () => {
    await app.close();
  });

  describe("/verify_account (POST)", () => {
    it("should success", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const anotherResult = await db
        .insert(adminAccount)
        .values({
          email: "test2@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          anotherAccountId: adminAccount.id,
        });
      expect((await db.query.adminAccount.findMany({})).length).toEqual(2);

      const { accountId, email } = result.find(Boolean)!;

      const token = jwtService.sign(
        {
          accountId,
          email,
          type: "register",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_account")
        .send(params);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});

      expect((await db.query.adminAccount.findMany({})).length).toEqual(2);

      // account should be verified
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(email);
      expect(account!.isEmailVerified).toEqual(true);
      expect(account!.status).toEqual("active");

      // anotherAccount should not be verified
      const { anotherAccountId } = anotherResult.find(Boolean)!;
      const anotherAccount = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, anotherAccountId),
      });
      expect(anotherAccount!.isEmailVerified).toEqual(false);
      expect(anotherAccount!.status).toEqual("pending_verify");
    });

    it("should failed when type not register", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;

      const token = jwtService.sign(
        {
          accountId,
          email,
          type: "email_change",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token: token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_account")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.code).toEqual("INVALID_TOKEN");

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.isEmailVerified).toEqual(false);
      expect(account!.status).toEqual("pending_verify");
    });

    it("should failed when invalid token", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;

      const token = jwtService.sign(
        {
          accountId,
          email,
          type: "register",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token: token.slice(0, -1),
      };

      const response = await request(app.getHttpServer())
        .post("/verify_account")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("invalid signature");

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.isEmailVerified).toEqual(false);
      expect(account!.status).toEqual("pending_verify");
    });

    it("should failed when token expired", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;

      const token = jwtService.sign(
        {
          accountId,
          email,
          type: "register",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `1s`,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_account")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("jwt expired");

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.isEmailVerified).toEqual(false);
      expect(account!.status).toEqual("pending_verify");
    });

    it("should failed when invalid secret", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;

      const token = jwtService.sign(
        {
          accountId,
          email,
          type: "register",
        },
        {
          secret: "invalid_secret",
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_account")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("invalid signature");

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.isEmailVerified).toEqual(false);
      expect(account!.status).toEqual("pending_verify");
    });
  });

  describe("/login (POST)", () => {
    it("should success", async () => {
      const email = "test@email.com";
      const password = "Pass1234";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await db.insert(adminAccount).values({
        email,
        hash,
        status: "active",
        isEmailVerified: true,
        adminId,
      });

      const params: AdminLoginRequest = {
        email,
        password,
      };

      const response = await request(app.getHttpServer())
        .post("/login")
        .send(params);

      expect(response.status).toEqual(200);
      expect(response.body.token).not.toBeNull();
    });

    it("should failed when email wrong", async () => {
      const email = "test@email.com";
      const password = "Pass1234";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await db.insert(adminAccount).values({
        email,
        hash,
        status: "active",
        isEmailVerified: true,
        adminId,
      });

      const params: AdminLoginRequest = {
        email: "wrong_test@email.com",
        password,
      };

      const response = await request(app.getHttpServer())
        .post("/login")
        .send(params);

      expect(response.status).toEqual(401);
      expect(response.body.token).toBeUndefined();
    });

    it("should failed when password wrong", async () => {
      const email = "test@email.com";
      const password = "Pass1234";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await db.insert(adminAccount).values({
        email,
        hash,
        status: "active",
        isEmailVerified: true,
        adminId,
      });

      const params: AdminLoginRequest = {
        email,
        password: "Pass12345",
      };

      const response = await request(app.getHttpServer())
        .post("/login")
        .send(params);

      expect(response.status).toEqual(401);
      expect(response.body.token).toBeUndefined();
    });
  });

  describe("/change_email (PATCH)", () => {
    it("should success", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      // not changed
      expect(account!.email).toEqual(email);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    it("should failed when email dupicated", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const anotherResult = await db
        .insert(adminAccount)
        .values({
          email: "test2@email.com",
          hash: "hash",
          status: "pending_verify",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          anotherAccountEmail: adminAccount.email,
        });
      expect((await db.query.adminAccount.findMany({})).length).toEqual(2);

      const { accountId } = result.find(Boolean)!;
      const { anotherAccountEmail } = anotherResult.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangeEmailRequest = {
        email: anotherAccountEmail,
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.code).toEqual("DUPLICATE_EMAIL");

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    // TODO ここでやるべきではない
    it("should failed when empty access_token", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        // .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(401);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    // TODO ここでやるべきではない
    it("should failed when invalid access_token", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken.slice(0, -1), { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(401);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    // TODO ここでやるべきではない
    it("should failed when access_token expired", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };

      const accessToken = await jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET_KEY_VERIFY,
        expiresIn: `1s`,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(401);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    // TODO ここでやるべきではない
    it("should failed when access_token invalid secret", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload, {
        secret: "invalid_secret",
        expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
      });

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(401);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    // TODO ここでやるべきではない
    it("should failed when status not active", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "inactive",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(403);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    // TODO ここでやるべきではない
    it("should failed when email not verfied", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: false,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangeEmailRequest = {
        email: "test2@email.com",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_email")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(403);

      // expect(emailServiceMock.calls.length).toEqual(1);
    });
  });

  describe("/verify_change_email (POST)", () => {
    it("should success", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const anotherResult = await db
        .insert(adminAccount)
        .values({
          email: "test2@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          anotherAccountId: adminAccount.id,
          anotherAccountEmail: adminAccount.email,
        });
      expect((await db.query.adminAccount.findMany({})).length).toEqual(2);

      const { accountId } = result.find(Boolean)!;
      const newEmail = "change@email.com";

      const token = jwtService.sign(
        {
          accountId,
          email: newEmail,
          type: "change_email",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_change_email")
        .send(params);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});

      expect((await db.query.adminAccount.findMany({})).length).toEqual(2);

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(newEmail);

      // anotherAccount should not be change email
      const { anotherAccountId, anotherAccountEmail } =
        anotherResult.find(Boolean)!;
      const anotherAccount = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, anotherAccountId),
      });
      expect(anotherAccount!.email).toEqual(anotherAccountEmail);
    });

    it("should failed when email dupicated", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const anotherResult = await db
        .insert(adminAccount)
        .values({
          email: "test2@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          anotherAccountEmail: adminAccount.email,
        });
      expect((await db.query.adminAccount.findMany({})).length).toEqual(2);

      const { accountId, email } = result.find(Boolean)!;
      const { anotherAccountEmail } = anotherResult.find(Boolean)!;

      const token = jwtService.sign(
        {
          accountId,
          email: anotherAccountEmail,
          type: "change_email",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_change_email")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.code).toEqual("DUPLICATE_EMAIL");

      // account should not be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(email);
    });

    it("should failed when type not email_change", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;
      const newEmail = "change@email.com";

      const token = jwtService.sign(
        {
          accountId,
          email: newEmail,
          type: "register",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_change_email")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.code).toEqual("INVALID_TOKEN");

      // account should not be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(email);
    });

    it("should failed when invalid token", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;
      const newEmail = "change@email.com";

      const token = jwtService.sign(
        {
          accountId,
          email: newEmail,
          type: "email_change",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      const params: AdminVerifyEmailRequest = {
        token: token.slice(0, -1),
      };

      const response = await request(app.getHttpServer())
        .post("/verify_change_email")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("invalid signature");

      // account should not be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(email);
    });

    it("should failed when token expired", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;
      const newEmail = "change@email.com";

      const token = jwtService.sign(
        {
          accountId,
          email: newEmail,
          type: "email_change",
        },
        {
          secret: process.env.JWT_SECRET_KEY_VERIFY,
          expiresIn: `1s`,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_change_email")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("jwt expired");

      // account should not be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(email);
    });

    it("should failed when invalid secret", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
          email: adminAccount.email,
        });

      const { accountId, email } = result.find(Boolean)!;
      const newEmail = "change@email.com";

      const token = jwtService.sign(
        {
          accountId,
          email: newEmail,
          type: "email_change",
        },
        {
          secret: "invalid_secret",
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_VERIFY}s`,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const params: AdminVerifyEmailRequest = {
        token,
      };

      const response = await request(app.getHttpServer())
        .post("/verify_change_email")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("invalid signature");

      // account should not be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.email).toEqual(email);
    });
  });

  describe("/change_password (PATCH)", () => {
    it("should success", async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("Pass1234", salt);

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash,
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangePasswordRequest = {
        old_password: "Pass1234",
        new_password: "newPass1234",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_password")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });

      expect(account!.hash).not.toEqual(hash);
    });

    it("should failed when old_password is wrong", async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("Pass1234", salt);

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash,
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangePasswordRequest = {
        old_password: "WrongPass1234",
        new_password: "newPass1234",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_password")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.code).toEqual("OLD_PASSWORD_NOT_MATCH");

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });

      expect(account!.hash).toEqual(hash);
    });

    it("should failed when short new_password", async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("Pass1234", salt);

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash,
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangePasswordRequest = {
        old_password: "Pass1234",
        new_password: "Short12",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_password")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(422);

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });

      expect(account!.hash).toEqual(hash);
    });

    // it("should failed when missing small letters in new_password", async () => {
    //   const salt = await bcrypt.genSalt(10);
    //   const hash = await bcrypt.hash("Pass1234", salt);

    //   const result = await db
    //     .insert(adminAccount)
    //     .values({
    //       email: "test@email.com",
    //       hash,
    //       status: "active",
    //       isEmailVerified: true,
    adminId;
    //     })
    //     .returning({
    //       accountId: adminAccount.id,
    //     });

    //   const { accountId } = result.find(Boolean)!;

    //   const payload = {
    //     sub: accountId,
    //   };
    //   const accessToken = await jwtService.signAsync(payload);

    //   const params: AdminChangePasswordRequest = {
    //     old_password: "Pass1234",
    //     new_password: "NEWPASS1234",
    //   };

    //   const response = await request(app.getHttpServer())
    //     .patch("/change_password")
    //     .auth(accessToken, { type: "bearer" })
    //     .send(params);

    //   expect(response.status).toEqual(422);

    //   const account = await db.query.adminAccount.findFirst({
    //     where: eq(adminAccount.id, accountId),
    //   });

    //   expect(account!.hash).toEqual(hash);
    // });

    // it("should failed when missing big letters in new_password", async () => {
    //   const salt = await bcrypt.genSalt(10);
    //   const hash = await bcrypt.hash("Pass1234", salt);

    //   const result = await db
    //     .insert(adminAccount)
    //     .values({
    //       email: "test@email.com",
    //       hash,
    //       status: "active",
    //       isEmailVerified: true,
    adminId;
    //     })
    //     .returning({
    //       accountId: adminAccount.id,
    //     });

    //   const { accountId } = result.find(Boolean)!;

    //   const payload = {
    //     sub: accountId,
    //   };
    //   const accessToken = await jwtService.signAsync(payload);

    //   const params: AdminChangePasswordRequest = {
    //     old_password: "Pass1234",
    //     new_password: "newpass1234",
    //   };

    //   const response = await request(app.getHttpServer())
    //     .patch("/change_password")
    //     .auth(accessToken, { type: "bearer" })
    //     .send(params);

    //   expect(response.status).toEqual(422);

    //   const account = await db.query.adminAccount.findFirst({
    //     where: eq(adminAccount.id, accountId),
    //   });

    //   expect(account!.hash).toEqual(hash);
    // });

    it("should failed when missing number in new_password", async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("Pass1234", salt);

      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash,
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;

      const payload = {
        sub: accountId,
      };
      const accessToken = await jwtService.signAsync(payload);

      const params: AdminChangePasswordRequest = {
        old_password: "Pass1234",
        new_password: "newPassword",
      };

      const response = await request(app.getHttpServer())
        .patch("/change_password")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(422);

      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });

      expect(account!.hash).toEqual(hash);
    });
  });

  describe("/forgot_password (POST)", () => {
    it("should success", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      await db.insert(adminAccount).values({
        email: "test@email.com",
        hash: "hash",
        status: "active",
        isEmailVerified: true,
        adminId,
      });

      const params: AdminForgotPasswordRequest = {
        email: "test@email.com",
      };

      const response = await request(app.getHttpServer())
        .post("/forgot_password")
        .send(params);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});

      // expect(emailServiceMock.calls.length).toEqual(1);
    });

    it("should failed when email missing", async () => {
      const emailServiceMock = jest
        .spyOn(emailService, "sendEmail")
        .mockImplementation().mock;

      const params: AdminForgotPasswordRequest = {
        email: "test@email.com",
      };

      const response = await request(app.getHttpServer())
        .post("/forgot_password")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.code).toEqual("ACCOUNT_NOT_FOUND");

      // expect(emailServiceMock.calls.length).toEqual(1);
    });
  });

  describe("/reset_password (POST)", () => {
    it("should success", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;
      const newPassword = "Pass1234";

      const token = jwtService.sign(
        {
          accountId,
        },
        {
          secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
        },
      );

      const params: AdminResetPasswordRequest = {
        token,
        password: newPassword,
      };

      const response = await request(app.getHttpServer())
        .post("/reset_password")
        .send(params);

      console.log(response.body);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.hash).not.toEqual("hash");
    });

    it("should failed when short password", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;
      const newPassword = "Pass123";

      const token = jwtService.sign(
        {
          accountId,
        },
        {
          secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
        },
      );

      const params: AdminResetPasswordRequest = {
        token,
        password: newPassword,
      };

      const response = await request(app.getHttpServer())
        .post("/reset_password")
        .send(params);

      expect(response.status).toEqual(422);

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.hash).toEqual("hash");
    });

    // it("should failed when missing small letters in password", async () => {
    //   const result = await db
    //     .insert(adminAccount)
    //     .values({
    //       email: "test@email.com",
    //       hash: "hash",
    //       status: "active",
    //       isEmailVerified: true,
    adminId;
    //     })
    //     .returning({
    //       accountId: adminAccount.id,
    //     });

    //   const { accountId } = result.find(Boolean)!;
    //   const newPassword = "PASS1234";

    //   const token = jwtService.sign(
    //     {
    //       accountId,
    //     },
    //     {
    //       secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
    //       expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
    //     },
    //   );

    //   const params: AdminResetPasswordRequest = {
    //     token,
    //     password: newPassword,
    //   };

    //   const response = await request(app.getHttpServer())
    //     .post("/reset_password")
    //     .send(params);

    //   expect(response.status).toEqual(422);

    //   // account should be change email
    //   const account = await db.query.adminAccount.findFirst({
    //     where: eq(adminAccount.id, accountId),
    //   });
    //   expect(account!.hash).toEqual("hash");
    // });

    // it("should failed when missing big letters in password", async () => {
    //   const result = await db
    //     .insert(adminAccount)
    //     .values({
    //       email: "test@email.com",
    //       hash: "hash",
    //       status: "active",
    //       isEmailVerified: true,
    adminId;
    //     })
    //     .returning({
    //       accountId: adminAccount.id,
    //     });

    //   const { accountId } = result.find(Boolean)!;
    //   const newPassword = "pass1234";

    //   const token = jwtService.sign(
    //     {
    //       accountId,
    //     },
    //     {
    //       secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
    //       expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
    //     },
    //   );

    //   const params: AdminResetPasswordRequest = {
    //     token,
    //     password: newPassword,
    //   };

    //   const response = await request(app.getHttpServer())
    //     .post("/reset_password")
    //     .send(params);

    //   expect(response.status).toEqual(422);

    //   // account should be change email
    //   const account = await db.query.adminAccount.findFirst({
    //     where: eq(adminAccount.id, accountId),
    //   });
    //   expect(account!.hash).toEqual("hash");
    // });

    it("should failed when missing number in password", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;
      const newPassword = "Password";

      const token = jwtService.sign(
        {
          accountId,
        },
        {
          secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
        },
      );

      const params: AdminResetPasswordRequest = {
        token,
        password: newPassword,
      };

      const response = await request(app.getHttpServer())
        .post("/reset_password")
        .send(params);

      expect(response.status).toEqual(422);

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.hash).toEqual("hash");
    });

    it("should failed when invalid token", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;
      const newPassword = "Pass1234";

      const token = jwtService.sign(
        {
          accountId,
        },
        {
          secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
        },
      );

      const params: AdminResetPasswordRequest = {
        token: token.slice(0, -1),
        password: newPassword,
      };

      const response = await request(app.getHttpServer())
        .post("/reset_password")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("invalid signature");

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.hash).toEqual("hash");
    });

    it("should failed when token expired", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;
      const newPassword = "Pass1234";

      const token = jwtService.sign(
        {
          accountId,
        },
        {
          secret: process.env.JWT_SECRET_KEY_PASSWORD_RESET,
          expiresIn: `1s`,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const params: AdminResetPasswordRequest = {
        token,
        password: newPassword,
      };

      const response = await request(app.getHttpServer())
        .post("/reset_password")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("jwt expired");

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.hash).toEqual("hash");
    });

    it("should failed when invalid secret", async () => {
      const result = await db
        .insert(adminAccount)
        .values({
          email: "test@email.com",
          hash: "hash",
          status: "active",
          isEmailVerified: true,
          adminId,
        })
        .returning({
          accountId: adminAccount.id,
        });

      const { accountId } = result.find(Boolean)!;
      const newPassword = "Pass1234";

      const token = jwtService.sign(
        {
          accountId,
        },
        {
          secret: "invalid_secret",
          expiresIn: `${process.env.JWT_EXPIRES_IN_SECOND_PASSWORD_RESET}s`,
        },
      );

      const params: AdminResetPasswordRequest = {
        token,
        password: newPassword,
      };

      const response = await request(app.getHttpServer())
        .post("/reset_password")
        .send(params);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("invalid signature");

      // account should be change email
      const account = await db.query.adminAccount.findFirst({
        where: eq(adminAccount.id, accountId),
      });
      expect(account!.hash).toEqual("hash");
    });
  });
});
