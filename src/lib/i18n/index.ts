import { common as enCommon } from "./locales/en/common";
import { landing as enLanding } from "./locales/en/landing";
import { builds as enBuilds } from "./locales/en/builds";
import { forum as enForum } from "./locales/en/forum";
import { upload as enUpload } from "./locales/en/upload";
import { profile as enProfile } from "./locales/en/profile";
import { content as enContent } from "./locales/en/content";
import { filters as enFilters } from "./locales/en/filters";

import { common as jaCommon } from "./locales/ja/common";
import { landing as jaLanding } from "./locales/ja/landing";
import { builds as jaBuilds } from "./locales/ja/builds";
import { forum as jaForum } from "./locales/ja/forum";
import { upload as jaUpload } from "./locales/ja/upload";
import { profile as jaProfile } from "./locales/ja/profile";
import { content as jaContent } from "./locales/ja/content";
import { filters as jaFilters } from "./locales/ja/filters";

export type Locale = "en" | "ja";
export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "gx-lang";

function merge(...objs: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...objs);
}

export const translations: Record<Locale, Record<string, string>> = {
  en: merge(enCommon, enLanding, enBuilds, enForum, enUpload, enProfile, enContent, enFilters),
  ja: merge(jaCommon, jaLanding, jaBuilds, jaForum, jaUpload, jaProfile, jaContent, jaFilters),
};
