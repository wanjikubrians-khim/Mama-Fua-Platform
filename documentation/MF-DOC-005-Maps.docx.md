

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 5**

Maps, Location & Matching Engine

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Overview**

This document defines the location services, mapping, and cleaner matching engine for the Mama Fua platform. It covers Google Maps Platform integration, geospatial data handling, the auto-assign matching algorithm, proximity search, live cleaner tracking, and all location-related APIs.

*Location data is the operational backbone of this platform. The quality of the matching engine directly determines user retention — clients who get matched to a great cleaner quickly will return. Every millisecond and every metre of precision matters.*

# **2\. Google Maps Platform Integration**

## **2.1 APIs Used**

| Google Maps API | Usage in Platform |
| :---- | :---- |
| Maps JavaScript API | Interactive map on web app for browsing cleaners and entering job location. |
| Maps SDK for Android | Map display in React Native Android app (via react-native-maps). |
| Maps SDK for iOS | Map display in React Native iOS app (via react-native-maps). |
| Geocoding API | Convert user-typed address to latitude/longitude coordinates. |
| Reverse Geocoding API | Convert GPS coordinates to human-readable area name for display. |
| Distance Matrix API | Calculate travel time and distance between cleaner and job location. |
| Places API (Autocomplete) | Address search suggestions when client types job location. |
| Static Maps API | Generate static map thumbnails in booking confirmation emails. |

## **2.2 API Key Management**

* One API key per environment (development, staging, production).

* Keys stored in Railway/Vercel environment variables — never committed to code.

* Web key restricted by HTTP referrer (mamafua.co.ke domains only).

* Mobile key restricted by Android package name and iOS bundle ID.

* Server key restricted by IP address (Railway static IPs).

* Billing alerts configured at $50 and $100 monthly usage thresholds.

## **2.3 Address Autocomplete Flow**

When a client types a job address in the app, the Places Autocomplete API is queried to provide suggestions:

1. Client begins typing address. Frontend debounces input (300ms).

2. API call to GET /api/v1/location/autocomplete?input={text}\&sessiontoken={token}.

3. Backend proxies to Google Places Autocomplete API with Kenya country bias (components=country:ke).

4. Results returned as list of place suggestions with place\_id and description.

5. Client selects a suggestion. Frontend calls GET /api/v1/location/place?place\_id={id}.

6. Backend calls Google Place Details API to get precise lat/lng for the selected address.

7. Coordinates stored on the booking or address record.

   *All Maps API calls are proxied through the backend — API keys are never exposed to the frontend. The session token groups autocomplete \+ place details calls for billing efficiency.*

# **3\. Geospatial Data Architecture**

## **3.1 Coordinate Storage**

All geographic coordinates are stored as DOUBLE PRECISION latitude/longitude pairs in PostgreSQL. PostGIS extension is enabled for advanced spatial queries.

| Table.Column | Purpose |
| :---- | :---- |
| cleaner\_profiles.serviceAreaLat/Lng | Centre of cleaner's service area |
| cleaner\_profiles.serviceAreaRadius | Maximum service distance in km |
| cleaner\_profiles.currentLat/Lng | Live GPS position (updated every 10 seconds while on job) |
| addresses.lat/lng | Geocoded job location coordinates |
| bookings via addresses | Job location resolved at booking creation time |

## **3.2 PostGIS Spatial Queries**

Cleaner proximity search uses PostGIS's geography type and ST\_DWithin for radius-based filtering:

\-- Find all available cleaners within 10km of job location

SELECT cp.\*, u.firstName, u.lastName,

  ST\_Distance(

    ST\_MakePoint(cp.serviceAreaLng, cp.serviceAreaLat)::geography,

    ST\_MakePoint($jobLng, $jobLat)::geography

  ) AS distanceMetres

FROM cleaner\_profiles cp

JOIN users u ON u.id \= cp.userId

WHERE cp.isAvailable \= true

  AND cp.verificationStatus \= 'VERIFIED'

  AND ST\_DWithin(

    ST\_MakePoint(cp.serviceAreaLng, cp.serviceAreaLat)::geography,

    ST\_MakePoint($jobLng, $jobLat)::geography,

    cp.serviceAreaRadius \* 1000  \-- convert km to metres

  )

ORDER BY distanceMetres ASC;

## **3.3 Geospatial Index**

A spatial index is created on the service area coordinates to make proximity queries performant at scale:

CREATE INDEX idx\_cleaner\_location

ON cleaner\_profiles

USING GIST (ST\_MakePoint(serviceAreaLng, serviceAreaLat)::geography);

This index reduces proximity query time from O(n) full table scan to O(log n) with spatial partitioning. Essential once the cleaner count grows beyond a few hundred.

# **4\. Auto-Assign Matching Engine**

## **4.1 Algorithm Overview**

The auto-assign matching engine is the core of the platform's operational efficiency. It runs whenever a client submits a booking in AUTO\_ASSIGN mode and finds the optimal cleaner for the job.

