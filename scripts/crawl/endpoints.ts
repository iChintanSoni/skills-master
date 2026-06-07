/**
 * Apple render-JSON endpoints used by the (report-only) crawler.
 *
 * Apple's documentation site is a SPA backed by JSON at /tutorials/data/…json.
 * The crawler fetches only structural data (titles, URLs, identifiers) to build
 * a coverage/worklist report. It NEVER ingests prose into skills.
 */

export interface Endpoint {
  domain: string;
  key: string;
  url: string;
  description: string;
}

export const APPLE_ENDPOINTS: Endpoint[] = [
  {
    domain: "apple",
    key: "technologies",
    url: "https://developer.apple.com/tutorials/data/documentation/technologies.json",
    description: "Browse-by-technology framework taxonomy",
  },
  {
    domain: "apple",
    key: "technologyoverviews",
    url: "https://developer.apple.com/tutorials/data/documentation/technologyoverviews.json",
    description: "Technology Overviews (high-level conceptual guides)",
  },
  {
    domain: "apple",
    key: "human-interface-guidelines",
    url: "https://developer.apple.com/tutorials/data/design/human-interface-guidelines.json",
    description: "Human Interface Guidelines",
  },
];

export const ANDROID_ENDPOINTS: Endpoint[] = [
  {
    domain: "android",
    key: "androidx-releases",
    url: "https://developer.android.com/feeds/androidx-release-notes.xml",
    description: "AndroidX (Jetpack) library releases",
  },
  {
    domain: "android",
    key: "android-developers-blog",
    url: "https://android-developers.googleblog.com/atom.xml",
    description: "Official Android Developers Blog posts",
  },
];

