# Affordable Elegance by Kay - Client Handover Notes

## What Was Built

This is a salon booking website with a connected admin portal.

The public website lets clients:
- View the brand, services, specials, and branches.
- Pick a branch, service, date, and appointment time.
- Enter their contact details and special notes.
- See the total price, required payment amount, balance, and duration.
- Receive a unique payment reference.
- Upload proof of payment for review.

The admin portal lets the salon:
- Use a daily bookings calendar to see appointments by date, branch, and status.
- View new bookings.
- See proof of payment attached to each booking.
- Approve, review, reject, or cancel bookings.
- Edit service names, categories, prices, special prices, duration, deposit rules, available branches, and service pictures.
- Update public announcements, payment notices, deposit percentage, payment window, and banking details.

## Client Booking Flow

1. A client opens the website and clicks **Book an appointment**.
2. The client chooses a branch.
3. The site shows only services available at that branch.
4. The client picks a date and time.
5. The system checks existing bookings and hides times that are already taken.
6. The client enters name, phone, WhatsApp, optional email, and notes.
7. The client chooses whether to pay the required deposit or full amount.
8. The site creates a payment reference.
9. The payment panel opens with banking details and a countdown window.
10. The client uploads proof of payment.
11. The booking moves to admin review.

## Admin Review Flow

1. The owner opens `/admin/`.
2. The **Daily bookings calendar** shows bookings for the selected date.
3. The owner can filter the calendar by branch and status.
4. The calendar shows appointment time, service, client, branch, payment amount, balance, and status.
5. New bookings also appear under **Bookings** for payment review.
6. Each booking shows the client, branch, date, time, payment amount, balance, reference, and proof file.
7. The owner checks the proof against the bank account.
8. The owner clicks:
   - **Approve** when the funds/proof are accepted.
   - **Review** when the proof needs manual checking.
   - **Reject** if payment is wrong or invalid.
   - **Cancel** if the client cancels or the booking cannot be accepted.

## Calendar View

The **Daily bookings calendar** is the salon diary.

It lets the owner:
- Pick any date.
- View bookings for all branches or one branch.
- Filter active bookings, confirmed bookings, pending payments, reviews, rejected bookings, or cancelled bookings.
- See how many appointments are on that day.
- See how many are confirmed.
- See the expected value of booked services for the selected day.

This is useful before opening each morning because the owner can quickly see who is coming in, what service they booked, whether payment is confirmed, and which branch the appointment belongs to.

## Admin Settings

The **Business settings** section controls important live website text:
- Top announcement, for example: “Spring Special valid till 30 September”.
- Payment notice, for example: “EFT or Capitec transfer only”.
- Deposit percentage.
- Payment window in minutes.
- Banking details shown to clients.

The **Service manager** controls:
- Normal price.
- Special price.
- Service duration.
- Deposit rule.
- Service image.
- Branch availability.

## Security And HTTPS

The code includes Netlify security headers:
- HTTPS upgrade requests.
- Strict Transport Security.
- Content type protection.
- Frame protection.
- Admin no-index headers.

Important: if the browser still says **Not Secure**, that is usually a Netlify/domain setup issue, not the design code. Check these in Netlify:
- The client must open the `https://` version of the website.
- Netlify **Domain management > HTTPS** must show an active SSL certificate.
- If using a custom domain, DNS records must point correctly to Netlify.
- Netlify’s **Force HTTPS** option should be enabled.

## What To Say In The Meeting

“The site is not just a normal landing page. It is a booking system connected to an admin portal. A client can choose a branch, select a service, see pricing, generate a payment reference, upload proof of payment, and then the admin can approve or reject the booking. You can also update prices, specials, service images, deposit rules, announcements, and bank details yourself without editing code.”

## Suggested Demo Order

1. Show the homepage and explain the premium brand experience.
2. Scroll to the booking section.
3. Create a test booking.
4. Show the payment window and reference.
5. Upload a test proof.
6. Open `/admin/`.
7. Show the booking in the **Daily bookings calendar**.
8. Show the same booking in the **Bookings** review list.
9. Approve or review the booking.
10. Edit a service price or special.
11. Update the announcement in Business settings.
12. Refresh the website and show that the public content updates.

## Important Next Upgrade

Before using this for real private business operations, add proper admin login protection through Netlify Identity or another authentication provider. The current portal is functional, but production admin access should be protected with real authentication.
