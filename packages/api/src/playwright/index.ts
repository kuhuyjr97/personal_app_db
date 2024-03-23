import * as v from "valibot";

enum Message {
  SUCCESS = "ok",
  FAILED_WITH_NO_IMAGE = "has_image",
  FAILED_WITH_IMAGE = "no_image",
}
export const PlaywrightResponseMessage = v.enum_(Message);
export type PlaywrightResponseMessage = v.Output<
  typeof PlaywrightResponseMessage
>;

export const PlaywrightResponse = v.object({
  message: PlaywrightResponseMessage,
  image: v.nullable(v.string()),
});
export type PlaywrightResponse = v.Output<typeof PlaywrightResponse>;
