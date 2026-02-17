import { common as enCommon } from "./locales/en/common";
import { landing as enLanding } from "./locales/en/landing";
import { builds as enBuilds } from "./locales/en/builds";
import { forum as enForum } from "./locales/en/forum";
import { upload as enUpload } from "./locales/en/upload";
import { profile as enProfile } from "./locales/en/profile";
import { content as enContent } from "./locales/en/content";
import { filters as enFilters } from "./locales/en/filters";
import { auth as enAuth } from "./locales/en/auth";
import { admin as enAdmin } from "./locales/en/admin";
import { settings as enSettings } from "./locales/en/settings";

import { common as jaCommon } from "./locales/ja/common";
import { landing as jaLanding } from "./locales/ja/landing";
import { builds as jaBuilds } from "./locales/ja/builds";
import { forum as jaForum } from "./locales/ja/forum";
import { upload as jaUpload } from "./locales/ja/upload";
import { profile as jaProfile } from "./locales/ja/profile";
import { content as jaContent } from "./locales/ja/content";
import { filters as jaFilters } from "./locales/ja/filters";
import { auth as jaAuth } from "./locales/ja/auth";
import { admin as jaAdmin } from "./locales/ja/admin";
import { settings as jaSettings } from "./locales/ja/settings";

export type Locale = "en" | "ja";
export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "gx-lang";

function merge(...objs: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...objs);
}

export const translations: Record<Locale, Record<string, string>> = {
  en: merge(enCommon, enLanding, enBuilds, enForum, enUpload, enProfile, enContent, enFilters, enAuth, enAdmin, enSettings),
  ja: merge(jaCommon, jaLanding, jaBuilds, jaForum, jaUpload, jaProfile, jaContent, jaFilters, jaAuth, jaAdmin, jaSettings),
};
