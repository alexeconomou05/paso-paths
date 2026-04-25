import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Service role for writes
    const admin = createClient(supabaseUrl, serviceKey);

    const today = todayUtc();
    const thisMonth = monthKey(today);

    // Fetch profile
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select(
        "id, current_streak_day, last_checkin_date, monthly_strikes_used, strikes_month, total_points",
      )
      .eq("id", userId)
      .single();

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already checked in today?
    if (profile.last_checkin_date === today) {
      return new Response(
        JSON.stringify({
          alreadyCheckedIn: true,
          currentStreakDay: profile.current_streak_day,
          totalPoints: profile.total_points,
          monthlyStrikesUsed: profile.monthly_strikes_used,
          strikesMonth: profile.strikes_month,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Reset monthly strikes counter if month changed
    let strikesUsed = profile.monthly_strikes_used ?? 0;
    let strikesMonth = profile.strikes_month;
    if (strikesMonth !== thisMonth) {
      strikesUsed = 0;
      strikesMonth = thisMonth;
    }

    // Determine next streak day
    let nextStreakDay = 1;
    let strikeUsedNow = false;

    if (profile.last_checkin_date) {
      const gap = daysBetween(profile.last_checkin_date, today);
      if (gap === 1) {
        // consecutive
        nextStreakDay = (profile.current_streak_day % 7) + 1;
      } else if (gap === 2 && strikesUsed < 1) {
        // missed exactly one day, allowed strike
        nextStreakDay = (profile.current_streak_day % 7) + 1;
        strikeUsedNow = true;
      } else {
        // streak broken
        nextStreakDay = 1;
      }
    }

    // Fetch prize for that day
    const { data: prize } = await admin
      .from("daily_prizes")
      .select("name, description, points")
      .eq("day_number", nextStreakDay)
      .maybeSingle();

    const prizeName = prize?.name ?? `Day ${nextStreakDay}`;
    const points = prize?.points ?? 0;

    // Insert checkin
    const { error: insertErr } = await admin.from("daily_checkins").insert({
      user_id: userId,
      checkin_date: today,
      day_number: nextStreakDay,
      prize_name: prizeName,
      points_awarded: points,
    });
    if (insertErr) {
      // unique violation = race; treat as already-checked
      if ((insertErr as any).code === "23505") {
        return new Response(JSON.stringify({ alreadyCheckedIn: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertErr;
    }

    const newStrikesUsed = strikesUsed + (strikeUsedNow ? 1 : 0);
    const newTotalPoints = (profile.total_points ?? 0) + points;

    const { error: updErr } = await admin
      .from("profiles")
      .update({
        current_streak_day: nextStreakDay,
        last_checkin_date: today,
        monthly_strikes_used: newStrikesUsed,
        strikes_month: strikesMonth,
        total_points: newTotalPoints,
      })
      .eq("id", userId);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({
        success: true,
        currentStreakDay: nextStreakDay,
        prize: { name: prizeName, description: prize?.description ?? "", points },
        totalPoints: newTotalPoints,
        monthlyStrikesUsed: newStrikesUsed,
        strikesMonth,
        strikeUsedNow,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("daily-checkin error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});