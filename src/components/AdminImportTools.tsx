import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { History, Upload, RefreshCw } from "lucide-react";

type Run = {
  id: string; source: string; trigger: string; status: string; started_at: string;
  found: number; inserted: number; updated: number; expired: number; error: string | null;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const AdminImportTools = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadRuns = async () => {
    const { data } = await supabase
      .from("job_import_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);
    setRuns((data as Run[]) || []);
  };

  useEffect(() => { loadRuns(); }, []);

  const handleCsv = async (file: File) => {
    setUploading(true);
    try {
      const rows = parseCsv(await file.text());
      const header = rows.shift()?.map((h) => h.trim().toLowerCase()) || [];
      const idx = (k: string) => header.indexOf(k);
      if (idx("title") < 0 || idx("url") < 0) throw new Error("CSV needs at least 'title' and 'url' columns");

      let inserted = 0, skipped = 0;
      for (const r of rows) {
        const get = (k: string) => (idx(k) >= 0 ? (r[idx(k)] || "").trim() : "");
        const url = get("url"), title = get("title");
        if (!url || !title) { skipped++; continue; }
        try { new URL(url); } catch { skipped++; continue; }

        const { data: existing } = await supabase.from("job_postings").select("id").eq("external_url", url).maybeSingle();
        if (existing) { skipped++; continue; }

        const posted = get("posted_date") ? new Date(get("posted_date")) : null;
        const { error } = await supabase.from("job_postings").insert({
          job_title: title.slice(0, 200),
          employer_name: (get("company") || "Unknown company").slice(0, 100),
          employer_email: "jobs@gohire.csv",
          location: get("location").slice(0, 100) || null,
          job_description: get("description").slice(0, 300) || "See the full listing at the source.",
          employment_type: "full_time",
          external_url: url,
          employer_id: null,
          is_active: true,
          source: "csv",
          source_job_id: url,
          posted_at: posted && !isNaN(posted.getTime()) ? posted.toISOString() : null,
          last_seen_at: new Date().toISOString(),
        });
        if (error) skipped++; else inserted++;
      }
      toast.success(`Imported ${inserted} jobs, skipped ${skipped}`);
    } catch (e: any) {
      toast.error(e.message || "CSV import failed");
    } finally {
      setUploading(false);
    }
  };

  const statusVariant = (s: string) => (s === "failed" ? "destructive" : s === "success" ? "default" : "secondary");

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> CSV import</CardTitle>
          <CardDescription>
            Columns: title, company, location, posted_date, url, description. Rows with a link that already exists are skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".csv,text/csv"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsv(f); e.target.value = ""; }}
          />
          {uploading && <p className="text-sm text-muted-foreground mt-2">Importing…</p>}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Import history</CardTitle>
            <CardDescription>The automatic import runs daily at 06:00 UTC.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadRuns}><RefreshCw className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {runs.length === 0 && <p className="text-sm text-muted-foreground">No imports yet.</p>}
          {runs.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{r.source}</Badge>
                <Badge variant={statusVariant(r.status) as any}>{r.status}</Badge>
                <span className="text-muted-foreground">{r.trigger} · {new Date(r.started_at).toLocaleString()}</span>
              </div>
              <p className="mt-1">Found {r.found} · New {r.inserted} · Updated {r.updated} · Expired {r.expired}</p>
              {r.error && <p className="mt-1 text-destructive text-xs break-all">{r.error}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImportTools;
