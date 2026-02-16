import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { Upload, Mail, KeyRound, ArrowLeft, Loader2, Lock, Building2, Users, Eye, EyeOff } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Textarea } from "@/components/ui/textarea";

type AuthStep = 'credentials' | 'otp-verification' | 'forgot-password' | 'reset-otp' | 'new-password';
type UserRole = 'employee' | 'employer';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pasoFile, setPasoFile] = useState<File | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>('employee');
  
  // Get role from URL params on mount
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'employer' || roleParam === 'employee') {
      setUserRole(roleParam);
    }
  }, [searchParams]);

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    fullName: "",
    university: "",
    fieldOfStudy: "",
    pasoNumber: ""
  });

  const [employerSignupData, setEmployerSignupData] = useState({
    email: "",
    password: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    companyWebsite: "",
    companyDescription: ""
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      
      // Check if user is employer and redirect accordingly
      const { data: employer } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', pendingUserId)
        .maybeSingle();
      
      if (employer) {
        navigate('/employer-dashboard');
      } else {
        navigate('/student-dashboard');
      }
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!forgotEmail) {
        toast.error("Please enter your email");
        return;
      }

      await sendOTP(forgotEmail);
      setPendingEmail(forgotEmail);
      setAuthStep('reset-otp');
      toast.success("Verification code sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    // Don't verify OTP here - just move to password step
    // OTP will be verified in reset-password function
    setAuthStep('new-password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { 
          email: pendingEmail, 
          otp: otpCode,
          newPassword 
        }
      });

      if (error) {
        console.error("Reset password error:", error);
        throw new Error(error.message || "Failed to reset password");
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Password updated! Please log in.");
      setAuthStep('credentials');
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setForgotEmail("");
    } catch (error: any) {
      console.error("Reset password catch:", error);
      toast.error(error.message || "Failed to reset password");
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

      const fileExt = pasoFile.name.split('.').pop();
      const filePath = `${authData.user.id}/paso.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('paso-documents')
        .upload(filePath, pasoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('paso-documents')
        .getPublicUrl(filePath);

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

  const handleEmployerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!employerSignupData.email || !employerSignupData.password || !employerSignupData.companyName) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: employerSignupData.email,
        password: employerSignupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: employerSignupData.contactPerson || employerSignupData.companyName,
            is_employer: true
          }
        }
      });

      if (signupError) throw signupError;
      if (!authData.user) throw new Error("No user data returned");

      // Create employer profile
      const { error: employerError } = await supabase
        .from('employers')
        .insert({
          user_id: authData.user.id,
          company_name: employerSignupData.companyName,
          company_email: employerSignupData.email,
          contact_person: employerSignupData.contactPerson,
          phone: employerSignupData.phone,
          company_website: employerSignupData.companyWebsite,
          company_description: employerSignupData.companyDescription
        });

      if (employerError) throw employerError;

      await sendOTP(employerSignupData.email);

      setPendingEmail(employerSignupData.email);
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
      // Developer backdoor - skip authentication for testing
      if (loginData.email === 'DEVELOPER' && loginData.password === 'DEVELOPER') {
        localStorage.setItem('developerMode', 'true');
        toast.success("Developer mode activated!");
        navigate('/student-dashboard');
        setLoading(false);
        return;
      }

      // Clear developer mode if logging in normally
      localStorage.removeItem('developerMode');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', data.user.id)
        .single();

      if (!profile?.email_verified) {
        await sendOTP(loginData.email);
        setPendingEmail(loginData.email);
        setPendingUserId(data.user.id);
        setAuthStep('otp-verification');
        toast.info("Please verify your email to continue");
      } else {
        // Check if user is employer and redirect accordingly
        const { data: employer } = await supabase
          .from('employers')
          .select('id, verification_status')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        toast.success("Welcome back!");
        if (employer) {
          if (employer.verification_status !== 'approved') {
            navigate('/pending-verification');
          } else {
            navigate('/employer-dashboard');
          }
        } else {
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('verification_status')
            .eq('id', data.user.id)
            .single();
          
          if (studentProfile?.verification_status !== 'approved') {
            navigate('/pending-verification');
          } else {
            navigate('/student-dashboard');
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setAuthStep('credentials');
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Forgot Password - Enter Email
  if (authStep === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card animate-slide-up">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a verification code
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your.email@university.gr"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Code
                  </>
                )}
              </Button>

              <Button variant="ghost" className="w-full" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset OTP Verification
  if (authStep === 'reset-otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card animate-slide-up">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Enter Verification Code</CardTitle>
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
              onClick={handleVerifyResetOTP} 
              className="w-full" 
              disabled={otpCode.length !== 6}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Continue
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={async () => {
                  setLoading(true);
                  try {
                    await sendOTP(pendingEmail);
                    toast.success("New code sent!");
                  } catch {
                    toast.error("Failed to resend");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Resend Code
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New Password Form
  if (authStep === 'new-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card animate-slide-up">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Create a strong password for your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>

              <Button variant="ghost" className="w-full" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification Screen (for signup/login)
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
              <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resendOTP}
                disabled={loading}
              >
                Resend Code
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={goBack}>
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
          <CardDescription>
            {userRole === 'employee' 
              ? 'Sign in or create your verified student account' 
              : 'Sign in or register your company'}
          </CardDescription>
          
          {/* Role Toggle */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant={userRole === 'employee' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserRole('employee')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Employee
            </Button>
            <Button
              variant={userRole === 'employer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserRole('employer')}
              className="gap-2"
            >
              <Building2 className="w-4 h-4" />
              Employer
            </Button>
          </div>
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
                    type="text"
                    placeholder={userRole === 'employee' ? "your.email@university.gr" : "company@example.com"}
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
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
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-sm"
                  onClick={() => setAuthStep('forgot-password')}
                >
                  Forgot your password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {userRole === 'employee' ? (
                // Employee Signup Form
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
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
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
              ) : (
                // Employer Signup Form
                <form onSubmit={handleEmployerSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      placeholder="Your company name"
                      value={employerSignupData.companyName}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, companyName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer-email">Company Email *</Label>
                    <Input
                      id="employer-email"
                      type="email"
                      placeholder="hr@company.com"
                      value={employerSignupData.email}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer-password">Password *</Label>
                    <Input
                      id="employer-password"
                      type="password"
                      value={employerSignupData.password}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-person">Contact Person</Label>
                    <Input
                      id="contact-person"
                      placeholder="Full name of the contact person"
                      value={employerSignupData.contactPerson}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, contactPerson: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+30 210 1234567"
                      value={employerSignupData.phone}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-website">Company Website</Label>
                    <Input
                      id="company-website"
                      type="url"
                      placeholder="https://www.company.com"
                      value={employerSignupData.companyWebsite}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, companyWebsite: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-description">Company Description</Label>
                    <Textarea
                      id="company-description"
                      placeholder="Tell us about your company..."
                      value={employerSignupData.companyDescription}
                      onChange={(e) => setEmployerSignupData({...employerSignupData, companyDescription: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Register Company"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your company account will be reviewed by our team before activation.
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
