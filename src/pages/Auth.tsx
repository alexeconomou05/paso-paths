import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { Upload, Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthStep = 'credentials' | 'otp-verification';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pasoFile, setPasoFile] = useState<File | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  
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

  const sendOTP = async (email: string) => {
    const { error } = await supabase.functions.invoke('send-otp', {
      body: { email }
    });
    
    if (error) throw error;
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          email: pendingEmail, 
          otp: otpCode,
          userId: pendingUserId 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Email verified! Redirecting...");
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      await sendOTP(pendingEmail);
      toast.success("New verification code sent!");
    } catch (error: any) {
      toast.error("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      // Send OTP for email verification
      await sendOTP(signupData.email);

      setPendingEmail(signupData.email);
      setPendingUserId(authData.user.id);
      setAuthStep('otp-verification');
      toast.success("Account created! Please verify your email.");
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;

      // Check if email is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', data.user.id)
        .single();

      if (!profile?.email_verified) {
        // Send OTP for verification
        await sendOTP(loginData.email);
        setPendingEmail(loginData.email);
        setPendingUserId(data.user.id);
        setAuthStep('otp-verification');
        toast.info("Please verify your email to continue");
      } else {
        toast.success("Welcome back!");
        navigate('/profile');
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Screen
  if (authStep === 'otp-verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card animate-slide-up">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to<br />
              <span className="font-semibold text-foreground">{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={verifyOTP} 
              className="w-full" 
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resendOTP}
                disabled={loading}
              >
                Resend Code
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setAuthStep('credentials');
                setOtpCode("");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card animate-slide-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo size="md" />
          </div>
          <CardTitle className="text-2xl">Welcome to GoHire</CardTitle>
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
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
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
                      <Upload className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your student ID for verification. This will be reviewed by our team.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
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
