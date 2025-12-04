import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendOtpRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await supabase
      .from("email_otps")
      .delete()
      .eq("email", email);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("email_otps")
      .insert({
        email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting OTP:", insertError);
      throw new Error("Failed to generate OTP");
    }

    // Send email via Gmail SMTP
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .logo { text-align: center; margin-bottom: 30px; font-size: 28px; font-weight: bold; color: #0891b2; }
          .code { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; font-size: 32px; letter-spacing: 8px; padding: 20px 40px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .message { color: #666; font-size: 16px; line-height: 1.6; text-align: center; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎓 GoHire</div>
          <p class="message">Here's your verification code to access your account:</p>
          <div class="code">${otpCode}</div>
          <p class="message">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
          <p class="footer">© GoHire - Connecting Students with Opportunities</p>
        </div>
      </body>
      </html>
    `;

    await client.send({
      from: "GoHire <gohire.info@gmail.com>",
      to: email,
      subject: "Your GoHire Verification Code",
      html: htmlContent,
    });

    await client.close();

    console.log(`OTP sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
