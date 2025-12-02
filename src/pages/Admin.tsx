import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  ExternalLink,
  LogOut,
  Users
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  university: string | null;
  field_of_study: string | null;
  paso_number: string | null;
  paso_document_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | null;
  email_verified: boolean | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const hasAdminRole = roles?.some(r => r.role === 'admin');
      if (!hasAdminRole) {
        toast.error("Access denied. Admin privileges required.");
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchProfiles();
    } catch (error: any) {
      console.error("Admin check error:", error);
      toast.error("Failed to verify admin access");
      navigate('/');
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (profileId: string, status: 'approved' | 'rejected') => {
    setActionLoading(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: status })
        .eq('id', profileId);

      if (error) throw error;

      toast.success(`User ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchProfiles();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update verification status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const pendingProfiles = profiles.filter(p => p.verification_status === 'pending');
  const approvedProfiles = profiles.filter(p => p.verification_status === 'approved');
  const rejectedProfiles = profiles.filter(p => p.verification_status === 'rejected');

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ProfileCard = ({ profile }: { profile: Profile }) => (
    <Card className="glass-card border-l-4 border-primary">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">University:</span>
                <p className="font-medium">{profile.university || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Field of Study:</span>
                <p className="font-medium">{profile.field_of_study || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">PASO Number:</span>
                <p className="font-medium">{profile.paso_number || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email Verified:</span>
                <Badge variant={profile.email_verified ? "default" : "secondary"}>
                  {profile.email_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {profile.paso_document_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(profile.paso_document_url!, '_blank')}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                View PASO Document
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>

          {profile.verification_status === 'pending' && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => updateVerificationStatus(profile.id, 'approved')}
                disabled={actionLoading === profile.id}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateVerificationStatus(profile.id, 'rejected')}
                disabled={actionLoading === profile.id}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <Badge variant="outline" className="gap-1">
              <Shield className="w-3 h-3" />
              Admin Panel
            </Badge>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Verification Management</h1>
          <p className="text-muted-foreground">Review and manage student account verifications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedProfiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingProfiles.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending verifications</p>
                </CardContent>
              </Card>
            ) : (
              pendingProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedProfiles.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved users yet</p>
                </CardContent>
              </Card>
            ) : (
              approvedProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedProfiles.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rejected users</p>
                </CardContent>
              </Card>
            ) : (
              rejectedProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
