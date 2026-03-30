

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 6**

Notifications & Communications Module

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Overview**

This document defines the complete notifications and communications architecture for the Mama Fua platform. It covers push notifications via Firebase FCM, SMS via Africa's Talking, transactional email via SendGrid, in-app notifications, and the in-app chat system.

*Every user interaction — booking confirmed, cleaner en route, payment received — is communicated through at least two channels to ensure delivery. Mobile push is primary; SMS is the fallback for critical events.*

# **2\. Notification Channels**

## **2.1 Channel Overview**

| Channel | Provider / Tech |
| :---- | :---- |
| Push notifications (mobile) | Firebase Cloud Messaging (FCM) |
| SMS | Africa's Talking |
| Email | SendGrid |
| In-app notifications | PostgreSQL \+ WebSocket real-time delivery |
| In-app chat | Socket.io rooms \+ PostgreSQL persistence |
| WhatsApp (future) | Twilio WhatsApp Business API — planned Phase 2 |

## **2.2 Channel Priority by Event**

| Event | Primary Channel | Fallback |
| :---- | :---- | :---- |
| Booking confirmed | Push \+ Email | SMS |
| Cleaner accepted job | Push | SMS |
| Cleaner en route | Push | SMS |
| Cleaner 5 min away | Push | SMS |
| Job completed | Push | SMS |
| Payment received (cleaner) | Push \+ SMS | Email |
| Payout processed | Push \+ SMS | Email |
| Dispute opened | Push \+ Email | SMS |
| Review request | Push | Email |
| OTP code | SMS only | None (retry) |
| Booking reminder (24hr before) | Push \+ SMS | Email |
| Promotional offer | Push | Email |

# **3\. Push Notifications — Firebase FCM**

## **3.1 Setup**

* Firebase project created at console.firebase.google.com.

* Android: google-services.json added to React Native project.

* iOS: GoogleService-Info.plist added \+ APNs certificate uploaded to Firebase.

* FCM server key stored in Railway environment variable FCM\_SERVER\_KEY.

* Device tokens collected via expo-notifications on app launch and stored in users.fcmToken.

* Token refresh handled automatically — updated in DB on each app open.

## **3.2 Sending Push Notifications**

// notification-service.ts

import \* as admin from 'firebase-admin';

export async function sendPush(userId: string, payload: PushPayload) {

  const user \= await prisma.user.findUnique({

    where: { id: userId }, select: { fcmToken: true }

  });

  if (\!user?.fcmToken) return;

  await admin.messaging().send({

    token: user.fcmToken,

    notification: { title: payload.title, body: payload.body },

    data: payload.data,  // deep link data e.g. { screen: 'Booking', bookingId: '...' }

    android: { priority: 'high', notification: { sound: 'default', channelId: 'bookings' } },

    apns: { payload: { aps: { sound: 'default', badge: 1 } } }

  });

}

## **3.3 Notification Channels (Android)**

| Channel ID | Description |
| :---- | :---- |
| bookings | All booking lifecycle events — high priority, sound on |
| payments | Payment and payout confirmations — high priority |
| chat | In-app chat messages — medium priority |
| promotions | Offers and promotional content — low priority, no sound |
| system | Account and security alerts — high priority |

## **3.4 Deep Linking**

Push notification data payloads include a screen and relevant ID so tapping the notification opens the correct screen:

| Event | Deep Link Data |
| :---- | :---- |
| Booking confirmed | { screen: 'BookingDetail', bookingId } |
| Cleaner accepted | { screen: 'TrackCleaner', bookingId } |
| New chat message | { screen: 'Chat', bookingId } |
| Payment received | { screen: 'Wallet' } |
| Dispute update | { screen: 'Dispute', disputeId } |
| Review request | { screen: 'WriteReview', bookingId } |

# **4\. SMS — Africa's Talking**

## **4.1 Integration**

* Account: Africa's Talking team account with Safaricom, Airtel, and Telkom coverage.

* Sender ID: 'MAMAFUA' (registered shortcode).

* SDK: @africastalking/africastalking npm package.

* Credentials in environment variables: AT\_API\_KEY, AT\_USERNAME.

// sms-service.ts

import AfricasTalking from '@africastalking/africastalking';

const at \= AfricasTalking({ apiKey: process.env.AT\_API\_KEY, username: process.env.AT\_USERNAME });

export async function sendSMS(phone: string, message: string) {

  const result \= await at.SMS.send({

    to: \[phone\],       // e.g. \+254712345678

    message,

    from: 'MAMAFUA'

  });

  return result;

}

## **4.2 SMS Templates**

All SMS templates are stored in the database and support English and Swahili. Variables use {{handlebars}} syntax.