*The matching algorithm is designed to maximise booking acceptance rate, not just proximity. A cleaner 2km away who accepts 95% of offers is worth more than one 0.5km away who accepts 40%.*

## **4.2 Scoring Algorithm**

Each candidate cleaner is assigned a match score. The cleaner with the highest score is offered the job first. If they decline or don't respond within 5 minutes, the next highest-scoring cleaner is tried.

| Scoring Factor | Weight & Logic |
| :---- | :---- |
| Distance | 40% — scored inversely to distance. 0km \= 100 pts, 10km \= 0 pts, linear interpolation. |
| Rating | 30% — (rating / 5.0) \* 100 pts. Cleaners below 3.5 are excluded from matching. |
| Acceptance rate | 20% — based on last 30 days. 100% acceptance \= 100 pts, 50% \= 50 pts. |
| Jobs completed | 5% — log scale. 0 jobs \= 0 pts, 100+ jobs \= 100 pts. Rewards experience. |
| Last active | 5% — bonus for cleaners who updated availability in last 2 hours. |

// Match score calculation (TypeScript)

function calculateMatchScore(cleaner: CleanerCandidate, job: JobRequest): number {

  const distanceKm \= haversineDistance(cleaner.lat, cleaner.lng, job.lat, job.lng);

  const distanceScore \= Math.max(0, (10 \- distanceKm) / 10\) \* 100;

  const ratingScore \= (cleaner.rating / 5.0) \* 100;

  const acceptanceRate \= cleaner.acceptedLast30 / cleaner.offeredLast30;

  const acceptanceScore \= acceptanceRate \* 100;

  const jobScore \= Math.min(100, Math.log10(cleaner.totalJobs \+ 1\) \* 50);

  const hoursSinceActive \= (Date.now() \- cleaner.lastActiveAt) / 3600000;

  const activityBonus \= hoursSinceActive \< 2 ? 100 : 0;

  return (distanceScore \* 0.40) \+ (ratingScore \* 0.30) \+

         (acceptanceScore \* 0.20) \+ (jobScore \* 0.05) \+ (activityBonus \* 0.05);

}

## **4.3 Matching Flow (Step by Step)**

8. Client submits AUTO\_ASSIGN booking. Booking created with status PENDING.

9. Location service geocodes job address to lat/lng (if not already a saved address).

10. PostGIS query returns candidate cleaners within radius who offer the requested service.

11. Candidates filtered: must be VERIFIED, isAvailable=true, rating \>= 3.5, not currently on another job.

12. Remaining candidates scored using calculateMatchScore(). Sorted descending.

13. Top 10 candidates stored as match queue in Redis (key: match:{bookingId}).

14. Push notification sent to \#1 candidate: 'New job available — 5 minutes to respond'.

15. If candidate accepts: booking.cleanerId set, status → ACCEPTED, match queue cleared. Payment initiated.

16. If candidate declines or 5 minutes pass with no response: next candidate offered. Attempt tracked.

17. If all candidates exhausted (rare): booking status set to PENDING, client notified 'Searching for available cleaners'. Retry in 15 minutes.

## **4.4 Availability Management**

### **4.4.1 Availability Slots**

Cleaners set their availability via a weekly calendar in the app. Each slot represents a time block when they are available to take jobs:

| Field | Description |
| :---- | :---- |
| cleanerId | Owning cleaner |
| dayOfWeek | 0=Sunday through 6=Saturday |
| startTime | TIME e.g. 08:00 |
| endTime | TIME e.g. 17:00 |
| isRecurring | True \= weekly recurring, False \= one-time override |
| specificDate | Set when isRecurring=false for date-specific blocks |
| isBlocked | True \= unavailable (holiday/personal time override) |

### **4.4.2 Real-Time Availability**

Beyond the schedule, the matching engine checks real-time status:

* A cleaner is excluded from matching if they have an active booking with status IN\_PROGRESS.

* A cleaner is excluded if they have a booking with status ACCEPTED or PAID scheduled within the next 2 hours.

* Cleaners can toggle isAvailable to false in the app at any time to stop receiving job offers immediately.

# **5\. Browse & Pick Search**

## **5.1 Search Filters**

When a client browses cleaners directly, the following filters are applied:

| Filter | Implementation |
| :---- | :---- |
| Location | PostGIS radius from job address. Default 10km, client can expand to 20km. |
| Service type | JOIN to cleaner\_services where serviceId \= requested service. |
| Date/time | Availability slot check for requested date and time window. |
| Minimum rating | Default 3.5. Client can filter to 4.0 or 4.5 minimum. |
| Price range | Filter on cleaner\_services.customPrice between min and max. |
| Gender preference | Optional filter on cleaner profile (cleaner must have disclosed). |
| Language | Swahili-speaking filter on cleaner profile flag. |

## **5.2 Search Result Sorting**

Default sort order for Browse & Pick results:

* Primary: Recommended (composite of rating, distance, acceptance rate — same formula as matching engine).

* Alternative sorts: Distance (nearest first), Rating (highest first), Price (lowest first).

