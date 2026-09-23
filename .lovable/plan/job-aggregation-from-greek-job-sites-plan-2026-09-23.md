# Job Aggregation from Greek Job Sites — Plan

## 1. Findings: APIs / feeds

- **xe.gr, kariera.gr, skywalker.gr**: no public, documented job API or RSS feed found. Existing integrations in the wild are all scrapers (open-source crawlers and paid Apify "actors" for kariera.gr and skywalker.gr). This is unconfirmed beyond public search results, so step 1 of the build is to email each site's partnerships team and ask about an official XML/partner feed.
- **Current state in this app**: an `import-jobs` function already uses Firecrawl *search* (`site:xe.gr ...`). It rarely returns real listing links, which is why jobs ended up with search URLs or no link.

**Recommended approach (ranked)**
1. **Official partner feed** (best) — if any site gives one, use it and skip scraping.
2. **Managed scraper per site** (for example Apify actors for kariera.gr and skywalker.gr, or Firecrawl scrape of the real listing pages) run by a scheduled backend function once a day. Parsing is handled by a maintained tool, not our own fragile code.
3. **Admin CSV import** as a fallback that is always available, and legally the cleanest option.

Start with xe.gr: Firecrawl scrapes the xe.gr jobs results page, pulls the real listing links, then scrapes each listing. It runs **once a day** (more often increases cost with little benefit for job ads).

## 2. Data model changes (extend `job_postings`, no new table for jobs)

Add to `job_postings`:
- `source` text — `'gohire'` (internal) or `'xe.gr'`, `'kariera.gr'`, `'skywalker.gr'`, `'csv'`
- `source_job_id` text — the site's own listing ID, taken from the URL
- `posted_at` timestamptz — the date the site published the listing
- `last_seen_at` timestamptz — the last time our fetch found the listing
- `expires_at` timestamptz, nullable
- `content_hash` text — used to spot edits
- Unique index on `(source, source_job_id)`, with a fallback unique index on `external_url`

New `job_import_runs` table (admin-only): source, started/finished, found/inserted/updated/expired counts, error text. The admin Jobs page shows it.

The rule stays the same: external jobs have `employer_id = null` plus an `external_url` that opens the original listing in a new tab.

## 3. Deduplication and refresh

- **Upsert** on `(source, source_job_id)`. If the ID can't be read, clean the URL (remove query strings and tracking codes) and upsert on that.
- On every run, set `last_seen_at = now()` for each listing found, and update the text only when `content_hash` has changed.
- **Expiry**: at the end of each successful run for a source, deactivate that source's jobs with `last_seen_at` older than 3 days or with a past `expires_at`. This only happens when the run succeeded, so a failed fetch never wipes out listings.
- **Cross-site duplicates** (the same job posted on two sites): a soft match on normalized title, company and location within 14 days. The newer copy is hidden, not deleted.
- The Jobs page and the Student Dashboard already filter on `is_active`, so no extra work is needed there.

## 4. Legal / terms of service

- The terms of xe.gr and kariera.gr generally ban automated extraction and reuse of their content without permission. Job ads can also be protected under the EU database right (Directive 96/9/EC). Descriptions may contain personal data (recruiter names and emails), which falls under GDPR.
- Ways to lower the risk if we fetch:
  - Store only title, company, location, date and a short snippet (about 300 characters).
  - Always link back to the original listing. Never copy full descriptions or logos.
  - Respect robots.txt, identify our bot honestly, limit request rate, and run once a day.
  - Remove a listing quickly on request.
- **Safer alternatives**: (a) a written partner agreement or feed from the sites; (b) admin CSV import; (c) employers posting directly on GoHire (the existing in-app flow).
- This is not legal advice. Have a lawyer check it before going live commercially.

## Build steps (after approval)

1. Migration: new columns, indexes and `job_import_runs` with permission grants and access rules.
2. Rewrite `import-jobs`: per-source adapters (xe.gr first), upsert, expiry sweep, run logging, snippet-only descriptions.
3. Daily scheduled run (once per day, 06:00 UTC).
4. Admin Jobs page: "Run now" button, run history, CSV upload (columns: title, company, location, posted_date, url, description).
5. Show a "via xe.gr" source label on job cards.

## Open questions

- Do you want to email the sites for a partner feed first, or start with scraping xe.gr now?
- Is a paid scraping service acceptable (about $1–2 per 1,000 listings), or should we use Firecrawl only?
