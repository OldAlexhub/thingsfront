# Data safety review

Complete the Play form against the shipped configuration, not this checklist alone.

- Backend: selected city, interests, date, budget, group ages and optional approximate starting coordinates, processed for search/planning; no public accounts or stored personal planning profiles in this implementation.
- Local only: favorites, saved plans, visits, collections, searches and preferences, until the user shares/exports them.
- Memory cards: optional display name, visit date and note stay on the device until the user shares an image/caption through another app. No device memory history is sent to the hashtag dashboard.
- Public hashtag dashboard: the server independently stores public post URLs, account names, excerpts, dates and available engagement counts from public sources, with 30-day retention after observation. Coverage is incomplete.
- Optional approximate location: permission requested on use; no background collection.
- Maps: visible tile requests disclose connection data and map area to the provider.
- Opening a day in Google Maps transmits its planned stops and travel mode to Google.
- Google Mobile Ads: review identifiers, coarse location, interactions, diagnostics and advertising/analytics/fraud purposes using the exact SDK configuration. Non-personalized ads still process data.
- Configure UMP regional messages before production. Adult confirmation is not a substitute for the Play target-audience declaration.
- Verify HTTPS, server and proxy retention, deletion contact, SDK behavior and third-party terms.

Primary references: [Google SDK disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure), [Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [UMP integration](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent).

