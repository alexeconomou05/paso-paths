import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Gift } from "lucide-react";
import Logo from "@/components/Logo";

interface Prize {
  id: string;
  day_number: number;
  name: string;
  description: string | null;
  points: number;
}

const AdminPrizes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  useEffect(() => {
    void init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }
    setAuthorized(true);
    await loadPrizes();
    setLoading(false);
  };

  const loadPrizes = async () => {
    const { data, error } = await supabase
      .from("daily_prizes")
      .select("*")
      .order("day_number");
    if (error) {
      toast.error("Failed to load prizes");
      return;
    }
    // Ensure all 7 days exist locally for editing
    const map = new Map<number, Prize>();
    (data ?? []).forEach((p: any) => map.set(p.day_number, p));
    const full: Prize[] = Array.from({ length: 7 }, (_, i) => {
      const d = i + 1;
      return (
        map.get(d) ?? {
          id: "",
          day_number: d,
          name: `Day ${d} Prize`,
          description: "",
          points: 0,
        }
      );
    });
    setPrizes(full);
  };

  const updateLocal = (day: number, patch: Partial<Prize>) => {
    setPrizes((prev) =>
      prev.map((p) => (p.day_number === day ? { ...p, ...patch } : p)),
    );
  };

  const savePrize = async (day: number) => {
    const prize = prizes.find((p) => p.day_number === day);
    if (!prize) return;
    if (!prize.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingDay(day);
    try {
      if (prize.id) {
        const { error } = await supabase
          .from("daily_prizes")
          .update({
            name: prize.name,
            description: prize.description,
            points: prize.points,
          })
          .eq("id", prize.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("daily_prizes")
          .insert({
            day_number: day,
            name: prize.name,
            description: prize.description,
            points: prize.points,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) updateLocal(day, { id: data.id });
      }
      toast.success(`Day ${day} prize saved`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSavingDay(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="glass border-b border-glass-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <Logo className="text-3xl" />
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-text)' }}>
            Daily Check-In Prizes
          </h1>
          <p className="text-muted-foreground">
            Configure the 7-day prize cycle. Changes apply to all students immediately.
          </p>
        </div>

        <div className="space-y-4">
          {prizes.map((prize) => (
            <Card key={prize.day_number} className="glass-card p-6 border-l-4 border-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold">
                  {prize.day_number}
                </div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Gift className="w-5 h-5 text-accent" /> Day {prize.day_number}
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${prize.day_number}`}>Prize name *</Label>
                  <Input
                    id={`name-${prize.day_number}`}
                    value={prize.name}
                    onChange={(e) => updateLocal(prize.day_number, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`points-${prize.day_number}`}>Points</Label>
                  <Input
                    id={`points-${prize.day_number}`}
                    type="number"
                    min={0}
                    value={prize.points}
                    onChange={(e) =>
                      updateLocal(prize.day_number, {
                        points: parseInt(e.target.value || "0", 10),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor={`desc-${prize.day_number}`}>Description</Label>
                <Textarea
                  id={`desc-${prize.day_number}`}
                  value={prize.description ?? ""}
                  onChange={(e) =>
                    updateLocal(prize.day_number, { description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => savePrize(prize.day_number)}
                  disabled={savingDay === prize.day_number}
                  className="bg-cta hover:bg-cta/90 text-cta-foreground"
                >
                  {savingDay === prize.day_number ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Day {prize.day_number}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminPrizes;