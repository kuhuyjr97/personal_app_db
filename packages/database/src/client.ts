import * as agency from "@/schemas/agencies";
import * as agencyAccount from "@/schemas/agencies/agency_accounts";
import * as bankAccount from "@/schemas/agencies/bank_accounts";
import * as gtnInCharge from "@/schemas/agencies/gtn_in_charges";

import * as applicant from "@/schemas/applicants";
import * as address from "@/schemas/applicants/addresses";

import * as application from "@/schemas/user";
import * as correspondence from "@/schemas/applications/correspondences";
import * as creditCardApplication from "@/schemas/applications/credit_card_applications";
import * as utilityApplication from "@/schemas/applications/utility_applications";
import * as utilityCompany from "@/schemas/applications/utility_companies";
import * as wifiApplication from "@/schemas/applications/wifi_applications";

import * as billing from "@/schemas/billings";

import * as earning from "@/schemas/earnings";

import * as gtnMember from "@/schemas/gtn_members";

import * as log from "@/schemas/logs";

import * as userToken from "@/schemas/user_tokens";

export const Schema = {
  ...agency,
  ...agencyAccount,
  ...bankAccount,
  ...gtnInCharge,

  ...applicant,
  ...address,

  ...application,
  ...correspondence,
  ...creditCardApplication,
  ...utilityApplication,
  ...utilityCompany,
  ...wifiApplication,

  ...billing,

  ...earning,

  ...gtnMember,

  ...log,

  ...userToken,
};
export type Schema = typeof Schema;
