# Things to Do: Day Planner

Android app by **Old Alex Hub**. Support, privacy and business contact: **info@oldalexhub.com**.

Bare React Native 0.88.1 / React 19.3 / TypeScript. Existing project retained; iOS is not a release target. Android package: `com.oldalexhub.thingstodo`.

## Start

```powershell
cd server
npm ci
npm run dev:local -- --import-osm
# In another terminal:
cd thingstodo
npm ci
npm start
# In another terminal, with emulator running:
npm run android
```

The local server listens on port 3000. The Android emulator reaches it through `http://10.0.2.2:3000`. Physical devices need `adb reverse tcp:3000 tcp:3000` and a debug build with `-PTTD_API_URL=http://127.0.0.1:3000`, or a real HTTPS backend. The local Content Studio is `http://localhost:3000`; local credentials are in `server/.local/admin-login.json`.

Production content comes entirely from the Express/MongoDB API. Cities, categories, collections, activities and events are not embedded in the app. Preferences, favorites, collections, visited IDs, recent searches and saved plans are device-local. A six-hour maximum API cache is further limited by provider expiry; cached responses are labeled. Saved licensed records lose expired provider fields and retain an unavailable label. Sharing/export intentionally leaves the app.

## App structure

- `App.tsx`: providers, five tabs, stack screens, native-to-React-Native branded launch transition, reduced-motion handling and update announcement.
- `src/screens/`: Discover, Explore, Plan My Day, Saved, Settings, details/gallery, city selection, map, itinerary and legal text.
- `src/api.ts`, `data.tsx`, `storage.tsx`: API boundary, city/category state and serialized local persistence.
- `src/components.tsx`, `theme.ts`: shared layouts, cards, image/error fallbacks, dark/light/system themes and safe-area handling.
- `src/ads.tsx`: consent, official debug/QA test IDs, production banner/interstitial IDs, failure isolation and frequency caps.
- `android/.../ThingsToDoNative.kt`: optional approximate location, Storage Access Framework JSON exports and official Google Play update integration.
- `assets/`: original generated logo, wordmark and master icon. Android resources include density-specific launcher icons, adaptive foreground/background, a themed monochrome silhouette and branded splash resources.
- `store_assets/`: listing copy, icon, captions, disclosure notes and release text.

## Behavior and limitations

Search and pagination query real MongoDB records. Filters include known adult price, duration, category, environment, family suitability, age, approximate location and verified open-now information. Event date inputs currently use explicitly labeled UTC bounds. Map/list views show loaded results and can load more pages. Venue photography falls back gracefully when absent.

The planner accepts local city date/time, start coordinates or optional location, adults/children, strict admission budget, interests, transport, pace, radius and meal breaks. The itinerary can be dragged or reordered with accessible arrows, replaced, removed, recalculated, saved, shared and exported. A saved itinerary remains readable offline; edits and generation require the backend. The engine is deterministic. Travel times are **rough geographic estimates**, not live routing; unknown duration uses a disclosed planning allowance. Food, travel, taxes and fees are not included in known admission subtotals.

No notifications are sent and no notification permission is requested. Location is optional, approximate, requested on use, and never collected in the background. No public login is introduced. Plan inputs are sent to the backend for calculation without a stored user profile.

SafeAreaProvider wraps the app. Screens, tab bar, scroll padding, keyboard forms and bottom controls use safe insets. Ads sit in feed content above the tab bar. Android `adjustResize` keeps forms usable with the keyboard. Reduced motion skips the intro and card entry effects. Photo galleries use a modal; no unsupported shared-image transition is promised.

## Ads and updates

AdMob application ID: `ca-app-pub-7831002909037560~1455645255`.

Production banner: `ca-app-pub-7831002909037560/2277947348`.

Production interstitial: `ca-app-pub-7831002909037560/2637039990`.

Debug and explicitly marked QA builds use Google's test units. Production uses the supplied units. Advertising initializes automatically and requests ads when UMP permits requests. SDK measurement is delayed. Requests are non-personalized, which does not mean no data processing. Configure applicable UMP messages in AdMob before distribution. Settings exposes privacy choices. Failed consent or ads leave the app functional.

Interstitials are eligible only after marking a visit complete, after five minutes in the session, with at least 15 minutes between ads and at most three per UTC day. They are not triggered by launch, navigation, planning, exports or tab changes.

The version API announces latest/minimum versions. Play Core checks actual availability; a server outage or unavailable Play update never permanently locks out users. Flexible downloads request a restart; immediate update flows resume when required by Play. Validate through a Play internal testing track because sideloaded builds cannot prove Play-delivered updates.

## Build and release

From the project root, beside `server/` and `thingstodo/`:

```powershell
python release.py --check-env
python release.py --generate-key-only
python release.py --api-url https://things.server.oldalexhub.com --skip-screenshots
python release.py --qa-build --skip-screenshots
python release.py --screenshots-only
python release.py --skip-build
python release.py --clean --api-url https://things.server.oldalexhub.com
python release.py --no-clean --api-url https://things.server.oldalexhub.com
```

The standard-library-only helper detects Android Studio Java/JBR, SDK, wrapper and the existing project. It updates `local.properties`, creates signing only when missing, reuses the key, builds signed APK/AAB, and copies artifacts, branding, store assets and documentation to a directory outside the project. It also packages the server with non-secret deployment defaults, automatic first-run setup and free-data synchronization enabled. It supports interactive actual-device screenshots. Screenshot failures do not invalidate successful builds.

**Back up `android/app/signing/upload.keystore` and `android/keystore.properties` privately and encrypted.** They are ignored by Git and never copied into public release folders. Do not replace a signing key for an existing published app. The AAB is the Play upload format. The APK is for testing. Keep versionCode increasing for subsequent releases.

Production builds use `https://things.server.oldalexhub.com` from the root `release-config.json`, with `--api-url` or `TTD_API_URL` overrides supported. An explicit QA build defaults to the emulator's local server, permits local cleartext traffic, uses test ads and is marked QA in the release summary. **Do not upload the QA AAB to production.** The production hostname was supplied by the developer. HTTPS health, city content, activity search, maps and itinerary generation were verified against the live service on November 15, 2026, including from the Android emulator. Use the production APK for phones; the local-server QA APK cannot reach this hostname.

Before publishing: deploy/configure the server and persistent database/media; populate and review real content and licenses; configure production AdMob consent messages; host the privacy policy; complete actual Data safety/target audience/content rating declarations; test the signed production configuration and Play update delivery. Only free content APIs are integrated. OpenStreetMap and scheduled synchronization start enabled; events are managed through Content Studio. New cities are published only through the server. No paid services or hosting have been purchased.

## Validation

```powershell
npx tsc --noEmit
npx eslint App.tsx src __tests__ --quiet
npm test -- --runInBand
# from server:
npm test
npm audit --omit=dev
```

Backend tests cover publication, indexed search, geography, expired content, auth/CSRF, budget/age constraints, itinerary timing/recalculation, provider failures, leases and deduplication. Mobile tests cover durable favorites, expiry, offline caches, unpublished content, cache deletion, Google consent handling, banner failure, interstitial failure and frequency caps. See `QA.md` for executed build/device checks and remaining release verification.

If the app cannot connect, verify the server health endpoint, emulator address and release API configuration. If no experiences match a zero-dollar budget, only explicitly free records qualify. Missing child prices intentionally exclude a venue from strict group budgets. Missing images and hours remain explicit. CMake may warn about cross-drive hard links on Windows and fall back to copying. Do not change the React Native version solely to silence these warnings.
