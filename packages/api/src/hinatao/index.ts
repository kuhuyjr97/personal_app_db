import * as v from "valibot";

export const DesiredContactOptions = v.picklist(["electric", "gas", "water"]);
export type DesiredContactOptions = v.Output<typeof DesiredContactOptions>;

export const DesiredContacts = v.array(DesiredContactOptions);
export type DesiredContacts = v.Output<typeof DesiredContacts>;

export const GasStartTimeOptions = v.picklist([
  "9am-12pm",
  "1pm-3pm",
  "3pm-5pm",
  "5pm-7pm",
]);
export type GasStartTimeOptions = v.Output<typeof GasStartTimeOptions>;

export const HinataoParams = v.object({
  lastName: v.string(),
  firstName: v.string(),
  lastNameKana: v.string(),
  firstNameKana: v.string(),
  birthdate: v.string(),
  email: v.string([v.email()]),
  phoneNumber: v.string(),
  postalCode: v.string([v.length(7)]),
  prefecture: v.string(),
  city: v.string(),
  address: v.string(),
  building: v.nullable(v.string()),
  roomNumber: v.nullable(v.string()),
  electricStartDate: v.nullable(v.string()),
  desiredContacts: DesiredContacts,

  // gas
  gasStartDate: v.nullable(v.string()),
  gasStartTime: v.nullable(GasStartTimeOptions),
});
export type HinataoParams = v.Output<typeof HinataoParams>;
