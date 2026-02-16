import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "student" | "employer";
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if user is an employer
        const { data: employer } = await supabase
          .from("employers")
          .select("id, verification_status")
          .eq("user_id", user.id)
          .maybeSingle();

        const isEmployer = !!employer;

        // Role mismatch check
        if (allowedRole === "student" && isEmployer) {
          toast.error("This area is for students only. Redirecting to your employer dashboard.");
          navigate("/employer-dashboard");
          return;
        }

        if (allowedRole === "employer" && !isEmployer) {
          toast.error("This area is for employers only. Redirecting to your student dashboard.");
          navigate("/student-dashboard");
          return;
        }

        // Verification check
        if (isEmployer) {
          if (employer.verification_status !== "approved") {
            navigate("/pending-verification");
            return;
          }
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("verification_status")
            .eq("id", user.id)
            .single();

          if (profile?.verification_status !== "approved") {
            navigate("/pending-verification");
            return;
          }
        }

        setAuthorized(true);
      } catch {
        navigate("/auth");
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [navigate, allowedRole]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

export default ProtectedRoute;