| Template Key | English Text |
| :---- | :---- |
| otp\_verification | Your Mama Fua code is {{otp}}. Valid for 10 minutes. Do not share. |
| booking\_confirmed | Booking MF-{{ref}} confirmed\! {{cleanerName}} will arrive {{date}} at {{time}}. Track: {{link}} |
| cleaner\_accepted | {{cleanerName}} has accepted your job. They are {{distance}} away. ETA: {{eta}}. |
| job\_completed | Your job with {{cleanerName}} is complete. Rate your experience: {{link}} |
| payout\_sent | KES {{amount}} sent to your M-Pesa {{phone}}. Ref: {{mpesaRef}}. Mama Fua. |
| booking\_reminder | Reminder: {{cleanerName}} is scheduled for tomorrow at {{time}}. Location: {{area}}. |

# **5\. Email — SendGrid**

## **5.1 Email Types**

| Email Type | Trigger & Content |
| :---- | :---- |
| Welcome email | Sent on account creation. Onboarding tips and app download links. |
| Booking confirmation | Sent to client and cleaner. Full job details, date, location map thumbnail. |
| Payment receipt | Sent to client after payment. Itemised invoice with booking ref. |
| Cleaner earnings statement | Monthly PDF attachment. Full earnings summary for the month. |
| Dispute opened | Sent to both parties. Dispute ID, description, expected resolution time. |
| Dispute resolved | Outcome of dispute, refund details if applicable. |
| Account verification | KYC status update for cleaners — approved or rejected with reason. |
| Password reset | Secure reset link, valid 30 minutes. |

## **5.2 SendGrid Dynamic Templates**

* All email content managed as SendGrid Dynamic Templates — no HTML in code.

* Template IDs stored in environment variables (e.g. SENDGRID\_TEMPLATE\_BOOKING\_CONFIRMED).

* Handlebars variable substitution used for dynamic content.

* All emails sent from noreply@mamafua.co.ke with Reply-To: support@mamafua.co.ke.

* Unsubscribe handled by SendGrid's list management — promotional emails only.

* Transactional emails (OTP, receipts, booking confirmations) cannot be unsubscribed from.

# **6\. In-App Notification Centre**

## **6.1 Data Model**

Every notification sent to a user is also persisted in the notifications table for the in-app notification centre. Users can view, mark as read, and clear notifications.

| Field | Details |
| :---- | :---- |
| userId | Recipient user ID |
| type | Category: BOOKING, PAYMENT, REVIEW, CHAT, SYSTEM, PROMOTION |
| title | Short notification heading |
| body | Full notification message |
| data | JSONB: deep link data for tap action |
| isRead | Boolean — toggled when user taps notification |
| readAt | Timestamp of read action |

## **6.2 Real-Time Delivery**

New notifications are delivered to the client in real-time via WebSocket if the user is online, and via push notification if offline:

// On notification create:

await prisma.notification.create({ data: { userId, type, title, body, data } });

// Push to connected socket room if online

io.to(\`user:${userId}\`).emit('notification:new', { title, body, data });

// Also send FCM push (catches offline users)

await sendPush(userId, { title, body, data });

# **7\. In-App Chat**

## **7.1 Architecture**

Each booking has exactly one chat thread. Messages are sent via Socket.io and persisted in the chat\_messages table. Chat is only available between booking ACCEPTED and CONFIRMED status.

| Component | Role |
| :---- | :---- |
| Socket.io room | booking:{bookingId} — both client and cleaner join on booking acceptance |
| chat\_messages table | Persistent message history — survives app restarts |
| Redis | Stores active socket room membership for reconnection |
| REST endpoint | GET /chat/:bookingId/messages — load message history on screen open |

## **7.2 Chat Events**

// Client or cleaner sends message

socket.emit('chat:send', { bookingId, body, mediaUrl? });

// Server persists and broadcasts

socket.on('chat:send', async (data) \=\> {

  const msg \= await prisma.chatMessage.create({

    data: { bookingId: data.bookingId, senderId: socket.userId,

            body: data.body, mediaUrl: data.mediaUrl }

  });

  io.to(\`booking:${data.bookingId}\`).emit('chat:message', msg);

});

## **7.3 Chat Rules**

* Maximum message length: 1,000 characters.

* Media attachments: images only (JPG, PNG), max 5MB, uploaded to Cloudinary before send.

* Chat history retained for 90 days after booking completion, then archived.

* Profanity filter applied to outgoing messages (basic regex \+ word list).

* Chat is disabled once a booking is CANCELLED or REFUNDED.

* Admin can read any chat thread for dispute investigation.

*End of Document MF-DOC-006*

Mama Fua Platform — KhimTech  
Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru  |  2026