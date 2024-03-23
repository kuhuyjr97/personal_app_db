import { PgTable } from "drizzle-orm/pg-core";
import { faker } from "@faker-js/faker";

import {
  agencies,
  applicants,
  applications,
  gtn_members,
  language,
  service_type,
  utility_companies,
  agency_accounts,
  utility_applications,
  wifi_applications,
  credit_card_applications,
  utility_type,
  utility_contract_type,
  utility_application_status,
  gas_start_time_type,
  credit_card_application_status,
  contact_day_of_weeks,
  wifi_application_status,
  correspondences,
  correspondence_destination_type,
  billings,
  earnings,
  bank_classification,
  bank_accounts,
  visa_category,
  prefecture,
} from "@/index";

import { createDatabaseConnection, disconnectDatabase } from "./database";
import { skip } from "node:test";

const db = createDatabaseConnection();

interface IdObject {
  id: number;
}

interface PgEnum {
  enumName: string;
  enumValues: string[];
}

const getRandomValues = (enumObj: PgEnum): string[] => {
  const shuffled = enumObj.enumValues.sort(() => 0.5 - Math.random());
  const randomCount = Math.floor(Math.random() * 3) + 1;
  return shuffled.slice(0, randomCount);
};

const getRandomValue = (enumObj: PgEnum): string => {
  const randomIndex = Math.floor(Math.random() * enumObj.enumValues.length);
  return enumObj.enumValues[randomIndex];
};

async function seedUtilityCompany<T>() {
  await db.insert(utility_companies).values([
    {
      name: "デュアル",
      email: faker.internet.email(),
      gasCommissionReceive: 2500,
      electricCommissionReceive: 3000,
      bothCommissionReceive: 5500,
      gasCommissionPay: 1000,
      electricCommissionPay: 1500,
      bothCommissionPay: 2500,
    },
    {
      name: "ヒナタオ",
      email: faker.internet.email(),
      gasCommissionReceive: 5000,
      electricCommissionReceive: 5000,
      bothCommissionReceive: 5000,
      gasCommissionPay: 1000,
      electricCommissionPay: 1500,
      bothCommissionPay: 2500,
    },
  ]);
}

const seedGtnMember = () => ({
  name: faker.internet.userName(),
  department: faker.company.name(),
});

const seedAgency = () => ({
  name: faker.internet.userName(),
  nameKana: "さくら",
  phoneNumber: faker.phone.number(),
  email: faker.internet.email(),
  zipCode: faker.location.zipCode(),
  prefecture: getRandomValue(prefecture),
  city: faker.location.city(),
  addressDetail: faker.location.streetAddress(),
  building: faker.company.name(),
  roomNumber: "101",
  invoiceNumber: faker.finance.currencyCode(),
  serviceTypeCodes: getRandomValues(service_type),
});

const seedApplicant = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  firstNameKana: "さくら",
  lastNameKana: "さくら",
  birthdate: "1990-05-15",
  nationality: "米領サモア(AMERICAN SAMOA)",
  visaClassification: getRandomValue(visa_category),
  desiredLanguageCode: getRandomValue(language),
  phoneNumber: faker.phone.number(),
  email: faker.internet.email(),
  address: faker.location.streetAddress(),
});

const seedApplication =
  (agencyIds: IdObject[], applicantIds: IdObject[]) => () => ({
    agencyId: agencyIds[Math.floor(Math.random() * agencyIds.length)].id,
    applicantId:
      applicantIds[Math.floor(Math.random() * applicantIds.length)].id,
    serviceTypeCodes: getRandomValues(service_type),
  });

const seedAccount = (agencyIds: IdObject[]) => () => ({
  agencyId: agencyIds[Math.floor(Math.random() * agencyIds.length)].id,
  email: faker.internet.email(),
  hash: "$2y$10$bB4TPqTCT0VG3HZHEZiy6u/CdbMnoQQ9Se0q5pj1Js1bMzOB3x0TG",
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  firstNameKana: "さくら",
  lastNameKana: "さくら",
  phoneNumber: faker.phone.number(),
  department: faker.company.name(),
});

const seedWifiApplication = (applicationId: number) => () => ({
  applicationId: applicationId,
  contactDayOfWeeks: getRandomValue(contact_day_of_weeks),
  visaFrontUrl: faker.image.url(),
  visaBackUrl: faker.image.url(),
  visaName: "さくら",
  visaExpDate: "2023-12-15",
  status: getRandomValue(wifi_application_status),
});

const seedUtilityApplication =
  (applicationId: number, utilityCompanyId: IdObject[]) => () => ({
    applicationId: applicationId,
    utilityCompanyId:
      utilityCompanyId[Math.floor(Math.random() * utilityCompanyId.length)].id,
    utilityTypeCode: getRandomValue(utility_type),
    currentContractTypeCodes: getRandomValues(utility_contract_type),
    electricStartDate: "2023-12-15",
    gasStartDate: "2023-12-15",
    gasStartTimeCode: getRandomValue(gas_start_time_type),
    withWaterSupply: true,
    status: getRandomValue(utility_application_status),
  });

