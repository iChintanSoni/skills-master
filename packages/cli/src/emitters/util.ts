import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Frontmatter } from "../schema/frontmatter";

/** True when `rel` exists under the project root (used for tool auto-detection). */
export function existsRel(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

/** Tokens whose brand casing plain capitalization gets wrong (acronyms and compound names). */
const CASED_TOKENS: Record<string, string> = {
  hig: "HIG",
  ui: "UI",
  ml: "ML",
  ai: "AI",
  ar: "AR",
  av: "AV",
  os: "OS",
  ci: "CI",
  cd: "CD",
  url: "URL",
  api: "API",
  sf: "SF",
  spm: "SPM",
  m3: "M3",
  nfc: "NFC",
  http: "HTTP",
  sqlite: "SQLite",
  ios: "iOS",
  ipados: "iPadOS",
  macos: "macOS",
  tvos: "tvOS",
  visionos: "visionOS",
  watchos: "watchOS",
  chromeos: "ChromeOS",
  swiftui: "SwiftUI",
  swiftdata: "SwiftData",
  uikit: "UIKit",
  appkit: "AppKit",
  xcode: "Xcode",
  xctest: "XCTest",
  viewmodel: "ViewModel",
  workmanager: "WorkManager",
  activitykit: "ActivityKit",
  arkit: "ARKit",
  cloudkit: "CloudKit",
  cryptokit: "CryptoKit",
  eventkit: "EventKit",
  gamekit: "GameKit",
  healthkit: "HealthKit",
  mapkit: "MapKit",
  musickit: "MusicKit",
  passkit: "PassKit",
  pencilkit: "PencilKit",
  photokit: "PhotoKit",
  realitykit: "RealityKit",
  scenekit: "SceneKit",
  screencapturekit: "ScreenCaptureKit",
  spritekit: "SpriteKit",
  storekit: "StoreKit",
  tipkit: "TipKit",
  weatherkit: "WeatherKit",
  widgetkit: "WidgetKit",
};

/** Human title derived from a kebab-case skill name (e.g. "swiftui-grids" → "SwiftUI Grids"). */
export function titleFromName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((w) => CASED_TOKENS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Comma-join a skill's globs, or undefined if it declares none. */
export function globsToString(fm: Frontmatter): string | undefined {
  const g = fm.globs;
  if (!g || g.length === 0) return undefined;
  return g.join(",");
}

/** True when the skill ships any on-demand resource files. */
export function hasResources(resources: {
  reference?: string;
  examples?: string;
  checklist?: string;
}): boolean {
  return Boolean(resources.reference || resources.examples || resources.checklist);
}
