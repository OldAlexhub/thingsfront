import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { AppShell, SafeScrollView, Header, Label } from '../components';
export const privacyText = `Things to Do is developed by Old Alex Hub. Contact: info@oldalexhub.com. Updated November 15, 2026.

The app communicates with our backend for content, recommendations and itinerary planning. Requests may include your selected city, interests, starting coordinates, date, budget and participant ages. No public account is required. This backend processes planning inputs without saving them as a user profile. Application logs record request paths, status and timing, not request bodies or credentials.

Favorites, saved itineraries, collections, visited places, searches and preferences are stored locally. Android device backups are disabled. Clear local data in Settings or uninstall to remove it. Delete exported files separately. Cached provider content expires. Expired venue snapshots lose their provider content. Your own visit name, place title, date and note remain in your local memory until you delete them.

Memory cards are created on your device. An optional display name, visit date and note are stored locally. Sharing opens Android's share sheet and sends the selected image and caption to the app you choose. Exported images and shared posts must be deleted separately. Opening a day in Google Maps sends the planned places and travel mode to Google. These external services have their own privacy policies.

Public posts containing #old_alex_hub may be discovered through public Bluesky and Mastodon APIs or saved as links by our team. The server stores the public post URL, account name, a short excerpt, post date and available engagement counts for up to 30 days after a check. Private posts and your device's memory records are not uploaded to this dashboard. Public API coverage is incomplete. Contact info@oldalexhub.com to request removal from our records.

Approximate location is optional and requested only when you choose a nearby or starting-location feature. It may be sent to the backend to search or plan. There is no background location collection. Revoke permission in Android settings or enter a starting point manually.

Google Mobile Ads and User Messaging Platform are integrated. Advertising initializes automatically and requests ads when Google consent information permits. This app requests non-personalized ads. Providers may still process identifiers, IP address, coarse location, app interactions, diagnostics and ad performance information for delivery, measurement, fraud prevention and compliance. Non-personalized does not mean no data processing. Regional choices depend on the published Google consent configuration. Find advertising privacy choices in Settings. Ad or consent failures do not block the app.

Maps request visible tiles from the configured provider, initially OpenStreetMap, revealing IP address and viewed map area. No offline tile downloading is offered. Directions, booking and source links open external services with their own privacy policies.

Content comes from OpenStreetMap, Wikimedia Commons and licensed editorial contributors. Licensed venue photos are cached on our server when possible; direct Wikimedia image requests may reveal your IP address. City search in the Content Studio uses OpenStreetMap Nominatim. Events come from server-managed public calendars and editorial entries. Only event facts and organizer links are imported; source content is not republished in full. Source attribution appears with content. Imported records expire under configured provider retention. Synchronization logs default to 30 days, and admin audit entries to 90 days. Infrastructure may retain separate access logs according to the deployment configuration. Contact info@oldalexhub.com for questions or deletion requests about information held by Old Alex Hub.

The app is intended for adults planning activities, including family trips. Entered child ages support group suitability without names. Do not enter sensitive personal information. This app is not directed to children under 13. Google-supported privacy choices remain available in Settings.

Policy updates appear on this page. For privacy questions, contact info@oldalexhub.com.`;
export const termsText = `Things to Do is an activity discovery and planning service provided by Old Alex Hub. Contact info@oldalexhub.com.

Venue information, prices, hours, accessibility and events can change. Confirm details with the official venue or ticket provider before traveling or purchasing. Unknown information is identified. The app does not guarantee admission, availability, safety or suitability.

Itineraries use deterministic recommendations and scheduling. They are suggestions, not bookings. Travel times labeled as rough geographic estimates are not verified navigation routes and exclude live traffic. Follow official directions, local rules, weather advisories and your judgment. Meals, transport, taxes and fees are outside admission subtotals.

External booking providers control their own terms, fees and refunds. Old Alex Hub does not process payments or issue tickets in this release.

You control saved local data and exported files. Local data can be lost when uninstalling or clearing storage. Export important itineraries. Provider content may expire or be removed from saved snapshots under licensing requirements.

OpenStreetMap content is © OpenStreetMap contributors, available under ODbL 1.0. Other media carries its credited license or provider permission. Do not reuse content beyond those permissions.

Use the service lawfully. Do not attempt unauthorized access or disrupt the service. Availability may vary. These terms do not exclude rights or remedies that cannot lawfully be excluded.`;
export function LegalScreen() {
  const { kind } = useRoute<any>().params;
  return (
    <AppShell>
      <SafeScrollView>
        <Header
          back
          title={
            kind === 'privacy'
              ? 'Your privacy matters.'
              : 'A few things to know.'
          }
          kicker={kind === 'privacy' ? 'PRIVACY POLICY' : 'TERMS & DISCLAIMERS'}
        />
        <View style={{ paddingHorizontal: 24 }}>
          <Label muted>{kind === 'privacy' ? privacyText : termsText}</Label>
        </View>
      </SafeScrollView>
    </AppShell>
  );
}
