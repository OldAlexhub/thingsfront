# Version 1.2.0 verification

Executed November 15, 2026. Release verification continues below as checks complete.

## Changes

- Server-managed expansion to the largest city in each US state, plus Orlando. New destinations become visible after their first successful import. Census Vintage 2025 population rankings and cached Nominatim centers/bounds are recorded in the backend repository.
- Hotels have a separate Explore tab and rate/availability wording; they are excluded from activity itineraries. No live hotel prices are invented.
- Free public iCalendar imports, starting with UCF in Orlando, support recurring events, destination timezones, exclusions and cancellation. Operators add feeds under Event calendars. Coverage varies by city and connected feed.
- Google Maps handoff preserves every stop and travel mode, splitting long itineraries into mobile-compatible parts. Transit opens individual legs.
- Visited places retain local name, date, note and venue snapshot. Memory cards export at 1080 by 1350 pixels with venue photography or illustrated fallback, two styles, photo attribution and #old_alex_hub. Android sharing is user initiated; no social post is sent automatically.
- Content Studio has a private Hashtag & memories dashboard. Hourly public Bluesky and mastodon.social checks, failure/status reporting, search links for other networks and manually saved public URLs provide partial coverage. Counts are observed mentions, not impressions or revenue.

## Completed checks

- Backend: 57 passing tests, including overlapping-city preservation, hotel/planner separation, ICS recurrence/timezone/SSRF cases, exact hashtag matching, auth/CSRF, deduplication and hide controls. Runtime dependency audit: no vulnerabilities at the last dependency change.
- Mobile: 25 passing Jest tests. TypeScript and ESLint pass after the editor scrolling correction.
- Live backend: 15 upcoming Orlando events and 150 hotel records returned successfully. City imports continue independently of Android deployment.
- Actual Android: personalized Rollins Museum card exported as a valid 1080 by 1350 PNG; image and hashtag caption reached Android's share chooser. No external post submitted.
- Actual Android: PNG saved through the system document picker to Downloads, with success confirmation. Visited place and personalized name survived emulator restart.
- Actual Android: final memory editor keeps the focused name field fully visible above the keyboard. Real hotel photos, separate nightly-rate details, and upcoming event dates were inspected. A complete Google Test Ad banner rendered between event cards.
- Actual Android: Google Maps received the starting coordinates, two ordered waypoints, final destination and driving mode. Maps itself stalled on this emulator; this establishes the app handoff, not completed navigation.
- Content Studio: real public source checks returned successfully with zero matching posts; dashboard and calendar editor inspected in Chromium, without page errors. Empty results are distinguished from failures.

## Coverage limits

Venue imagery, prices and opening hours depend on free source coverage. Missing photos use artwork; unknown prices remain explicit. Events require a connected calendar. Public social APIs do not provide comprehensive Instagram, TikTok, Facebook, X or private-post tracking. No paid content API or Ticketmaster integration is used.

Google test-ad delivery verifies integration, not paid inventory or revenue. Applicable regional messages still require the operator's AdMob configuration. No Google Play upload is performed.

## Signed release

- APK and AAB built with the existing upload key, version 1.2.0/code 4, the live HTTPS API and QA_BUILD=false. APK signature, AAB signature, archive integrity and APK 16 KB alignment passed; SHA-256 checksums are in artifact-checks.json.
- APK installed as an upgrade to the production package. Existing favorites, plans and legacy visited entries were preserved; unknown legacy visit dates remain labeled as missing.
- Live hotel search and calendar events loaded in the signed app. Actual venue photos and hotel rate wording were visually inspected.
- The signed app exported an illustrated memory to Android's share chooser with the complete caption and #old_alex_hub. Photo-card export, PNG saving, caption copying and two visual styles were checked before the build.
- Debug full-screen Google Test Ad displayed after saving a day and closing it returned to the itinerary. The signed app loaded production-unit test ads on the emulator.
- Production photo sweep: 1,055 Orlando records, 77 unique photo URLs, all returning HTTP 200 and image content types. No broken URLs found in that sweep.
- Nexus automatically deployed the backend changes through release 16. Server-managed city activation and imports continue without an Android rebuild.
