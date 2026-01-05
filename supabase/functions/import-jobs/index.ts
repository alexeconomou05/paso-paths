import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobListing {
  job_title: string;
  job_description: string;
  employer_name: string;
  employer_email: string;
  employment_type: 'full_time' | 'part_time' | 'internship' | 'contract';
  location?: string;
  salary_range?: string;
  requirements?: string;
  external_url: string;
  source: string;
}

const EMPLOYMENT_TYPE_MAP: Record<string, 'full_time' | 'part_time' | 'internship' | 'contract'> = {
  'πλήρης': 'full_time',
  'full time': 'full_time',
  'full-time': 'full_time',
  'μερική': 'part_time',
  'part time': 'part_time',
  'part-time': 'part_time',
  'πρακτική': 'internship',
  'internship': 'internship',
  'stage': 'internship',
  'σύμβαση': 'contract',
  'contract': 'contract',
  'ορισμένου': 'contract',
};

function detectEmploymentType(text: string): 'full_time' | 'part_time' | 'internship' | 'contract' {
  const lowerText = text.toLowerCase();
  for (const [keyword, type] of Object.entries(EMPLOYMENT_TYPE_MAP)) {
    if (lowerText.includes(keyword)) {
      return type;
    }
  }
  return 'full_time'; // default
}

async function scrapeXeGr(apiKey: string, searchQuery: string): Promise<JobListing[]> {
  console.log('Scraping xe.gr for:', searchQuery);
  
  const searchUrl = `https://www.xe.gr/εργασία/θέσεις-εργασίας?free_text=${encodeURIComponent(searchQuery)}`;
  
  try {
    // First, search for job listings
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!searchResponse.ok) {
      console.error('xe.gr search failed:', await searchResponse.text());
      return [];
    }

    const searchData = await searchResponse.json();
    const links: string[] = searchData.data?.links || [];
    
    // Filter for job detail pages
    const jobLinks = links
      .filter((link: string) => link.includes('/θέση-εργασίας/') || link.includes('θέσεις-εργασίας'))
      .filter((link: string) => link.includes('-') && link.length > 80) // Job detail URLs are longer
      .slice(0, 5); // Limit to 5 jobs per query

    console.log('Found job links:', jobLinks.length);

    const jobs: JobListing[] = [];

    // Scrape each job detail page
    for (const jobUrl of jobLinks) {
      try {
        const jobResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: jobUrl,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (!jobResponse.ok) continue;

        const jobData = await jobResponse.json();
        const markdown = jobData.data?.markdown || '';
        const metadata = jobData.data?.metadata || {};

        // Extract job details from markdown
        const titleMatch = markdown.match(/^#\s*(.+)/m) || metadata.title?.match(/(.+?)\s*[-|]/);
        const title = titleMatch ? titleMatch[1].trim() : metadata.title?.split('-')[0]?.trim() || 'Unknown Position';

        // Extract company name (usually after title or in metadata)
        const companyMatch = markdown.match(/(?:εταιρ[ιί]α|company|employer)[\s:]+([^\n]+)/i) ||
                           metadata.title?.match(/[-–]\s*(.+?)(?:\s*[-–]|$)/);
        const company = companyMatch ? companyMatch[1].trim() : 'Company from xe.gr';

        // Extract location
        const locationMatch = markdown.match(/(?:περιοχή|τοποθεσία|location|area)[\s:]+([^\n]+)/i) ||
                             markdown.match(/(?:Αθήνα|Θεσσαλονίκη|Πειραιάς|Athens|Thessaloniki)[^,\n]*/i);
        const location = locationMatch ? locationMatch[0].trim() : 'Greece';

        jobs.push({
          job_title: title.substring(0, 200),
          job_description: markdown.substring(0, 2000),
          employer_name: company.substring(0, 100),
          employer_email: 'jobs@xe.gr', // Placeholder since actual email isn't public
          employment_type: detectEmploymentType(markdown),
          location: location.substring(0, 100),
          external_url: jobUrl,
          source: 'xe.gr',
        });

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('Error scraping job:', jobUrl, err);
      }
    }

    return jobs;
  } catch (error) {
    console.error('Error scraping xe.gr:', error);
    return [];
  }
}

