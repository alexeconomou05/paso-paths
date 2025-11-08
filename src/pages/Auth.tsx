import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Upload } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pasoFile, setPasoFile] = useState<File | null>(null);
  
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    fullName: "",
    university: "",
    fieldOfStudy: "",
    pasoNumber: ""
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!signupData.email || !signupData.password || !signupData.fullName) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!pasoFile) {
        toast.error("Please upload your PASO document");
        return;
      }

      // Sign up user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signupData.fullName
          }
        }
      });

      if (signupError) throw signupError;
      if (!authData.user) throw new Error("No user data returned");

      // Upload PASO document
      const fileExt = pasoFile.name.split('.').pop();
      const filePath = `${authData.user.id}/paso.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('paso-documents')
        .upload(filePath, pasoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('paso-documents')
        .getPublicUrl(filePath);

      // Update profile with additional info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          university: signupData.university,
          field_of_study: signupData.fieldOfStudy,
          paso_number: signupData.pasoNumber,
          paso_document_url: publicUrl
        })
        .eq('id', authData.user.id);

      if (updateError) throw updateError;

      toast.success("Account created! Awaiting verification. You can log in once approved.");
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Student Career Platform</CardTitle>
          <CardDescription>Sign in or create your verified student account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@university.gr"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name *</Label>
                  <Input
                    id="signup-name"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">University Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@university.gr"
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    placeholder="e.g., National and Kapodistrian University of Athens"
                    value={signupData.university}
                    onChange={(e) => setSignupData({...signupData, university: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Input
                    id="field"
                    placeholder="e.g., Computer Science"
                    value={signupData.fieldOfStudy}
                    onChange={(e) => setSignupData({...signupData, fieldOfStudy: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paso">PASO Number</Label>
                  <Input
                    id="paso"
                    placeholder="Your student ID number"
                    value={signupData.pasoNumber}
                    onChange={(e) => setSignupData({...signupData, pasoNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paso-file">PASO Document * (PDF or Image)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="paso-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setPasoFile(e.target.files?.[0] || null)}
                      required
                      className="flex-1"
                    />
                    {pasoFile && (
                      <Upload className="w-5 h-5 text-success" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your student ID for verification. This will be reviewed by our team.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;