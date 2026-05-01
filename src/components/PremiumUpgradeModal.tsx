import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Eye, Sparkles, BadgeCheck, Ban, Check } from "lucide-react";
import { toast } from "sonner";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const perks = [
  { icon: Eye, label: "See how many people applied to each GoHire job" },
  { icon: Sparkles, label: "Priority job recommendations" },
  { icon: BadgeCheck, label: "Premium badge on your profile" },
  { icon: Ban, label: "Ad-free experience" },
];

const PremiumUpgradeModal = ({ open, onOpenChange }: PremiumUpgradeModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Placeholder — payments not wired yet
    setTimeout(() => {
      setLoading(false);
      toast.info("Payments coming soon! We'll notify you when premium goes live.");
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary via-pink-400 to-orange-400 flex items-center justify-center mb-2 shadow-lg">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">Go Premium</DialogTitle>
          <DialogDescription className="text-center">
            Unlock everything for just{" "}
            <span className="font-bold text-foreground">€1.99/month</span>
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 my-4">
          {perks.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.label} className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{p.label}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          size="lg"
          className="w-full bg-gradient-to-r from-primary via-pink-500 to-orange-400 text-white border-foreground/20"
        >
          <Crown className="w-4 h-4" />
          {loading ? "Processing..." : "Upgrade for €1.99/month"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. Billed monthly.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;