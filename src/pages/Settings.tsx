import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, languageLabels, Language } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Globe, Moon, Sun, FileText, Bug, LogOut, UserX, Trash2, Bell } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [bugReport, setBugReport] = useState('');
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobNotifications, setJobNotifications] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('job_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (data) {
        setJobNotifications(data.job_notifications_enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ job_notifications_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setJobNotifications(enabled);
      toast.success(enabled ? 'Job notifications enabled' : 'Job notifications disabled');
    } catch (error) {
      toast.error('Failed to update notification preference');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('loggedOutSuccess'));
    navigate('/');
  };

  const handleSubmitBugReport = async () => {
    if (!bugReport.trim()) {
      toast.error(t('bugReportError'));
      return;
    }
    
    setIsSubmittingBug(true);
    try {
      toast.success(t('bugReportSuccess'));
      setBugReport('');
    } catch (error) {
      toast.error('Failed to submit bug report');
    } finally {
      setIsSubmittingBug(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' as const })
        .eq('id', user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      toast.success(t('accountDeactivated'));
      navigate('/');
    } catch (error) {
      toast.error('Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      await supabase.auth.signOut();
      toast.success(t('accountDeleted'));
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-8">{t('settings')}</h1>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('preferences')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="language">{t('language')}</Label>
              </div>
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languageLabels).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <Label htmlFor="theme">{t('darkMode')}</Label>
              </div>
              <Switch
                id="theme"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            <Separator />

            {/* Job Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="notifications">Job Notifications</Label>
                  <p className="text-xs text-muted-foreground">Get emails when new jobs match your profile</p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={jobNotifications}
                onCheckedChange={handleToggleNotifications}
                disabled={loadingNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('legal')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/terms')}
            >
              <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
              {t('termsAndConditions')}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/privacy')}
            >
              <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
              {t('privacyPolicy')}
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('support')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Bug className="mr-3 h-5 w-5 text-muted-foreground" />
                  {t('reportBug')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('reportBugTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('reportBugDescription')}
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder={t('describeBug')}
                  value={bugReport}
                  onChange={(e) => setBugReport(e.target.value)}
                  rows={5}
                />
                <DialogFooter>
                  <Button
                    onClick={handleSubmitBugReport}
                    disabled={isSubmittingBug}
                  >
                    {isSubmittingBug ? t('submitting') : t('submitReport')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('account')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5 text-muted-foreground" />
              {t('logout')}
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-warning hover:text-warning"
                >
                  <UserX className="mr-3 h-5 w-5" />
                  {t('deactivateAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deactivateTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deactivateDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivateAccount}
                    disabled={isDeactivating}
                    className="bg-warning hover:bg-warning/90"
                  >
                    {isDeactivating ? t('deactivating') : t('deactivate')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-3 h-5 w-5" />
                  {t('deleteAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? t('deleting') : t('deleteForever')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
