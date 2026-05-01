import { useState } from "react";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

interface PremiumBannerProps {
  /** Hide the banner entirely (e.g. user is already premium). */
  hidden?: boolean;
  /** Optional storage key so dismissal persists per-context. */
  storageKey?: string;
}

const PremiumBanner = ({ hidden, storageKey = "premiumBannerDismissed" }: PremiumBannerProps) => {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(storageKey) === "true"
  );
  const [open, setOpen] = useState(false);

  if (hidden || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(storageKey, "true");
    setDismissed(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left relative rounded-xl border-2 border-foreground/20 bg-gradient-to-r from-primary via-pink-400 to-orange-400 p-3 sm:p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] transition-all"
      >
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm sm:text-base leading-tight">
              Unlock Premium — €1.99/month
            </p>
            <p className="text-white/90 text-xs sm:text-sm leading-tight truncate">
              See applicant counts, get priority matches & more ✨
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="hidden sm:inline-flex bg-white text-primary hover:bg-white/90"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            Upgrade
          </Button>
        </div>
        <span
          role="button"
          aria-label="Dismiss banner"
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </span>
      </button>
      <PremiumUpgradeModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default PremiumBanner;