async function scrapeKariera(apiKey: string, searchQuery: string): Promise<JobListing[]> {
  console.log('Scraping kariera.gr for:', searchQuery);
  
  const searchUrl = `https://www.kariera.gr/el/jobs?q=${encodeURIComponent(searchQuery)}`;
  
  try {
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!searchResponse.ok) {
      console.error('kariera.gr search failed:', await searchResponse.text());
      return [];
    }

    const searchData = await searchResponse.json();
    const links: string[] = searchData.data?.links || [];
    
    // Filter for job detail pages on kariera.gr
    const jobLinks = links
      .filter((link: string) => link.includes('kariera.gr/el/jobs/') && link.includes('-'))
      .filter((link: string) => !link.includes('?'))
      .slice(0, 5);

    console.log('Found kariera job links:', jobLinks.length);

    const jobs: JobListing[] = [];

    for (const jobUrl of jobLinks) {
      try {
        const jobResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: jobUrl,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (!jobResponse.ok) continue;

        const jobData = await jobResponse.json();
        const markdown = jobData.data?.markdown || '';
        const metadata = jobData.data?.metadata || {};

        const titleMatch = markdown.match(/^#\s*(.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : metadata.title?.split('|')[0]?.trim() || 'Unknown Position';

        const companyMatch = markdown.match(/(?:εταιρ[ιί]α|company|about)[\s:]+([^\n]+)/i);
        const company = companyMatch ? companyMatch[1].trim() : 'Company from kariera.gr';

        const locationMatch = markdown.match(/(?:τοποθεσία|location)[\s:]+([^\n]+)/i);
        const location = locationMatch ? locationMatch[1].trim() : 'Greece';

        jobs.push({
          job_title: title.substring(0, 200),
          job_description: markdown.substring(0, 2000),
          employer_name: company.substring(0, 100),
          employer_email: 'jobs@kariera.gr',
          employment_type: detectEmploymentType(markdown),
          location: location.substring(0, 100),
          external_url: jobUrl,
          source: 'kariera.gr',
        });

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('Error scraping kariera job:', jobUrl, err);
      }
    }

    return jobs;
  } catch (error) {
    console.error('Error scraping kariera.gr:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { searchQueries, sources = ['xe.gr', 'kariera.gr'] } = await req.json();

    if (!searchQueries || !Array.isArray(searchQueries) || searchQueries.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'searchQueries array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting job import for queries:', searchQueries);
    console.log('Sources:', sources);

    const allJobs: JobListing[] = [];

    for (const query of searchQueries) {
      if (sources.includes('xe.gr')) {
        const xeJobs = await scrapeXeGr(FIRECRAWL_API_KEY, query);
        allJobs.push(...xeJobs);
      }
      
      if (sources.includes('kariera.gr')) {
        const karieraJobs = await scrapeKariera(FIRECRAWL_API_KEY, query);
        allJobs.push(...karieraJobs);
      }

      // Delay between different queries
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('Total jobs scraped:', allJobs.length);

    // Insert jobs into database
    const insertedJobs = [];
    const errors = [];

    for (const job of allJobs) {
      // Check if job with same URL already exists
      const { data: existing } = await supabase
        .from('job_postings')
        .select('id')
        .eq('external_url', job.external_url)
        .maybeSingle();

      if (existing) {
        console.log('Job already exists:', job.external_url);
        continue;
      }

      const { data, error } = await supabase
        .from('job_postings')
        .insert({
          job_title: job.job_title,
          job_description: job.job_description,
          employer_name: job.employer_name,
          employer_email: job.employer_email,
          employment_type: job.employment_type,
          location: job.location,
          external_url: job.external_url,
          employer_id: null, // External jobs don't have an employer_id
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting job:', error);
        errors.push({ job: job.job_title, error: error.message });
      } else {
        insertedJobs.push(data);
      }
    }

    console.log('Jobs inserted:', insertedJobs.length);
    console.log('Errors:', errors.length);

    return new Response(
      JSON.stringify({
        success: true,
        scraped: allJobs.length,
        inserted: insertedJobs.length,
        errors: errors.length,
        errorDetails: errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import jobs error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
