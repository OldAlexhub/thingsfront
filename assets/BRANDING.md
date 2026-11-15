# Things to Do branding

Original app identity created for Old Alex Hub with the built-in imagegen tool. These are actual project assets, not missing-logo placeholders.

- `logo.png`: transparent pin/check/route/sun symbol, used by the app and splash.
- `logo-lockup.png`: polished horizontal name/tagline on midnight navy.
- `app-icon-1024.png`: master launcher/store artwork.
- `../store_assets/app-icon-512.png`: 512 × 512 PNG Play icon.
- Android `mipmap-*`: standard and round density exports, adaptive layers. Editable monochrome Android vector is in `res/drawable/ic_brand_monochrome.xml`.

Palette: midnight navy #101827, deep teal #155E75, tropical teal #12B8A6, sunset gold #FFB454, warm white #F8F6F0.

The symbol combines a destination pin, a flowing route/check and a sun. The wordmark reads “Things to Do”, with “Discover. Explore. Experience.” Never bake the whole wordmark into the small launcher icon.

Final symbol generation prompt: “Create the final original app symbol for Things to Do, an elegant travel discovery and day planner app by Old Alex Hub. One large perfectly centered bold flat vector-style symbol on a truly transparent square canvas. A distinctive fluid tropical teal (#12B8A6) location-pin silhouette combined with a confident warm-white (#F8F6F0) sweeping check/route gesture inside, and one small sunset-gold (#FFB454) sun circle nestled at the upper-right of the pin. Evoke discovering a great day, motion, destinations, optimism. Premium minimal geometric brand design with beautifully balanced rounded curves, impeccably clean edges, strong silhouette, readable at tiny launcher size. Symbol occupies about 76 percent of canvas width and height with generous transparent padding. Solid flat fills only. No shadows, gradients, texture, lettering, background, mockups, extra variants, caption, or watermarks. This is the actual transparent foreground artwork to be used on midnight navy (#101827) Android launcher icons and in the app.”

Final lockup prompt: “Create the final clean polished logo lockup for Things to Do on a perfectly solid midnight navy #101827 opaque background. Preserve the provided teal map pin with the white sweeping check/route and gold sun as the logo symbol at left. To the right, set the exact name 'Things to Do' in clean warm-white bold rounded sans-serif typography. Under it, set 'Discover. Explore. Experience.' in smaller clean warm-white letters. Wide 3:1 composition, balanced padding, premium brand design. CRITICAL: absolutely crisp clean flat lettering, smooth solid letter interiors, no speckles, no distressed texture, no grain, no extra marks, no white remnants around letters, no drop shadows, no gradients, no mockup, no watermark. Background uniformly #101827. Name on one line. This is a finished horizontal logo asset, not a presentation sheet.”

Mechanical PNG size/padding exports are reproducible through `cd server; npm run branding`. Imagegen originals remain in the user's generated-image library; only the selected final assets are included here. Launcher foreground is centered inside the adaptive safe zone. [Android adaptive guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive) and [Play icon specification](https://developer.android.com/distribute/google-play/resources/icon-design-specifications).
