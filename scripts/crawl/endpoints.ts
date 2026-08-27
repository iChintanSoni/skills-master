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
  /** "xml" (Atom/RSS) unless stated; "html" for pages parsed by date heading. */
  format?: "xml" | "html";
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
    // The index of Apple's per-framework "<Framework> updates" pages. Each of
    // those pages carries dated `## June 2026` headings — the only dated Apple
    // source found; the taxonomy endpoints below have no dates at all.
    domain: "apple",
    key: "apple-updates-index",
    url: "https://developer.apple.com/tutorials/data/documentation/updates.json",
    description: "Per-framework update pages (dated by month)",
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
    // The obvious source — `feeds/androidx-release-notes.xml` — is published but
    // effectively stalled: 83/109/78/53 dated entries in Feb–May 2026, then one
    // in June and one in July, while this page lists releases every week through
    // 26 August. The feed's own <updated> stamp is current, so it is not a fetch
    // problem; it just stopped carrying entries. The page is what is true.
    domain: "android",
    key: "androidx-releases",
    // `hl=en` is load-bearing: without it (and the Accept-Language header the
    // fetcher sends) the CDN content-negotiates a localized page, and the date
    // headings come back in a language `Date.parse` cannot read — which looks
    // exactly like "no releases found".
    url: "https://developer.android.com/jetpack/androidx/versions/all-channel?hl=en",
    description: "AndroidX (Jetpack) library releases, by release date",
    format: "html",
  },
  {
    domain: "android",
    key: "android-developers-blog",
    url: "https://android-developers.googleblog.com/atom.xml",
    description: "Official Android Developers Blog posts",
  },
];