* Results paginated: 20 per page. Map view shows all results in the visible map viewport.

## **5.3 Cleaner Profile Card**

Each search result shows the cleaner's profile card containing:

* Profile photo, first name, and verified badge.

* Star rating and total review count.

* Distance from job location (e.g. '2.4 km away').

* Services offered with individual prices.

* Next available time slot.

* Short bio excerpt (up to 120 characters).

* Tap to open full profile with all reviews and availability calendar.

# **6\. Live Location Tracking**

## **6.1 Tracking Architecture**

When a cleaner has an accepted job and is en route, the platform enables live GPS tracking so the client can monitor their arrival. This uses WebSockets (Socket.io) for real-time position updates.

| Component | Role |
| :---- | :---- |
| React Native app (cleaner) | Emits GPS coordinates every 10 seconds using expo-location watchPositionAsync. |
| Socket.io server | Receives position updates. Broadcasts to booking room. |
| React Native app (client) | Listens for cleaner:location events. Updates map marker. |
| Redis | Stores last known position with 60-second TTL. Used for position recovery on reconnect. |
| PostgreSQL | NOT used for live position — no GPS history is stored to protect cleaner privacy. |

## **6.2 Location Emission (Cleaner App)**

// expo-location setup in cleaner app

const startTracking \= async (bookingId: string) \=\> {

  const { status } \= await Location.requestForegroundPermissionsAsync();

  if (status \!== 'granted') return;

  await Location.watchPositionAsync(

    { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 20 },

    (location) \=\> {

      socket.emit('cleaner:position', {

        bookingId,

        lat: location.coords.latitude,

        lng: location.coords.longitude,

        accuracy: location.coords.accuracy,

        timestamp: location.timestamp

      });

    }

  );

};

## **6.3 Privacy & Battery**

* Live tracking is ONLY active when a booking is in ACCEPTED or IN\_PROGRESS status.

* Tracking stops automatically when the booking moves to COMPLETED.

* Cleaner is shown a visible indicator in the app when tracking is active.

* The client sees the cleaner's position on a map but NOT their exact home address.

* 10-second intervals and 20-metre distance filter reduce battery consumption significantly.

* Background location requires foreground service notification on Android (shown as 'Mama Fua is tracking your route').

# **7\. ETA & Distance Calculation**

## **7.1 Distance Matrix API**

When a booking is accepted, the platform calculates the estimated travel time from the cleaner's current location to the job address using the Google Distance Matrix API:

// Backend: calculate ETA after booking acceptance

const matrix \= await googleMapsClient.distancematrix({

  origins: \[\`${cleaner.currentLat},${cleaner.currentLng}\`\],

  destinations: \[\`${job.lat},${job.lng}\`\],

  mode: 'driving',

  departure\_time: 'now',

  traffic\_model: 'best\_guess',

  region: 'ke'  // Kenya traffic data

});

const durationSeconds \= matrix.rows\[0\].elements\[0\].duration\_in\_traffic.value;

const arrivalTime \= new Date(Date.now() \+ durationSeconds \* 1000);

The calculated ETA is:

* Shown on the client's tracking screen as 'Cleaner arriving at approximately 2:45 PM'.

* Recalculated every 2 minutes while the cleaner is en route.

* Sent as a push notification when cleaner is 5 minutes away.

## **7.2 Service Area Validation**

When a client enters a job location, the platform checks that at least 3 verified cleaners serve that area before allowing the booking to proceed. This prevents bookings from being created in areas with no coverage:

async function checkAreaCoverage(lat: number, lng: number, serviceId: string) {

  const count \= await prisma.$queryRaw\`

    SELECT COUNT(\*) FROM cleaner\_profiles cp

    JOIN cleaner\_services cs ON cs.cleanerId \= cp.id

    WHERE cs.serviceId \= ${serviceId}

    AND cp.verificationStatus \= 'VERIFIED'

    AND ST\_DWithin(

      ST\_MakePoint(cp.serviceAreaLng, cp.serviceAreaLat)::geography,

      ST\_MakePoint(${lng}, ${lat})::geography,

      cp.serviceAreaRadius \* 1000

    )

  \`;

  return count \>= 3;

}

# **8\. Location Service API Endpoints**

| Endpoint | Description |
| :---- | :---- |
| GET /location/autocomplete | Address autocomplete suggestions (proxied Places API). |
| GET /location/place | Place details by place\_id (lat/lng \+ formatted address). |
| GET /location/geocode | Convert free-text address to coordinates. |
| GET /location/reverse | Convert lat/lng to human-readable area name. |
| GET /location/coverage | Check if an area has cleaner coverage for a service. |
| GET /location/cleaners/nearby | List available cleaners near a point (Browse & Pick). |
| GET /location/distance | Travel time and distance between two points. |
| POST /location/cleaner/position | Cleaner updates current GPS position (authenticated). |
| GET /location/cleaner/:id/position | Get last known position of a specific cleaner (booking parties only). |

*End of Document MF-DOC-005*

Mama Fua — KhimTech  |  Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru