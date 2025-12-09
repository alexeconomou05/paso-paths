import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl p-4 md:p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.
              </p>
              <Link 
                to="/privacy" 
                className="text-sm text-primary hover:underline"
              >
                Read our Privacy Policy
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={declineCookies}
              className="flex-1 md:flex-none"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={acceptCookies}
              className="flex-1 md:flex-none"
            >
              Accept
            </Button>
          </div>
          <button
            onClick={declineCookies}
            className="absolute top-2 right-2 md:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
