

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 7**

Admin Dashboard & Analytics

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Overview**

This document specifies the Mama Fua admin dashboard — the control centre for platform operators. It covers all admin capabilities, the analytics system, dispute management workflows, cleaner verification, payout management, and the permission model.

*The admin dashboard is a separate Next.js application deployed independently from the client and cleaner apps. It is accessible only from whitelisted IP addresses and requires two-factor authentication for all admin accounts.*

# **2\. Admin Roles & Permissions**

| Permission | Admin | Super Admin |
| :---- | :---- | :---- |
| View all users | Yes | Yes |
| Suspend / ban users | Yes | Yes |
| Approve cleaner verification | Yes | Yes |
| Reject cleaner verification | Yes | Yes |
| View all bookings | Yes | Yes |
| Cancel any booking | Yes | Yes |
| Resolve disputes | Yes | Yes |
| Approve payouts | Yes | Yes |
| View financial reports | Yes | Yes |
| Manage service categories | No | Yes |
| Change commission rates | No | Yes |
| Create / remove admin accounts | No | Yes |
| View audit log | Read only | Full access |
| System configuration | No | Yes |
| Export raw data | No | Yes |

# **3\. Dashboard Sections**

## **3.1 Overview Dashboard**

The home screen of the admin dashboard shows real-time platform KPIs:

* Live bookings in progress — count and map view.

* Bookings today — total, completed, cancelled, disputed.

* GMV today and this month — with comparison to previous period.

* Revenue today and this month — platform commission earned.

* New user registrations today — clients and cleaners separately.

* Cleaners pending verification — queue count with link to verification workflow.

* Open disputes — count with oldest unresolved highlighted.

* Pending payouts — total amount awaiting disbursement.

## **3.2 User Management**

Admins can search, view, and manage all user accounts:

* Search by name, phone, email, or user ID.

* Filter by role (CLIENT, CLEANER), status (ACTIVE, SUSPENDED, BANNED), and verification status.

* View full user profile: account details, booking history, payment history, reviews.

* Suspend account — prevents login, hides from search. Reversible.

* Ban account — permanent. Flags phone number and device ID to prevent re-registration.

* Add admin note to any user account (internal only, not visible to user).

## **3.3 Cleaner Verification Workflow**

The verification queue is the most time-sensitive admin function. New cleaner applications must be reviewed within 48 hours.

1. Admin opens verification queue — sorted by submission date, oldest first.

2. Opens application: views National ID front and back, selfie photo, and entered ID number.

3. Manually compares selfie against ID photo. Checks ID is not expired or damaged.

4. Cross-references ID number against internal blacklist (previously banned accounts).

5. Approve: cleaner status set to VERIFIED. Welcome push \+ SMS \+ email sent. Profile goes live.

6. Reject: admin selects rejection reason (BLURRY\_PHOTO, ID\_EXPIRED, FACE\_MISMATCH, BLACKLISTED, OTHER). Cleaner notified with reason and invitation to resubmit.

## **3.4 Booking Management**

Admins have full visibility into all bookings on the platform:

* View booking list with filters: status, service type, date range, cleaner, client, area.

* View full booking detail: all state transitions with timestamps, payment records, chat thread.

* Cancel a booking with reason — triggers appropriate refund flow.

* Manually reassign a booking to a different cleaner (e.g. if accepted cleaner becomes unavailable).

* Force-complete a booking that is stuck in IN\_PROGRESS beyond scheduled end time.

# **4\. Dispute Management**

## **4.1 Dispute Resolution Workflow**

7. Dispute appears in admin queue with booking details, client description, and any evidence photos.

8. Admin reviews: reads chat history, views before/after job photos, checks cleaner's response.

9. Admin contacts both parties via in-app message if additional information is needed.

10. Admin selects resolution outcome:

    * Full refund to client — booking funds returned, cleaner earns nothing.

    * Partial refund to client — split decided by admin (e.g. 50/50).

    * Cleaner paid in full — dispute rejected, funds released to cleaner.

11. Admin records resolution notes. Both parties notified of outcome via push \+ email.

12. If cleaner is found at fault: dispute count incremented. 3 disputes \= automatic suspension for review.

## **4.2 Dispute SLA**

| Dispute Severity | Resolution Target |
| :---- | :---- |
| Standard (quality complaint) | 72 hours |
| High (no-show, safety concern) | 24 hours |
| Critical (theft, assault allegation) | 4 hours — escalate to Super Admin |

# **5\. Analytics & Reporting**

## **5.1 Platform Analytics**

| Metric | Calculation | Update Frequency |
| :---- | :---- | :---- |
| GMV | SUM(bookings.totalAmount) WHERE status=CONFIRMED | Real-time |
| Revenue | SUM(bookings.platformFee) WHERE status=CONFIRMED | Real-time |
| Take rate | Revenue / GMV \* 100 | Real-time |
| Bookings count | COUNT(bookings) by status | Real-time |
| Avg booking value | GMV / confirmed bookings count | Daily |
| Cleaner utilisation | Booked hours / available hours per cleaner | Daily |
| Client retention | % of clients with 2+ bookings in 30 days | Weekly |
| Avg rating | AVG(reviews.rating) platform-wide | Real-time |
| Time to match | AVG(bookings.acceptedAt \- bookings.createdAt) | Daily |
| Dispute rate | Disputed bookings / total completed bookings | Daily |

## **5.2 Geographic Analytics**

* Heatmap of booking density by Nairobi sub-county and estate.

* Coverage gap analysis — areas with high client demand but low cleaner supply.

* Average cleaner travel time by area — identifies where more local cleaners are needed.

## **5.3 Cohort Analysis**

* Weekly cohort retention — what % of clients who first booked in week W are still booking in W+4.

* Cleaner earnings growth — do cleaners earn more after 3, 6, 12 months on platform?

* Service mix over time — which service categories are growing fastest.

## **5.4 Report Exports**

All reports are exportable as CSV or PDF from the admin dashboard:

* Transaction report — all payments in a date range with booking ref, method, amount, status.

* Payout report — all cleaner disbursements with date, method, amount, and M-Pesa receipt.

* Tax report — earnings by cleaner for KRA compliance (cleaners earning above KES 100,000/year).

* Dispute report — all disputes with outcome and refund amounts.

# **6\. Payout Management**

## **6.1 Payout Queue**

The payout queue shows all pending withdrawal requests from cleaners, ordered by submission time:

* Columns: cleaner name, amount, method (M-Pesa/bank), requested at, wallet balance.

* Auto-approved payouts (below KES 5,000) are processed automatically and do not appear in queue.

* Manual review queue shows payouts of KES 5,000 and above.

* Approve: triggers B2C M-Pesa payment or bank transfer instruction. Status → PROCESSING.

* Reject: amount returned to wallet. Cleaner notified with reason.

## **6.2 Bulk Payouts**

Admins can process all approved payouts in a single batch operation, typically done at 10am and 4pm daily. The bulk payout job:

13. Fetches all payouts with status PENDING and amount below auto-approve threshold.

14. Groups M-Pesa payouts into a single B2C batch request to Daraja API.

15. Sends bank transfer instructions to the platform's bank for EFT processing.

16. Updates all payout records to PROCESSING status.

17. Monitors callbacks and updates to COMPLETED or FAILED accordingly.

*End of Document MF-DOC-007*

Mama Fua Platform — KhimTech  
Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru  |  2026