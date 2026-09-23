import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Source = "xe.gr" | "kariera.gr" | "skywalker.gr";
type EmploymentType = "internship" | "part_time" | "full_time" | "graduate_program";

const SOURCES: Record<Source, { listUrl: (q?: string) => string; host: string }> = {
  "xe.gr": {
    host: "xe.gr",
    listUrl: (q) => q ? `https://www.xe.gr/jobs/results?keyword=${encodeURIComponent(q)}` : "https://www.xe.gr/jobs/results",
  },
  "kariera.gr": {
    host: "kariera.gr",
    listUrl: (q) => q ? `https://www.kariera.gr/jobs?keyword=${encodeURIComponent(q)}` : "https://www.kariera.gr/jobs",
  },
  "skywalker.gr": {
    host: "skywalker.gr",
    listUrl: (q) => q ? `https://www.skywalker.gr/elGR/aggelies-ergasias?keywords=${encodeURIComponent(q)}` : "https://www.skywalker.gr/elGR/aggelies-ergasias",
  },
};

const SNIPPET_LEN = 300;
const EXPIRE_AFTER_DAYS = 3;
const MIN_HOURS_BETWEEN_UNAUTH_RUNS = 20;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function detectEmploymentType(text: string): EmploymentType {
  const t = text.toLowerCase();
  if (/(πρακτική|internship|intern\b|stage)/.test(t)) return "internship";
  if (/(μερική|part[\s-]?time)/.test(t)) return "part_time";
  if (/(graduate|νέοι απόφοιτοι|απόφοιτ)/.test(t)) return "graduate_program";
  return "full_time";
}

function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function extractSourceId(url: string): string {
  const m = url.match(/(\d{5,})(?!.*\d{5,})/);
  return m ? m[1] : url;
}

async function sha1(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normKey(s: string | null | undefined) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9α-ω]+/g, " ").trim();
}

function parseDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  const m = s.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) {
    const d2 = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return null;
}

