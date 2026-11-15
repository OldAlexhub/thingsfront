# Executed verification

Latest release: see [version 1.0.1 verification](QA-1.0.1.md). The November 14 results below are historical; the live server connection and ad startup were subsequently fixed and tested.

Date: 2026-11-14. Both signed QA artifacts and a separately configured production release candidate are supplied. Neither is an approved Google Play production release.

## Results

| Check | Executed result |
|---|---|
| Backend tests | 36 passed against isolated real MongoDB instances |
| Mobile tests | 11 passed across storage/cache and advertising failure suites |
| TypeScript | `npx tsc --noEmit` passed |
| ESLint | `npx eslint . --quiet` passed; inline-style warnings remain outside quiet mode |
| Admin browser check | Passed in installed Chrome through Playwright: login, overview, city preview/edit/save, media section, provider controls and map attribution |
| Branding validation | Transparent logo, 512px RGBA store icon under 1 MB, five launcher densities and adaptive foreground dimensions passed |
| Android build | `assembleRelease` and `bundleRelease` completed successfully with the private upload key |
| Artifact validation | APK signature verified, AAB JAR signature verified, and APK 16 KB zip alignment check passed |
| Device installation | Signed QA APK installed and launched on a separate Android 36.1 Google Play x86_64 emulator, 1080 x 2400 |
| Real provider import | Initial Overpass timeout preserved data; scheduled retry succeeded, inserting 600 actual OSM places |
| Editorial content | One factual Lake Eola Park record imported separately, with licensed photography and unknown prices/hours left unknown |
| Dependency audit | Server runtime graph: zero findings. Mobile `--omit=dev` graph: four low findings in React Native CLI/deepmerge; no moderate, high or critical findings |

Automated backend coverage includes publication, indexed search, category/zero-price filtering, geographic queries, expired events and content, invalid IDs/query operators, authentication, CSRF, cross-origin writes, clearing optional editorial fields, city reference validation, verified-hours timezone validation, template data allowlisting, weather preference scoring, default administrator initialization, preservation of existing credentials, server-only city publication/sync provisioning, provider allowlisting, version policy, provider failure preservation, deduplication, editor archive preservation, atomic leases, budget/group/age constraints, closed and overnight hours, scheduling and infeasible recalculation.

Mobile tests cover persisted favorites, licensed snapshot expiry, offline cache timestamps, 404 handling, expired cache rejection, cache deletion preserving personal plans, zero-value query parameters, ads disabled without adult confirmation, consent network failure, failed banners, interstitial failure, session delay and frequency limits. These tests use an SDK mock; they do not certify production consent or ad delivery.

## Actual emulator checks

- Native branded launch and React Native introduction displayed; app starts without a Metro server.
- All five tabs opened. City picker, light/system and dark appearance, and source-provided city imagery displayed.
- Searching for Lake Eola returned real indexed records. Search keyboard and controls remained usable.
- Lake Eola detail opened, attribution and explicit unknown admission/hours displayed, and saving the place persisted after a full app restart and APK update.
- Live OpenStreetMap tiles and a venue marker loaded. Map attribution remains above Android's navigation area after the safe-area correction.
- A real three-stop itinerary was generated from the imported dataset with an explicit known admission subtotal and geographic travel warnings. It was saved and appeared under Saved > Day plans.
- Android's document picker exported the actual itinerary JSON successfully and the app confirmed completion.
- A city-provided four-hour planning template populated the form. Its stricter radius/known-price constraints produced an honest no-matches state with an adjustment action.
- Denying approximate-location permission displayed a recoverable message and preserved manual location entry.
- The no-update-announced path displayed correctly. This does not prove Play-delivered updates.
- Gesture navigation and three-button navigation were inspected. Tab controls, scroll padding and map attribution remained outside native navigation controls.
- Initial network-unavailable and image-unavailable states were observed. No AndroidRuntime or ReactNativeJS errors were present in the final inspected device log.

Actual captures are in `server/.local/qa` and the external QA release's `screenshots` folder. They are device captures, not generated mockups. `scripts/device-qa.py` locates visible accessibility nodes before tapping; `release.py` also provides interactive ADB captures.

## Release dependencies and limits

1. The production origin is `https://things.server.oldalexhub.com`, supplied by the developer. DNS resolves, but the endpoint currently rejects the TLS handshake. Deploy/configure its certificate, backend, persistent authenticated MongoDB, durable media and backups. The QA APK uses `http://10.0.2.2:3000` and test ads. **Do not submit its AAB to production.**
2. Review and maintain the imported catalog. Most OSM venues do not provide reliable hours, prices or licensed images. Unknown values are intentionally disclosed; strict budgets exclude unknown group costs. Retention rules expire imported records without a successful refresh.
3. Only free OpenStreetMap content synchronization is integrated. Events are managed through Content Studio; no external event API is connected.
4. Configure actual UMP messages/regions and AdMob production settings; test both consent outcomes, privacy choices and real test-ad delivery on the intended distribution track. No production ad was clicked or tested for revenue.
5. Verify Google Play flexible/immediate update delivery through an internal track. Sideloading cannot establish store availability, update eligibility or Play release approval.
6. Complete hosted privacy URL, Data safety, target audience, content rating, country availability and store review. The provided policy text must match the deployed infrastructure and SDK configuration.
7. Travel times are disclosed rough geographic estimates. No verified routing, live traffic, weather forecast or booking service is connected. Meals reserve time without fabricating a restaurant reservation or food price.
8. Broader physical-device, large-font, TalkBack, low-memory, performance and long-running scheduler/load testing remain release work. No 60 FPS or universal device-compatibility certification is claimed.
9. The four low dependency audit findings remain recorded. Do not force an incompatible React Native CLI downgrade to silence them; reassess upstream patched versions before distribution.

Keep signing keys and passwords out of release assets. Back them up privately using the generated signing instructions.

## Production candidate

Production APK/AAB generation uses the configured HTTPS hostname, cleartext disabled and the supplied real AdMob units behind the consent/adult gate. The domain has not passed a live health check because TLS is currently failing. The device feature checks above were performed on the local QA configuration. Production delivery still requires successful hosted API, consent and Play testing. The production artifacts are separate from the QA package.

## Free-API and deployment-default update

OpenStreetMap is now the only registered content API. Free imports, recurring synchronization, initial seeding and secure first-run administrator creation default to enabled. The city picker refreshes its server-provided city list each time it opens. The expanded suite passes 36 backend tests and 11 mobile tests, including server-only city publication, automatic per-city job creation, provider allowlisting and administrator bootstrap preservation. The admin browser check confirmed that only OpenStreetMap is offered. Both signed artifact sets were rebuilt; the refreshed QA APK installed and the city picker was inspected successfully.

## Nexus installation and startup repair

Nexus bundled npm contained obsolete nested Minipass 3.3.6 copies shadowing the required shared 7.1.3. The two obsolete directories were backed up and the bundled npm installer was verified. First-run setup accepts a supplied password of at least 8 characters and preserves it. Startup failures now log safe configuration messages and close the database connection before exiting. All 39 backend tests pass, including chosen-password preservation, prompt startup failure and connection-secret redaction.

Nexus Release 3 completed successfully on November 14, 2026. Direct local checks returned HTTP 200 for health, published cities, privacy policy, admin login with the configured password, and logout. Public HTTPS still fails with a TLS handshake error, so external availability is not verified.
