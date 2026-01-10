import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Get jobs created in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: newJobs, error: jobsError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('is_active', true)
      .gte('created_at', oneDayAgo);

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw jobsError;
    }

    if (!newJobs || newJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new jobs to notify about", notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get students with notifications enabled
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, field_of_study, career_interests, job_notifications_enabled')
      .eq('job_notifications_enabled', true)
      .or('field_of_study.neq.null,career_interests.neq.null');

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      throw studentsError;
    }

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ message: "No students to notify", notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalNotified = 0;

    for (const student of students) {
      // Find matching jobs based on interests
      const matchingJobs = newJobs.filter(job => {
        const jobText = `${job.job_title} ${job.job_description} ${job.requirements || ''}`.toLowerCase();
        const studentInterests = `${student.field_of_study || ''} ${student.career_interests || ''}`.toLowerCase();
        
        // Simple keyword matching
        const keywords = studentInterests.split(/\s+/).filter(word => word.length > 3);
        return keywords.some(keyword => jobText.includes(keyword));
      });

      if (matchingJobs.length === 0) continue;

      // Check which jobs haven't been notified yet
      const { data: sentNotifications } = await supabase
        .from('job_notifications')
        .select('job_id')
        .eq('student_id', student.id)
        .in('job_id', matchingJobs.map(j => j.id));

      const sentJobIds = new Set(sentNotifications?.map(n => n.job_id) || []);
      const unnotifiedJobs = matchingJobs.filter(j => !sentJobIds.has(j.id));

      if (unnotifiedJobs.length === 0) continue;

      // Build email content
      const jobsList = unnotifiedJobs.slice(0, 5).map(job => `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${job.job_title}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">${job.employer_name}${job.location ? ` • ${job.location}` : ''}</p>
          <p style="margin: 0; color: #444; font-size: 14px;">${job.job_description.substring(0, 150)}...</p>
        </div>
      `).join('');

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">🎯 New Job Matches for You!</h1>
          <p style="color: #666;">Hi ${student.full_name || 'there'},</p>
          <p style="color: #666;">We found ${unnotifiedJobs.length} new job${unnotifiedJobs.length > 1 ? 's' : ''} matching your interests:</p>
          ${jobsList}
          ${unnotifiedJobs.length > 5 ? `<p style="color: #666;">...and ${unnotifiedJobs.length - 5} more!</p>` : ''}
          <a href="https://easrudmoidhnfrqchfwc.lovableproject.com/jobs" 
             style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View All Jobs
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            You're receiving this because you have job notifications enabled. 
            <a href="https://easrudmoidhnfrqchfwc.lovableproject.com/settings" style="color: #6366f1;">Manage preferences</a>
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: "GoHire <onboarding@resend.dev>",
          to: [student.email],
          subject: `🎯 ${unnotifiedJobs.length} New Job${unnotifiedJobs.length > 1 ? 's' : ''} Matching Your Profile`,
          html: emailHtml,
        });

        // Record sent notifications
        const notificationRecords = unnotifiedJobs.map(job => ({
          student_id: student.id,
          job_id: job.id,
        }));

        await supabase.from('job_notifications').insert(notificationRecords);
        totalNotified++;
        
        console.log(`Notified ${student.email} about ${unnotifiedJobs.length} jobs`);
      } catch (emailError) {
        console.error(`Failed to send email to ${student.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Notified ${totalNotified} students about new jobs`,
        notified: totalNotified,
        newJobsCount: newJobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-job-matches:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