// Firecrawl: supports both direct (fc-) keys and gateway (lovc_) keys.
async function firecrawlScrape(body: Record<string, unknown>) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY is not configured");
  const gateway = key.startsWith("lovc_");
  const url = gateway ? "https://connector-gateway.lovable.dev/firecrawl/v2/scrape" : "https://api.firecrawl.dev/v2/scrape";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (gateway) {
    const lov = Deno.env.get("LOVABLE_API_KEY");
    if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
    headers["Authorization"] = `Bearer ${lov}`;
    headers["X-Connection-Api-Key"] = key;
  } else {
    headers["Authorization"] = `Bearer ${key}`;
  }
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Firecrawl [${res.status}]: ${text.slice(0, 500)}`);
  const data = JSON.parse(text);
  return data.data ?? data;
}

interface RawListing {
  title?: string;
  company?: string;
  location?: string;
  posted_date?: string;
  url?: string;
  summary?: string;
}

async function fetchListings(source: Source, query?: string): Promise<RawListing[]> {
  const cfg = SOURCES[source];
  const result = await firecrawlScrape({
    url: cfg.listUrl(query),
    onlyMainContent: true,
    waitFor: 2000,
    location: { country: "GR", languages: ["el", "en"] },
    formats: [{
      type: "json",
      prompt:
        "Extract every individual job listing shown on this results page. For each: title, company, location, posted_date (as shown), url (absolute link to the individual listing detail page, not a search page), summary (one short sentence).",
      schema: {
        type: "object",
        properties: {
          jobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                company: { type: "string" },
                location: { type: "string" },
                posted_date: { type: "string" },
                url: { type: "string" },
                summary: { type: "string" },
              },
              required: ["title", "url"],
            },
          },
        },
        required: ["jobs"],
      },
    }],
  });
  const jobs: RawListing[] = result?.json?.jobs ?? [];
  return jobs.filter((j) => j.url && j.title && j.url.includes(cfg.host) && !/[?&](q|keyword|keywords)=/.test(j.url));
}

async function runSource(supabase: ReturnType<typeof createClient>, source: Source, queries: string[], trigger: string) {
  const { data: run } = await supabase.from("job_import_runs").insert({ source, trigger }).select("id").single();
  const stats = { found: 0, inserted: 0, updated: 0, expired: 0 };
  const runStarted = new Date().toISOString();
  try {
    const seen = new Map<string, RawListing & { url: string }>();
    for (const q of queries.length ? queries : [undefined as unknown as string]) {
      const list = await fetchListings(source, q);
      for (const l of list) {
        const u = normalizeUrl(l.url!);
        if (u) seen.set(u, { ...l, url: u });
      }
      await new Promise((r) => setTimeout(r, 1500)); // polite rate limit
    }
    stats.found = seen.size;

    for (const l of seen.values()) {
      const sourceJobId = extractSourceId(l.url);
      const snippet = (l.summary || "").slice(0, SNIPPET_LEN) || `See the full listing on ${source}.`;
      const hash = await sha1([l.title, l.company, l.location, snippet].join("|"));
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from("job_postings")
        .select("id, content_hash")
        .eq("source", source)
        .eq("source_job_id", sourceJobId)
        .maybeSingle();

      if (existing) {
        const patch: Record<string, unknown> = { last_seen_at: now, is_active: true };
        if (existing.content_hash !== hash) {
          Object.assign(patch, {
            job_title: l.title!.slice(0, 200),
            employer_name: (l.company || source).slice(0, 100),
            location: l.location?.slice(0, 100) || null,
            job_description: snippet,
            content_hash: hash,
          });
          stats.updated++;
        }
        await supabase.from("job_postings").update(patch).eq("id", existing.id);
        continue;
      }

      // Cross-site duplicate check: same title+company active in the last 14 days from another source
      const since = new Date(Date.now() - 14 * 864e5).toISOString();
      const { data: candidates } = await supabase
        .from("job_postings")
        .select("job_title, employer_name")
        .neq("source", source)
        .eq("is_active", true)
        .gte("created_at", since)
        .ilike("job_title", l.title!.slice(0, 200));
      const isDup = (candidates || []).some((c) => normKey(c.employer_name) === normKey(l.company));

      const { error } = await supabase.from("job_postings").insert({
        job_title: l.title!.slice(0, 200),
        job_description: snippet,
        employer_name: (l.company || source).slice(0, 100),
        employer_email: `jobs@${source}`,
        employment_type: detectEmploymentType(`${l.title} ${l.summary ?? ""}`),
        location: l.location?.slice(0, 100) || null,
        external_url: l.url,
        employer_id: null,
        is_active: !isDup,
        source,
        source_job_id: sourceJobId,
        posted_at: parseDate(l.posted_date),
        last_seen_at: now,
        content_hash: hash,
      });
      if (error) console.error("insert error", error.message);
      else stats.inserted++;
    }

    // Expiry sweep — only after a successful fetch that found listings
    if (stats.found > 0) {
      const cutoff = new Date(Date.now() - EXPIRE_AFTER_DAYS * 864e5).toISOString();
      const { data: expiredRows } = await supabase
        .from("job_postings")
        .update({ is_active: false })
        .eq("source", source)
        .eq("is_active", true)
        .or(`last_seen_at.lt.${cutoff},expires_at.lt.${runStarted}`)
        .select("id");
      stats.expired = expiredRows?.length ?? 0;
    }

    await supabase.from("job_import_runs").update({
      ...stats,
      status: stats.found > 0 ? "success" : "empty",
      finished_at: new Date().toISOString(),
    }).eq("id", run!.id);
    return { source, ...stats, status: stats.found > 0 ? "success" : "empty" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${source}]`, msg);
    await supabase.from("job_import_runs").update({
      ...stats, status: "failed", error: msg.slice(0, 1000), finished_at: new Date().toISOString(),
    }).eq("id", run!.id);
    return { source, ...stats, status: "failed", error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));

    const allowed: Source[] = ["xe.gr", "kariera.gr", "skywalker.gr"];
    const sources: Source[] = Array.isArray(body.sources)
      ? body.sources.filter((s: string): s is Source => allowed.includes(s as Source))
      : ["xe.gr"];
    const queries: string[] = Array.isArray(body.searchQueries)
      ? body.searchQueries.filter((q: unknown) => typeof q === "string" && q.length > 0 && q.length < 80).slice(0, 10)
      : [];
    if (sources.length === 0) return json({ success: false, error: "No valid sources" }, 400);

    // Admins may run anytime; otherwise (scheduled run) at most once per ~day.
    let isAdmin = false;
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        const { data: role } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
        isAdmin = !!role;
      }
    }
    if (!isAdmin) {
      const since = new Date(Date.now() - MIN_HOURS_BETWEEN_UNAUTH_RUNS * 3600e3).toISOString();
      const { count } = await supabase
        .from("job_import_runs")
        .select("id", { count: "exact", head: true })
        .eq("trigger", "scheduled")
        .gte("started_at", since);
      if ((count ?? 0) > 0) return json({ success: false, error: "Scheduled import already ran recently" }, 429);
    }

    const trigger = isAdmin ? "manual" : "scheduled";
    const results = [];
    for (const s of sources) results.push(await runSource(supabase, s, queries, trigger));

    const totals = results.reduce((a, r) => ({
      scraped: a.scraped + r.found, inserted: a.inserted + r.inserted, updated: a.updated + r.updated,
      expired: a.expired + r.expired, errors: a.errors + (r.status === "failed" ? 1 : 0),
    }), { scraped: 0, inserted: 0, updated: 0, expired: 0, errors: 0 });

    return json({ success: true, ...totals, results });
  } catch (e) {
    console.error("import-jobs error", e);
    return json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
