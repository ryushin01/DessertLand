import type messages from "@/shared/i18n/messages/ko.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
