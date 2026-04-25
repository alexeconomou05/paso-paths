import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Gift, Loader2, Check, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Prize {
  day_number: number;
  name: string;
  description: string | null;
  points: number;
}

interface ProfileStreak {
  current_streak_day: number;
  last_checkin_date: string | null;
  monthly_strikes_used: number;
  strikes_month: string | null;
  total_points: number;
}

const todayUtc = () => new Date().toISOString().slice(0, 10);
const monthKey = (d: string) => d.slice(0, 7);

export default function DailyCheckIn({ userId }: { userId: string }) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [profile, setProfile] = useState<ProfileStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const [prizesRes, profileRes] = await Promise.all([
      supabase.from("daily_prizes").select("*").order("day_number"),
      supabase
        .from("profiles")
        .select(
          "current_streak_day, last_checkin_date, monthly_strikes_used, strikes_month, total_points",
        )
        .eq("id", userId)
        .single(),
    ]);
    if (prizesRes.data) setPrizes(prizesRes.data as Prize[]);
    if (profileRes.data) setProfile(profileRes.data as ProfileStreak);
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-checkin");
      if (error) throw error;
      if (data?.alreadyCheckedIn) {
        toast.info("You've already checked in today!");
      } else if (data?.success) {
        toast.success(
          `🎉 +${data.prize.points} pts — ${data.prize.name}${
            data.strikeUsedNow ? " (strike used)" : ""
          }`,
        );
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
      </Card>
    );
  }

  const today = todayUtc();
  const alreadyToday = profile?.last_checkin_date === today;
  const currentDay = profile?.current_streak_day ?? 0;

  // What day will the next check-in be?
  const nextDay = alreadyToday
    ? currentDay
    : currentDay === 0
    ? 1
    : (currentDay % 7) + 1;

  const strikesThisMonth =
    profile?.strikes_month === monthKey(today)
      ? profile?.monthly_strikes_used ?? 0
      : 0;
  const strikesRemaining = Math.max(0, 1 - strikesThisMonth);

  return (
    <Card className="glass-card p-6 border-l-4 border-accent">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Daily Check-In
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Earn a prize every day — 7-day cycle.{" "}
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />1 strike/month allowed
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-text)' }}>
            {profile?.total_points ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">total points</p>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const prize = prizes.find((p) => p.day_number === day);
          const isClaimed = day <= currentDay && currentDay > 0;
          const isNext = !alreadyToday && day === nextDay;
          return (
            <div
              key={day}
              className={`relative rounded-xl p-2 text-center text-xs border transition-all ${
                isClaimed
                  ? "bg-gradient-to-br from-primary/30 to-accent/30 border-primary"
                  : isNext
                  ? "border-accent ring-2 ring-accent/50 animate-pulse"
                  : "border-border bg-muted/30 opacity-60"
              }`}
              title={prize?.description ?? ""}
            >
              <p className="font-bold">D{day}</p>
              <Gift className="w-4 h-4 mx-auto my-1 opacity-80" />
              <p className="font-semibold truncate">{prize?.points ?? 0}p</p>
              {isClaimed && (
                <Check className="w-3 h-3 absolute top-1 right-1 text-primary" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Strikes left this month: <span className="font-bold">{strikesRemaining}</span>
        </p>
        <Button
          onClick={handleCheckIn}
          disabled={alreadyToday || submitting}
          className="bg-cta hover:bg-cta/90 text-cta-foreground font-semibold"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : alreadyToday ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {alreadyToday ? "Checked in today" : `Claim Day ${nextDay}`}
        </Button>
      </div>
    </Card>
  );
}