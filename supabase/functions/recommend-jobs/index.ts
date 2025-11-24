import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, viewType } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('field_of_study, career_interests, bio')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch jobs" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the AI prompt based on view type
    const focusArea = viewType === 'studies' 
      ? `field of study: ${profile.field_of_study || 'Not specified'}`
      : `career interests and dream role: ${profile.career_interests || profile.bio || 'Not specified'}`;

    const systemPrompt = `You are a career counselor helping students find the best job matches. 
Analyze the student's profile and rank the provided jobs from most to least relevant based on their ${viewType === 'studies' ? 'academic background' : 'career aspirations'}.

Return a JSON array of job IDs ordered by relevance (most relevant first). Include ALL job IDs.
Format: ["job-id-1", "job-id-2", "job-id-3", ...]`;

    const userPrompt = `Student Profile:
${focusArea}
Bio/Skills: ${profile.bio || 'Not provided'}

Available Jobs:
${jobs.map(job => `
ID: ${job.id}
Title: ${job.job_title}
Company: ${job.employer_name}
Type: ${job.employment_type}
Description: ${job.job_description}
Requirements: ${job.requirements || 'None specified'}
Location: ${job.location || 'Not specified'}
---`).join('\n')}

Rank these jobs by relevance for this student's ${viewType === 'studies' ? 'field of study' : 'career goals'}.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_jobs",
            description: "Return job IDs ranked by relevance",
            parameters: {
              type: "object",
              properties: {
                ranked_job_ids: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of job IDs ordered by relevance (most relevant first)"
                }
              },
              required: ["ranked_job_ids"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "rank_jobs" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate recommendations" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    // Extract ranked job IDs from tool call
    let rankedJobIds: string[] = [];
    
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const toolArgs = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
      rankedJobIds = toolArgs.ranked_job_ids || [];
    }

    // If AI didn't provide rankings, return jobs in original order
    if (rankedJobIds.length === 0) {
      rankedJobIds = jobs.map(j => j.id);
    }

    // Sort jobs according to AI ranking
    const rankedJobs = rankedJobIds
      .map(id => jobs.find(j => j.id === id))
      .filter(Boolean);

    // Add any jobs that weren't ranked (shouldn't happen, but safety net)
    const unrankedJobs = jobs.filter(j => !rankedJobIds.includes(j.id));
    const finalRecommendations = [...rankedJobs, ...unrankedJobs];

    return new Response(
      JSON.stringify({ recommendations: finalRecommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recommend-jobs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
