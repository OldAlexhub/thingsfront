# Version 1.0.1 verification

Executed November 15, 2026. Package `com.oldalexhub.thingstodo`, version code 2. Both signed release artifacts use `https://things.server.oldalexhub.com`; `QA_BUILD=false`. The existing upload key was reused.

## Changes

- Advertising starts automatically without the previous adult-confirmation settings switch. Google UMP eligibility still controls requests; no synthetic consent is stored.
- A failed UMP refresh checks the SDK's current eligibility instead of disabling an otherwise eligible session.
- Banners appear after the Discover hero and before Explore results. Failed banners and interstitial loads retry after one minute.
- Opening unavailable privacy options no longer disables working ads. Changed privacy eligibility is respected.
- Settings displays advertising status, a retry action, version and server address.
- The app and hosted privacy documents describe the new automatic startup behavior.

## Completed checks

- 16 Jest tests passed. TypeScript and ESLint checks passed for changed code.
- Signed APK and AAB builds completed. `apksigner verify` and `jarsigner -verify` passed. Android upload certificates are self-signed, so JAR trust-chain warnings are expected.
- ZIP integrity checked for both artifacts. Their DEX files contain the live HTTPS address and no emulator-local API address. SHA-256 hashes are in `artifact-checks.json` in the release directory.
- Installed the actual signed production APK in `ThingsToDo_QA`, an Android emulator. No Metro server was needed.
- Fresh application data loaded Orlando and real backend records. The final APK update preserved a saved place.
- Discover and Explore visibly rendered Google banners labeled **Test Ad**. SDK logs explicitly identify emulator requests as test-device requests and confirm banner and interstitial loading. No advertiser link was clicked.
- The final APK completed a live three-stop itinerary with a known admission subtotal of $0. Search returned backend records; venue details and map tiles were also checked.
- Settings showed version 1.0.1 and the production server address. Opening unavailable privacy options preserved active advertising.
- Marking a visit during the initial five-minute interval did not show an interstitial. After the normal five-minute delay, marking a visit displayed a full-screen **Test Ad**. Its Close control returned to the completed visit. A repeated completed action immediately afterward did not display another ad, confirming the interval cap in the running app.

## Account setting still outstanding

Google UMP logged: `Publisher misconfiguration: Failed to read publisher's account configuration; no form(s) configured for the input app ID.` This applies to the configured AdMob app. Publish the applicable regional messages under AdMob Privacy & messaging, then test those regional flows. The emulator's SDK eligibility allowed test ad requests; this does not establish that other regions are configured correctly.

Test-ad delivery proves the integration and UI path, not production inventory, account approval, revenue or Google Play approval. No Play release was uploaded. Play-delivered updates still require testing on a Play testing track.

## Evidence

Release directory: `G:\GooglePlay\AdApps\releases\thingstodo-live-1.0.1`.

Actual emulator screenshots are included under `screenshots/`; the inspected device log is `emulator-final.log`. Earlier November 14 results in `QA.md` are historical.
