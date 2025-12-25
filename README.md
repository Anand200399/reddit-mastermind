# Reddit Mastermind – Planning Algorithm Assignment

## Overview

This project focuses on **designing a planning algorithm for Reddit content**, as requested in the assignment.

The goal is **not** to post to Reddit, but to plan:
- what should be posted
- where it should be posted
- who should post it
- when it should be posted
- how the conversation should look

Posting and commenting are assumed to be handled by existing systems.

---

## What this project does

For a given company, the system generates a **weekly Reddit content plan**.

Each planned week includes:
- multiple Reddit posts
- assigned personas (fake Reddit users)
- target subreddits with posting limits
- scheduled post times
- rotated keywords
- realistic comment threads with replies

The output is a **weekly content calendar** that can be reviewed and reused.

---

## Generate Week (core logic)

Clicking **Generate Week**:

1. Finds the most recent planned week
2. Creates the next week (Week N + 1)
3. Plans posts for that week based on company settings
4. Rotates personas, subreddits, and keywords
5. Avoids repeating titles and topics
6. Respects subreddit posting limits
7. Schedules posts at realistic times
8. Plans natural comment and reply threads
9. Saves everything to the database

Each week is stored and does not overwrite previous weeks.

---

## Viewing planned data

- `/calendar` shows the latest planned week by default
- A dropdown allows viewing **previous weeks**
- Clicking a post opens a **thread view** with nested comments

This makes it easy to inspect how the planning algorithm behaves over time.

---

## What this project does NOT do

- Does not post to Reddit
- Does not use Reddit APIs
- Does not authenticate users
- Does not scrape real Reddit data

This is intentional and matches the assignment requirement to focus only on planning.

---

## Tech used

- Next.js (App Router)
- Supabase (Postgres)
- TypeScript

---

## Database setup

All database SQL is included in the repository:

        supabase/
        ├── schema.sql -- table definitions
        ├── seed.sql -- sample data (company, personas, subreddits, keywords)
        └── reset.sql -- clears generated weeks, posts, and comments

The system runs entirely on **sample data**, as expected for this assignment.

---

## Running locally

        npm install
        npm run dev

## Deployment (Live Demo)

This project is deployed on **Vercel**.

### Live Demo
        https://reddit-mastermind-johs.vercel.app

### How deployment works
- The app is built using **Next.js (App Router)**
- It is connected to **Supabase** for database access
- Vercel automatically deploys the app on every push to the main branch

### Environment Variables (Vercel)
The following environment variables are configured in Vercel:

        'NEXT_PUBLIC_SUPABASE_URL'
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        'SUPABASE_SERVICE_ROLE_KEY'

These are required for reading data from Supabase.

### How to test the app
1. Open the live link
2. Click **Generate Week** on the home page
3. View the weekly calendar on `/calendar`
4. Use the dropdown to switch between previous weeks
5. Click a post title to open the full thread with nested comments

> Note: This project focuses on **planning and scheduling logic only**.  
> Actual posting to Reddit is assumed to be handled by external systems.