const seedCreditApplication = (applicationId: number) => () => ({
  applicationId: applicationId,
  status: getRandomValue(credit_card_application_status),
});

const seedCorrespondences = (applicationId: number) => () => ({
  applicationId: applicationId,
  destinationTypeCode: getRandomValue(correspondence_destination_type),
  date: faker.date.past(),
  message: faker.string.sample(),
  emailSentAt: faker.date.past(),
});
async function seedData<T>(
  schema: PgTable<any>,
  seedFunction: () => T,
  itemCount: number = 5000
) {
  const data: T[] = [];

  for (let i = 0; i < itemCount; i++) {
    data.push(seedFunction());
  }

  return await db.insert(schema).values(data);
}

async function seedSubApplication<T>(
  schema: PgTable<any>,
  applicationIds: IdObject[],
  seedFunction: (applicationId: number) => () => T
) {
  const data: T[] = [];

  for (let i = 0; i < applicationIds.length; i++) {
    const applicationId = applicationIds[i].id;
    if (applicationId == null) {
      console.error("Invalid applicationId, skipping...");
      continue;
    }
    const resultFn = seedFunction(applicationIds[i].id);
    const result = resultFn();
    data.push(result);
  }

  return await db.insert(schema).values(data);
}

const seedBilling = (agencyId: number, month: string) => () => ({
  gasCount: faker.number.int({ max: 999 }),
  electricCount: faker.number.int({ max: 999 }),
  bothCount: faker.number.int({ max: 999 }),
  agencyId: agencyId,
  month: month,
  amount: faker.number.int({ max: 999 }),
});

const seedBankAccount = (agencyId: number) => () => ({
  agencyId: agencyId,
  bankName: faker.company.name(),
  branch: faker.company.name(),
  accountNumber: faker.finance.accountNumber(),
  accountName: faker.finance.accountName(),
  classification: getRandomValue(bank_classification),
});

const seed = async () => {
  try {
    await Promise.all([
      seedUtilityCompany(),
      seedData(gtn_members, seedGtnMember),
      seedData(agencies, seedAgency),
      seedData(applicants, seedApplicant),
    ]);

    const [agencyIds, applicantIds, utilityCompanyId] = await Promise.all([
      db.select({ id: agencies.id }).from(agencies).limit(5000).execute(),
      db.select({ id: applicants.id }).from(applicants).limit(5000).execute(),
      db
        .select({ id: utility_companies.id })
        .from(utility_companies)
        .limit(10)
        .execute(),
    ]);

    await seedData(applications, seedApplication(agencyIds, applicantIds));
    await seedData(agency_accounts, seedAccount(agencyIds));
    await db.insert(agency_accounts).values({
      agencyId: agencyIds[Math.floor(Math.random() * agencyIds.length)].id,
      email: "admin@gmail.com",
      hash: "$2y$10$bB4TPqTCT0VG3HZHEZiy6u/CdbMnoQQ9Se0q5pj1Js1bMzOB3x0TG",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      firstNameKana: "さくら",
      lastNameKana: "さくら",
      phoneNumber: faker.phone.number(),
      department: faker.company.name(),
    });
    const applicationIds = await db
      .select({ id: applications.id })
      .from(applications)
      .limit(5000)
      .execute();
    await seedSubApplication(
      utility_applications,
      applicationIds,
      (applicationId) => seedUtilityApplication(applicationId, utilityCompanyId)
    );
    await seedSubApplication(
      wifi_applications,
      applicationIds,
      (applicationId) => seedWifiApplication(applicationId)
    );
    await seedSubApplication(
      credit_card_applications,
      applicationIds,
      (applicationId) => seedCreditApplication(applicationId)
    );

    for (let i = 0; i < 5; i++) {
      await seedSubApplication(
        correspondences,
        applicationIds,
        (applicationId) => seedCorrespondences(applicationId)
      );
    }

    const months = [
      "2023-05",
      "2023-06",
      "2023-07",
      "2023-08",
      "2023-09",
      "2023-10",
      "2024-05",
      "2024-06",
      "2024-07",
      "2024-08",
      "2024-09",
      "2024-10",
    ];

    months.forEach(async (month) => {
      await seedSubApplication(billings, agencyIds, (agencyId) =>
        seedBilling(agencyId, month)
      );
    });

    months.forEach(async (month) => {
      await seedSubApplication(earnings, agencyIds, (agencyId) =>
        seedBilling(agencyId, month)
      );
    });

    await seedSubApplication(bank_accounts, applicationIds, (agencyIds) =>
      seedBankAccount(agencyIds)
    );
  } catch (e) {
    console.error("error: ", e);
  }
};

seed();
