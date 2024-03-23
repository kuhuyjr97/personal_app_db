export const SUCCESS = 201;
export const FAILED = 400;
export type RESPONSE = {
  code: typeof SUCCESS | typeof FAILED;
  image?: string;
};
