# Review: student site and admin together

Reviewed on 8 October 2026 by running both projects in a real browser (Chromium, automated), on desktop and a 390 px phone screen.

## What was tested
- **Student site:** all 40+ pages load with no script errors; full journey from sign-up and verification, enrolling with a key, 63 daily topics (reading timer, one-per-day rule, level assignments, closed levels), final exam, final project, certificate page; every dashboard screen at phone width.
- **Admin:** sign-in, all 22 sections, add/edit/delete, search, sort, filter, CSV export, Approve/Return/Refund/Revoke/Reply, Ctrl+K jump, and role restrictions (finance cannot open Students).
- **Both together** (same address): see the table below.

## Bugs found and fixed
1. Reading page overflowed sideways on phones (code blocks forced the page wider than the screen). Fixed.
2. Payments table overflowed on phones. Fixed.
3. Dashboard kept old data in memory, so changes made by an admin did not appear and could be overwritten. It now re-reads data on every screen change and when another tab changes it.
4. Admin "Needs attention" links used default blue. Restyled.

## How the two projects connect (demo)
Put the two folders side by side and serve them from one address, for example:
`tamp/site` and `tamp/admin`, then run `python3 -m http.server 8000` inside `tamp` and open `http://localhost:8000/site/index.html` and `http://localhost:8000/admin/index.html`.
(Opening files directly from disk keeps them separate, so the link does not work.)

| Student action | Admin sees | Admin action | Student sees |
|---|---|---|---|
| Registers | New student with progress % | Suspend | Login blocked, session ended |
| Submits assignment or final project | Submission with answers, link, file name | Approve final project | Certificate issued + notification |
| Pays or redeems a key | Payment row | Return with feedback | Notification with feedback |
| Sends a help ticket or contact form | Support ticket | Reply | Reply shown on the ticket + notification |
| Verifies a certificate publicly | Verification log row | Revoke certificate | Public check says revoked; certificate page shows revoked |
| - | - | Change pass mark, exam minutes, reading minutes | Student exam and reading timer use the new values |
| - | - | Send email or announcement | Notification in the student dashboard |
The mechanism is `admin/bridge.js` (browser storage). In production, both projects call one backend and one database; the table above is the contract the API must reproduce.

## Still not built (needs a real backend or more design work)
- Real email and SMS delivery (emails are shown as dashboard notifications in the demo).
- Real file upload and download of assignment files (only name and size are recorded).
- Courses, cohorts and topics created in admin do not yet change what students see; the student catalog is still fixed to Data Analysis.
- Bulk actions, saved filters, a custom role editor and two-person approval for large refunds.
- Real payment gateway, real NIN verification, real one-time codes.

## Update: forgot-password and AI instructor (tested in a real browser)
**Forgot password, outside the app** (15 checks passed): the login page links to it; unknown and known emails get the same message; reset links are random, single use and expire in 30 minutes; weak or mismatched passwords are rejected; reused or expired links show a clear "not valid" page with a way to request a new one; old password stops working; resetting logs the user out everywhere.
**Inside the app:** Settings > Change password checks the current password, enforces the same rules, and links to "Forgot your current password?". Admin > Students > "Send password reset" creates a real reset link and logs it.
**Added after the review:** cookie notice on every public page, favicon and descriptions, "Skip to content" links, 45-minute idle sign-out with a session-expired page, terms-acceptance timestamp at sign-up.
**AI instructor (admin):** prompt builder, importer (outline, topics batch, exam), validator, video verification, publish. Tested: an AI-format course imported, checked, blocked until videos were verified, published, then enrolled in and studied by a student (notes, code block, quiz and YouTube video shown).

## Update: states (tested in a real browser)
Built and tested: offline banner with automatic recovery, slow-connection notice, skeleton loading screens and progress bar, button spinners, full-screen busy overlay, in-app error screens (offline, timeout, server error, not found, forbidden, rate limit, session ended) each with a retry button and error code, standalone pages (403, 408, 429, offline, unsupported browser, payment failed, cohort full, plus existing 404, error, maintenance, session expired), maintenance mode switched from Admin > Settings, sign-out when the session ends in another tab, a service worker that keeps visited pages working with the server down and shows the offline page for others, a global "Something went wrong" screen with an error code for unexpected script errors, and a Connection test control (Settings) to see every state on demand.
Results: all checks passed in the student site and the admin; earlier journeys (sign-up to certificate, password reset, AI course publishing, student-admin link) still pass. One flaw found and fixed: a focus outline around the error heading, and the admin sidebar disappeared while an error showed.
See STATES_CATALOG.md for the full list and how to trigger each state.
