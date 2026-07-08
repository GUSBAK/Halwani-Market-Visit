# Halwani Market Visit MVP

This is a mobile-first prototype for supermarket market visits.

## What it does

- New market visit
- One-time GPS check-in
- Store details
- Execution checklist
- SKU availability checklist
- Photo upload with categories and notes
- Competitor activity notes
- Actions required with owner, priority, due date, and status
- Visit history saved locally in the browser
- Export visit report with photos and actions
- Print or save the report as PDF

## How to run

Open `index.html` in a browser.

For best mobile testing, host the folder on a local server or upload it to any static hosting service.

## Important

This first version stores data in browser localStorage only. The next version should connect to Supabase or Firebase so visits, photos, users, stores, SKUs, and actions are synced across the team.

## Suggested next build phase

1. Add login and roles
2. Add master store list
3. Add master SKU list by category
4. Add cloud photo storage
5. Add action assignment notifications
6. Add dashboard by store, city, chain, user, and SKU
7. Add AI shelf recognition later after collecting enough shelf photos
