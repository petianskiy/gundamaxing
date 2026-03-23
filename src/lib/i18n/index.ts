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
import { hangar as enHangar } from "./locales/en/hangar";
import { lineage as enLineage } from "./locales/en/lineage";
import { achievements as enAchievements } from "./locales/en/achievements";
import { collector as enCollector } from "./locales/en/collector";
import { cards as enCards } from "./locales/en/cards";

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
import { hangar as jaHangar } from "./locales/ja/hangar";
import { lineage as jaLineage } from "./locales/ja/lineage";
import { achievements as jaAchievements } from "./locales/ja/achievements";
import { collector as jaCollector } from "./locales/ja/collector";
import { cards as jaCards } from "./locales/ja/cards";

import { common as zhTWCommon } from "./locales/zh-TW/common";
import { landing as zhTWLanding } from "./locales/zh-TW/landing";
import { builds as zhTWBuilds } from "./locales/zh-TW/builds";
import { forum as zhTWForum } from "./locales/zh-TW/forum";
import { upload as zhTWUpload } from "./locales/zh-TW/upload";
import { profile as zhTWProfile } from "./locales/zh-TW/profile";
import { content as zhTWContent } from "./locales/zh-TW/content";
import { filters as zhTWFilters } from "./locales/zh-TW/filters";
import { auth as zhTWAuth } from "./locales/zh-TW/auth";
import { admin as zhTWAdmin } from "./locales/zh-TW/admin";
import { settings as zhTWSettings } from "./locales/zh-TW/settings";
import { hangar as zhTWHangar } from "./locales/zh-TW/hangar";
import { lineage as zhTWLineage } from "./locales/zh-TW/lineage";
import { achievements as zhTWAchievements } from "./locales/zh-TW/achievements";
import { collector as zhTWCollector } from "./locales/zh-TW/collector";
import { cards as zhTWCards } from "./locales/zh-TW/cards";

export type Locale = "en" | "ja" | "zh-TW";
export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "gx-lang";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  "zh-TW": "繁體中文",
};

function merge(...objs: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...objs);
}

export const translations: Record<Locale, Record<string, string>> = {
  en: merge(enCommon, enLanding, enBuilds, enForum, enUpload, enProfile, enContent, enFilters, enAuth, enAdmin, enSettings, enHangar, enLineage, enAchievements, enCollector, enCards),
  ja: merge(jaCommon, jaLanding, jaBuilds, jaForum, jaUpload, jaProfile, jaContent, jaFilters, jaAuth, jaAdmin, jaSettings, jaHangar, jaLineage, jaAchievements, jaCollector, jaCards),
  "zh-TW": merge(zhTWCommon, zhTWLanding, zhTWBuilds, zhTWForum, zhTWUpload, zhTWProfile, zhTWContent, zhTWFilters, zhTWAuth, zhTWAdmin, zhTWSettings, zhTWHangar, zhTWLineage, zhTWAchievements, zhTWCollector, zhTWCards),
};
