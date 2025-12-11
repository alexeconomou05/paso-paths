import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Upload, Globe, Phone, Mail, User, LayoutDashboard, Settings } from "lucide-react";
import Logo from "@/components/Logo";

const EmployerProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [employer, setEmployer] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        navigate('/student-dashboard');
        return;
      }

      if (error) throw error;
      setEmployer(data);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let logoUrl = employer.logo_url;

      // Upload logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${user.id}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        logoUrl = publicUrl;
      }

      // Update employer profile
      const { error } = await supabase
        .from('employers')
        .update({
          company_name: employer.company_name,
          contact_person: employer.contact_person,
          phone: employer.phone,
          company_website: employer.company_website,
          company_description: employer.company_description,
          logo_url: logoUrl
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Company profile updated successfully!");
      checkAuth();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="glass border-b border-glass-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <Logo className="text-3xl" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/employer-dashboard')}>
              <LayoutDashboard className="mr-2 w-4 h-4" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Company Profile</CardTitle>
                  <Badge variant={employer?.verification_status === 'approved' ? 'default' : 'secondary'}>
                    {employer?.verification_status === 'approved' ? '✓ Verified' : '⏳ Pending Verification'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Company Logo */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                  {employer?.logo_url ? (
                    <img src={employer.logo_url} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="logo">Company Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended: Square image, at least 200x200px</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={employer?.company_name || ''}
                    onChange={(e) => setEmployer({...employer, company_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Company Email
                  </Label>
                  <Input
                    id="email"
                    value={employer?.company_email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">
                    <User className="w-4 h-4 inline mr-1" />
                    Contact Person
                  </Label>
                  <Input
                    id="contactPerson"
                    value={employer?.contact_person || ''}
                    onChange={(e) => setEmployer({...employer, contact_person: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={employer?.phone || ''}
                    onChange={(e) => setEmployer({...employer, phone: e.target.value})}
                    placeholder="+30 210 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Company Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={employer?.company_website || ''}
                  onChange={(e) => setEmployer({...employer, company_website: e.target.value})}
                  placeholder="https://www.yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell students about your company, culture, and what makes you unique..."
                  rows={5}
                  value={employer?.company_description || ''}
                  onChange={(e) => setEmployer({...employer, company_description: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  This will be shown to students viewing your job postings
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={updating}>
                {updating ? "Updating..." : "Update Company Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmployerProfile;