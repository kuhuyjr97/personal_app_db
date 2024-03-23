import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import {
  AdminChangeEmailRequest,
  AdminChangePasswordRequest,
  AdminForgotPasswordRequest,
  AdminLoginRequest,
  AdminProfileUpdate,
  AdminResetPasswordRequest,
  AdminVerifyEmailRequest,
} from "api";
import bcrypt from "bcryptjs";
import { admin, adminAccount, adminCompany, company } from "database";
import { eq } from "drizzle-orm";
import request from "supertest";
import { omitProperties } from "utils/src";

import { configuration } from "@/config/configuration";
import { appFilters } from "@/exception_filters/app_filters";
import { databaseReset } from "@/libs/cleanup_database";
import { AuthModule } from "@/modules/auth/auth.module";
import { DatabaseModule } from "@/modules/database/database.module";
import { Database } from "@/modules/database/database.providers";
import { EmailModule } from "@/modules/email/email.module";
import { EmailService } from "@/modules/email/email.service";
import { ProfileModule } from "@/modules/profile/profile.module";

describe("ProfileController (e2e)", () => {
  let app: INestApplication;

  let db: Database;
  let jwtService: JwtService;

  let gtnAdminId: string;
  let adminId: string;
  let adminId2: string;
  let adminAccountId: string;
  let adminAccountId2: string;
  let accessToken: string;
  let accessToken2: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ".env.testing",
          isGlobal: true,
          load: [configuration],
        }),
        DatabaseModule,
        AuthModule,
        ProfileModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    db = moduleFixture.get<Database>("DATABASE");

    app.useGlobalFilters(...appFilters);

    await app.init();

    await databaseReset();

    const gtnAdminResult = await db
      .insert(admin)
      .values({
        firstName: "gtn",
      })
      .returning({ gtnAdminId: admin.id });
    gtnAdminId = gtnAdminResult.find(Boolean)!.gtnAdminId;

    await createAccount();
    await createAccount2();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("/profile (GET)", () => {
    it("should success", async () => {
      const response = await request(app.getHttpServer())
        .get("/profile")
        .auth(accessToken, { type: "bearer" });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        firstName: "firstName",
        firstNameKana: null,
        lastName: null,
        lastNameKana: null,
        middleName: null,
        middleNameKana: null,
        phoneNumber: null,
        email: "test@email.com",
      });
    });

    it("should return everything", async () => {
      const response = await request(app.getHttpServer())
        .get("/profile")
        .auth(accessToken2, { type: "bearer" });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        firstName: "firstName2",
        middleName: "middleName2",
        lastName: "lastName2",
        firstNameKana: "firstNameKana2",
        middleNameKana: "middleNameKana2",
        lastNameKana: "lastNameKana2",
        phoneNumber: "09000000000",
        email: "test2@email.com",
      });
    });
  });

  describe("/profile (PATCH)", () => {
    it("should success with full params", async () => {
      expect((await db.query.admin.findMany({})).length).toEqual(3);

      const params: AdminProfileUpdate = {
        firstName: "firstName2",
        middleName: "middleName2",
        lastName: "lastName2",
        firstNameKana: "firstNameKana2",
        middleNameKana: "middleNameKana2",
        lastNameKana: "lastNameKana2",
        phoneNumber: "09000000000",
      };

      const response = await request(app.getHttpServer())
        .patch("/profile")
        .auth(accessToken, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(200);

      const profile = await db.query.admin.findFirst({
        where: eq(admin.id, adminId),
      });

      expect(
        omitProperties(profile!, {
          id: true,
          createdAt: true,
          updatedAt: true,
        }),
      ).toEqual({
        firstName: "firstName2",
        middleName: "middleName2",
        lastName: "lastName2",
        firstNameKana: "firstNameKana2",
        middleNameKana: "middleNameKana2",
        lastNameKana: "lastNameKana2",
        phoneNumber: "09000000000",
        deletedAt: null,
      });
    });

    it("should success with null params", async () => {
      expect((await db.query.admin.findMany({})).length).toEqual(3);

      const params: AdminProfileUpdate = {
        firstName: "firstName3",
        middleName: null,
        lastName: null,
        firstNameKana: null,
        middleNameKana: null,
        lastNameKana: null,
        phoneNumber: null,
      };

      const response = await request(app.getHttpServer())
        .patch("/profile")
        .auth(accessToken2, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(200);

      const profile = await db.query.admin.findFirst({
        where: eq(admin.id, adminId2),
      });

      expect(
        omitProperties(profile!, {
          id: true,
          createdAt: true,
          updatedAt: true,
        }),
      ).toEqual({
        firstName: "firstName3",
        middleName: null,
        lastName: null,
        firstNameKana: null,
        middleNameKana: null,
        lastNameKana: null,
        phoneNumber: null,
        deletedAt: null,
      });
    });

    it("should success with undefined params", async () => {
      expect((await db.query.admin.findMany({})).length).toEqual(3);

      const params: AdminProfileUpdate = {};

      const response = await request(app.getHttpServer())
        .patch("/profile")
        .auth(accessToken2, { type: "bearer" })
        .send(params);

      expect(response.status).toEqual(200);

      const profile = await db.query.admin.findFirst({
        where: eq(admin.id, adminId2),
      });

      expect(
        omitProperties(profile!, {
          id: true,
          createdAt: true,
          updatedAt: true,
        }),
      ).toEqual({
        firstName: "firstName2",
        middleName: "middleName2",
        lastName: "lastName2",
        firstNameKana: "firstNameKana2",
        middleNameKana: "middleNameKana2",
        lastNameKana: "lastNameKana2",
        phoneNumber: "09000000000",
        deletedAt: null,
      });
    });
  });

  const createAccount = async () => {
    const companyResult = await db
      .insert(company)
      .values({
        createdBy: gtnAdminId,
        updatedBy: gtnAdminId,
      })
      .returning({ companyId: company.id });
    const companyId = companyResult.find(Boolean)!.companyId;

    const adminResult = await db
      .insert(admin)
      .values({
        firstName: "firstName",
      })
      .returning({ adminId: admin.id });
    adminId = adminResult.find(Boolean)!.adminId;

    const adminAccountResult = await db
      .insert(adminAccount)
      .values({
        email: "test@email.com",
        hash: "hash",
        status: "active",
        isEmailVerified: true,
        adminId,
      })
      .returning({ adminAccountId: adminAccount.id });
    adminAccountId = adminAccountResult.find(Boolean)!.adminAccountId;

    await db.insert(adminCompany).values({
      adminId: adminAccountId,
      companyId,
      role: "admin",
    });

    const payload = {
      sub: adminAccountId,
    };
    accessToken = await jwtService.signAsync(payload);
  };

  const createAccount2 = async () => {
    const company2Result = await db
      .insert(company)
      .values({
        createdBy: gtnAdminId,
        updatedBy: gtnAdminId,
      })
      .returning({ companyId: company.id });
    const companyId2 = company2Result.find(Boolean)!.companyId;

    const admin2Result = await db
      .insert(admin)
      .values({
        firstName: "firstName2",
        middleName: "middleName2",
        lastName: "lastName2",
        firstNameKana: "firstNameKana2",
        middleNameKana: "middleNameKana2",
        lastNameKana: "lastNameKana2",
        phoneNumber: "09000000000",
      })
      .returning({ adminId: admin.id });
    adminId2 = admin2Result.find(Boolean)!.adminId;

    const adminAccount2Result = await db
      .insert(adminAccount)
      .values({
        email: "test2@email.com",
        hash: "hash",
        status: "active",
        isEmailVerified: true,
        adminId: adminId2,
      })
      .returning({ adminAccountId: adminAccount.id });
    adminAccountId2 = adminAccount2Result.find(Boolean)!.adminAccountId;

    await db.insert(adminCompany).values({
      adminId: adminAccountId2,
      companyId: companyId2,
      role: "admin",
    });

    const payload = {
      sub: adminAccountId2,
    };
    accessToken2 = await jwtService.signAsync(payload);
  };
});
