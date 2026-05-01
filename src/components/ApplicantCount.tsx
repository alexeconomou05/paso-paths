import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Lock, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

interface ApplicantCountProps {
  jobId: string;
  isPremium: boolean;
}

const ApplicantCount = ({ jobId, isPremium }: ApplicantCountProps) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_job_applicant_count", { _job_id: jobId });
      if (!cancelled) {
        if (!error && typeof data === "number") setCount(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, isPremium]);

  if (!isPremium) {
    return (
      <>
        <Card className="border-2 border-dashed border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-pink-400 to-orange-400 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">See how many people applied</p>
              <p className="text-xs text-muted-foreground">Premium members get applicant insights</p>
            </div>
            <Button size="sm" onClick={() => setShowUpgrade(true)} className="flex-shrink-0">
              <Crown className="w-4 h-4" />
              Upgrade
            </Button>
          </CardContent>
        </Card>
        <PremiumUpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
      </>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-pink-400/10">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">
            {loading ? "Loading…" : `${count ?? 0} ${count === 1 ? "person has" : "people have"} applied`}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Crown className="w-3 h-3" /> Premium insight
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicantCount;