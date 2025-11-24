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
import { User, Upload, FileText, LogOut, Briefcase } from "lucide-react";
import Logo from "@/components/Logo";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let photoUrl = profile.photo_url;
      let cvUrl = profile.cv_url;

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${user.id}/photo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // Upload CV if selected
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const filePath = `${user.id}/cv.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filePath, cvFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(filePath);
        
        cvUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          university: profile.university,
          field_of_study: profile.field_of_study,
          graduation_year: profile.graduation_year,
          bio: profile.bio,
          career_interests: profile.career_interests,
          photo_url: photoUrl,
          cv_url: cvUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
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
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              <Briefcase className="mr-2 w-4 h-4" />
              Browse Jobs
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 w-4 h-4" />
              Logout
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
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Your Profile</CardTitle>
                  <Badge variant={profile?.verification_status === 'approved' ? 'default' : 'secondary'}>
                    {profile?.verification_status === 'approved' ? '✓ Verified' : '⏳ Pending Verification'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={profile?.university || ''}
                    onChange={(e) => setProfile({...profile, university: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Input
                    id="field"
                    value={profile?.field_of_study || ''}
                    onChange={(e) => setProfile({...profile, field_of_study: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Expected Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  placeholder="e.g., 2025"
                  value={profile?.graduation_year || ''}
                  onChange={(e) => setProfile({...profile, graduation_year: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio & Skills</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell employers about yourself and your technical skills..."
                  rows={3}
                  value={profile?.bio || ''}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careerInterests">Dream Role & Career Interests</Label>
                <Textarea
                  id="careerInterests"
                  placeholder="Describe your ideal job role, industry interests, and career aspirations (e.g., 'UX Designer at a tech startup', 'Data Scientist in healthcare')..."
                  rows={3}
                  value={profile?.career_interests || ''}
                  onChange={(e) => setProfile({...profile, career_interests: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  💡 This helps us recommend jobs that match your career goals
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Profile Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                {profile?.photo_url && !photoFile && (
                  <p className="text-sm text-muted-foreground">Current photo uploaded</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv">Upload CV (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cv"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {(cvFile || profile?.cv_url) && (
                    <FileText className="w-5 h-5 text-success" />
                  )}
                </div>
                {profile?.cv_url && !cvFile && (
                  <p className="text-sm text-muted-foreground">Current CV uploaded</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={updating}>
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;