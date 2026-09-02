# Affordable Elegance by Kay Booking System

This project contains the first working version of the salon website and booking system.

## Built So Far

- Public salon website with branch, service, and booking sections.
- Branch-specific policies for Johannesburg, Midrand, and Pretoria.
- Service pricing, specials, durations, deposit rules, and full-payment option.
- 15-minute payment window with Capitec banking details and generated booking reference.
- Proof of payment upload flow for screenshots and PDFs.
- AI verification endpoint scaffold at `/api/verify-payment`.
- Admin portal at `/admin/` for bookings, payment review, service editing, service image upload, and manual approval/rejection/cancellation.
- Netlify Blobs storage scaffold at `/api/data` so deployed bookings and service edits can be shared across devices.

## Important Production Notes

The admin portal still needs proper authentication before it should be treated as private. Add Netlify Identity or another secure admin login before relying on the admin page for real bookings.

AI payment verification requires Netlify AI Gateway to be enabled on the Netlify project. Image proofs can be checked by AI first. PDF proofs currently go to manual review until PDF extraction is added.

AI can compare proof details against booking amount, recipient, reference, and date, but it cannot guarantee money truly reflected in the bank account unless a banking/payment API is connected.

## Recommended Next Steps

1. Add secure admin login and role protection.
2. Split public booking writes from protected admin edits.
3. Add automatic email notifications.
4. Add WhatsApp/SMS integration if the salon accepts possible third-party messaging costs.
5. Add real proof-file storage and audit history.
6. Add branch/staff capacity rules and dynamic lunch breaks.
