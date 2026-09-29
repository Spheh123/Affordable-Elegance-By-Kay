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
- Use a 30-day availability board to see open days, full days, closed days, and next available slots.
- Use a daily bookings calendar to see appointments by date, branch, and status.
- Add phone bookings, walk-ins, or last-minute bookings directly from admin.
- View new bookings.
- Call or WhatsApp a client from the booking record.
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
2. The **30-day availability board** shows which days have open slots, which days are full, and which days are closed.
3. The **Daily bookings calendar** shows bookings for the selected date.
4. The owner can filter the calendar by branch and status.
5. The calendar shows appointment time, service, client, branch, payment amount, balance, status, and client contact links.
6. New bookings also appear under **Bookings** for payment review.
7. Each booking shows the client, branch, date, time, payment amount, balance, reference, and proof file.
8. The owner checks the proof against the bank account.
9. The owner clicks:
   - **Approve** when the funds/proof are accepted.
   - **Review** when the proof needs manual checking.
   - **Reject** if payment is wrong or invalid.
   - **Cancel** if the client cancels or the booking cannot be accepted.

## 30-Day Availability Board

The **30-day availability board** is for capacity planning.

It lets the owner:
- Choose a branch.
- Choose the service/duration she wants to check.
- See the next 30 days from any selected start date.
- See days marked as open, almost full, full, closed, or walk-ins.
- See the next open slot.
- See the best day for last-minute clients.
- Quickly decide whether she can accept a phone booking or walk-in.

This is especially useful when a client calls and asks, “Do you have space today or tomorrow?” The owner can check the board and immediately see the best available day and time.

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

## Quick Add Booking

The **Quick Add** form is for bookings that do not start on the public website.

Use it when:
- A client books by phone.
- A client sends a WhatsApp message.
- A client walks in.
- The owner wants to block a slot manually.

The owner chooses the branch, service, date, open time, payment status, and notes. The booking is added to the same admin calendar and bookings list as website bookings.

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
7. Show the **30-day availability board** and explain open/full/closed days.
8. Show the booking in the **Daily bookings calendar**.
9. Show the same booking in the **Bookings** review list.
10. Add a manual phone/walk-in booking using **Quick Add**.
11. Approve or review the booking.
12. Edit a service price or special.
13. Update the announcement in Business settings.
14. Refresh the website and show that the public content updates.

## Important Next Upgrade

Before using this for real private business operations, add proper admin login protection through Netlify Identity or another authentication provider. The current portal is functional, but production admin access should be protected with real authentication.
