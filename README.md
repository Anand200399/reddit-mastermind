# Reddit Mastermind

## What this is

This project is a **planning system** for Reddit content.

It plans:
- what to post
- where to post
- who posts it
- when it should be posted
- what comments and replies should look like

It does **not** post to Reddit.  
Posting is assumed to be handled by another system.

---

## What “Generate Week” does

When you click **Generate Week**, the app:
- creates the next week (Week 1, Week 2, etc.)
- plans multiple Reddit posts for that week
- rotates personas, subreddits, and keywords
- avoids repeating titles and topics
- respects subreddit post limits
- schedules posts at realistic times
- creates natural comment threads

Each week is saved and can be viewed later.

---

## How to view data

- `/calendar` shows the latest planned week
- Use the dropdown to view older weeks
- Click a post to see the full thread with comments

---

## Tech used

- Next.js
- Supabase (Postgres)
- TypeScript

---

## Database

All database SQL is included in the repo:

        supabase/
        ├── schema.sql
        ├── seed.sql
        └── reset.sql


Sample data is used for:
- company
- personas
- subreddits
- keywords

---

## Run locally


    npm install
    npm run dev


