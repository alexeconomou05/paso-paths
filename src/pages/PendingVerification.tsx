import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Clock, LogOut, ShieldCheck } from "lucide-react";

const PendingVerification = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"student" | "employer">("student");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: employer } = await supabase
        .from("employers")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employer) {
        setUserType("employer");
        if (employer.verification_status === "approved") {
          navigate("/employer-dashboard");
          return;
        }
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", user.id)
          .single();

        if (profile?.verification_status === "approved") {
          navigate("/student-dashboard");
          return;
        }
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">Account Under Review</CardTitle>
          <CardDescription className="text-base mt-2">
            {userType === "student"
              ? "Your PASO document is being reviewed by our admin team. You'll get access once your student status is verified."
              : "Your company account is being reviewed by our admin team. You'll get access once your company is verified."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>This usually takes 1-2 business days</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingVerification;
