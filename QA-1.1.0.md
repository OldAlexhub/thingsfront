# Version 1.1.0 verification

Executed November 15, 2026. Android package `com.oldalexhub.thingstodo`, version code 3. Release verification is recorded below as each check completes; test-ad delivery does not establish revenue or production inventory.

## Implemented changes

- Explore scrolls its header and filters with the feed. Adaptive ads use the available card width, appear after the second result (or the only result), hide on failure, and retry after 60 seconds.
- Default distance units are miles. Settings supports kilometers; preferences persist and distances are converted consistently in discovery, filters, planner and itinerary.
- Planning uses three steps, 12-hour times, family age bands, budget choices and an optional known-admission-only constraint. Itinerary summaries are shorter; detailed planning notes can be expanded. Dragging or arrow buttons reorder stops and recalculate the schedule.
- Discover, Explore and details display venue photography when available, with category illustrations for unavailable/broken images. The server automatically obtains licensed place-linked or name-and-coordinate-matched Wikimedia photos. No photo upload is required. Ambiguous locations and different branches are rejected.
- Five Orlando venues have sourced, reviewed admission and photos. Unknown admission remains explicit and is never invented. General admission excludes extras and special events.
- Content Studio's city wizard searches a city, fills its bounds, asks the operator to confirm its timezone, enables it and queues the free import. No Android rebuild or environment editing is needed.
- Branded launcher icon, native splash and animated intro are included. Reduced-motion preferences are honored.
- Advertising starts automatically subject to the Google SDK's eligibility. Full-screen ads follow completed actions and respect the five-minute initial delay, 15-minute interval and three-per-day cap.

## Completed pre-build checks

| Check | Observed result |
|---|---|
| Backend | 47 tests pass against isolated real MongoDB instances |
| Mobile | 20 Jest tests pass; TypeScript passes; ESLint has zero errors (existing style warnings remain) |
| Automatic photos | Real Orlando import: 550 records, 55 matched photos; all 59 image-bearing staging records returned HTTP 200 image responses |
| Photo identity | Name/coordinate matching and rejection of global attraction branches covered by tests; actual Morse Museum photo inspected in emulator |
| Explore banners | Full Google Test Ad visible in feed; failed/no-fill placement hid and later retried successfully |
| Full-screen ads | Google Test Ad displayed after saving a day; Close returned to the itinerary |
| Planning | Three-step form produced a three-stop, fully priced $0 day; children/unknown admission/budget constraints covered by backend tests |
| Reordering | Actual long-press drag moved Lake Eola below Mead Garden; stop times and travel distances recalculated |
| Offline | Saved itinerary opened with emulator Wi-Fi and mobile data disabled; connectivity restored afterward |
| Settings | Miles/kilometers displayed correctly; dark theme persisted after process restart |
| Small screen | 320 dp width with font scale 1.3 checked; bottom tab uses the visible label Plan and the full accessibility label Plan My Day |
| Broken image | Deliberately invalid image rendered category artwork without a broken-image icon; isolated fixture removed |
| City onboarding | Browser wizard enabled Tampa; real import returned 437 places; Tampa appeared in the emulator city picker without rebuilding |
| Startup regression | Cold launch exposed a Gesture Handler 3 import incompatibility in Draggable FlatList 4; a dependency-scoped compatibility adapter fixed it |
| Development tooling | RN multipart debug bundle download dropped bytes; Metro now serves complete single-part bundles. This does not affect packaged release bundles |

## Deployment

Backend source: `\\Desktop-cakemlu\c\Backends\thingstodo-server`.
Public API: <https://things.server.oldalexhub.com>.
Connected source: <https://github.com/OldAlexhub/things>, commit `82b8fdc`.
Nexus release 10 observed Active after deployment. A one-time migration queues photos for existing published cities instead of waiting for their next weekly import. Source switches and editorial changes remain preserved.

## Account configuration and data limits

Google UMP previously reported that no regional privacy forms are configured for this AdMob app. Applicable messages still need to be published in AdMob Privacy & messaging and tested for those regions. The emulator's SDK eligibility allowed test requests; regional eligibility cannot be inferred from that result. No synthetic consent or eligibility bypass is used.

Open data does not provide licensed photographs, current admission or verified opening hours for every venue. The app uses an illustrated fallback and links to venue information where needed. Photo credit and license references are carried in each record. No paid provider or Ticketmaster integration is used.

No Google Play upload is performed by this release process.

## Signed release checks

- Signed APK and AAB built with the existing upload key, live HTTPS backend, `QA_BUILD=false`, version 1.1.0/code 3.
- APK signature, AAB signature, archive integrity, production URL and APK 16 KB alignment passed. Checksums are recorded in `artifact-checks.json`.
- Signed APK installed as an update to the existing production package; preferences and saved content were preserved.
- Production photo sweep: 65 image-bearing listings out of 905 retained records; every image returned HTTP 200 with an image content type. Results are recorded in `production-photo-checks.json`.
- Actual release cold-start recording inspected. A white transition frame found during QA was fixed by preserving the branded native window background until React renders. The final video shows the native logo followed by the animated intro and Discover.
- Kilometers selection survived force-stop/restart in the signed app; Miles was restored afterward.
- Final signed APK generated a live three-stop $0 itinerary, displayed miles and 12-hour times, and rendered all three numbered stops on the map.
- Saving the itinerary after the normal initial delay displayed a full-screen Google **Test Ad**. Its Close control returned to the saved itinerary. Repeating the completed action immediately displayed no second ad, confirming the interval cap.
- The signed app opened the saved itinerary with Wi-Fi and mobile data disabled. Connectivity was restored after this check.
- Discover and the Explore feed displayed Google **Test Ad** banners using the production ad unit on the emulator; SDK logs explicitly identify emulator requests as test-device requests. No advertiser link was clicked.
- No application fatal exception or ReactNativeJS runtime error was found in the captured final-app log. The outstanding AdMob regional-form configuration warning remains as described above.
