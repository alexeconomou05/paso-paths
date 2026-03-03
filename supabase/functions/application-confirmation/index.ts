import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  studentEmail: string;
  studentName: string;
  jobTitle: string;
  employerName: string;
  employerEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, jobTitle, employerName, employerEmail }: ApplicationEmailRequest = await req.json();

    if (!studentEmail || !jobTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: "gohire.info@gmail.com",
          password: Deno.env.get("GMAIL_APP_PASSWORD")!,
        },
      },
    });

    // Send confirmation to student
    const firstName = studentName?.split(" ")[0] || "there";

    await client.send({
      from: "GoHire <gohire.info@gmail.com>",
      to: studentEmail,
      subject: `Application Submitted – ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Application Confirmed ✓</h2>
          <p>Hi ${firstName},</p>
          <p>Your application for <strong>${jobTitle}</strong> at <strong>${employerName}</strong> has been successfully submitted.</p>
          <p>The employer will review your profile and CV. If they're interested, they'll reach out to you directly.</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #666; font-size: 14px;">Good luck! 🍀<br/>The GoHire Team</p>
        </div>
      `,
    });

    // Send notification to employer
    if (employerEmail) {
      await client.send({
        from: "GoHire <gohire.info@gmail.com>",
        to: employerEmail,
        subject: `New Application for ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">New Application Received 📩</h2>
            <p>Hello,</p>
            <p>A new candidate has applied for your job posting <strong>${jobTitle}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Applicant</td>
                <td style="padding: 8px 0; font-weight: bold;">${studentName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${studentEmail}" style="color: #2563eb;">${studentEmail}</a></td>
              </tr>
            </table>
            <p>Log in to your GoHire employer dashboard to review their full profile and CV.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #666; font-size: 14px;">The GoHire Team</p>
          </div>
        `,
      });
    }

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending application confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
