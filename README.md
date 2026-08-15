# The Ledger — Reading Tracker (Phase 1)

This is Phase 1 of your reading tracker: the Work/TBR/Reading-Instance/Reading-Entry
data model, adding books (with automatic Open Library cover/page/ISBN lookup),
short stories, and articles to your TBR, filtering and sorting the shelf, and
Currently Reading with a daily log that auto-calculates pages read.

Everything below is free. No credit card needed anywhere in this guide.

## What you're setting up

- **GitHub** — holds the code
- **Supabase** — your database (free tier, plenty for years of personal reading data)
- **Vercel** — hosts the live website, redeploys automatically whenever the code changes

This is a one-time setup, about 15–20 minutes, entirely by clicking buttons.

---

## Step 1 — Create the database (Supabase)

1. Go to **supabase.com** and sign up (free, GitHub or email login).
2. Click **New Project**. Give it any name, e.g. "reading-tracker". Choose any region close to you. Set a database password (save it somewhere, though you won't need it for this setup).
3. Once the project finishes setting up (~1 minute), go to the **SQL Editor** in the left sidebar.
4. Click **New query**.
5. Open the file `supabase/schema.sql` from this project, copy its entire contents, and paste it into the SQL editor.
6. Click **Run**. You should see "Success. No rows returned." This has created your four tables: `works`, `tbr_entries`, `reading_instances`, `reading_entries`.
7. Go to **Project Settings → API** (gear icon, bottom left). Keep this tab open — you'll need two values from here in Step 3:
   - **Project URL**
   - **anon public** key

---

## Step 2 — Put the code on GitHub

1. Go to **github.com** and sign up if you don't have an account (free).
2. Click the **+** in the top right → **New repository**. Name it `reading-tracker`, keep it private or public (your choice), click **Create repository**.
3. On the new repo's page, click **uploading an existing file**.
4. Drag the entire unzipped `reading-tracker` folder (the one I've given you) into the upload area. Modern GitHub preserves the folder structure when you drag a whole folder in Chrome or Edge.
5. Scroll down, click **Commit changes**.

*(Note: `.env.local` is deliberately not included / not uploaded — your database keys go into Vercel directly in Step 3, not into the code itself.)*

---

## Step 3 — Deploy the live website (Vercel)

1. Go to **vercel.com** and sign up using your **GitHub account** (this lets Vercel see your repo).
2. Click **Add New… → Project**.
3. Find `reading-tracker` in the list and click **Import**. Vercel will auto-detect it's a Next.js app — you don't need to change any build settings.
4. Before clicking Deploy, open **Environment Variables** and add two:
   - `NEXT_PUBLIC_SUPABASE_URL` → paste the **Project URL** from Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste the **anon public** key from Supabase
5. Click **Deploy**. Wait about a minute.
6. You'll get a live URL like `reading-tracker-yourname.vercel.app` — open it. That's your app, live and permanent.

---

## Using it afterward

Whenever I give you updated code for Phase 2, 3, or 4, the process is just: upload the new/changed files to the same GitHub repo (same drag-and-drop upload screen), and Vercel redeploys automatically within about a minute. No new setup needed.

## A note on privacy

Phase 1 has no login screen — anyone with your exact URL could view or edit your data, though the URL itself is not discoverable or guessable. This is fine for personal use, but if you'd like a simple passphrase lock or full login before you rely on this long-term, mention it and I'll add that as an early Phase 2 item — it's a small addition.

## What's next

Phase 2 adds the Diary (chronological view of every session), the Library archive,
finishing a work (rating/review/favorite), and rereading support. Just let me know
when you're ready and I'll pick it up from here — the database schema already has
room for all of it.
