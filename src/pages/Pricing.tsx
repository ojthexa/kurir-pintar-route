import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface PricingConfig {
  id: string;
  min_distance: number;
  max_distance: number | null;
  base_price: number;
  price_per_km: number;
  is_active: boolean;
}

const Pricing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadConfigs();
    }
  }, [user]);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("*")
        .order("min_distance", { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error("Error loading configs:", error);
      toast.error("Gagal memuat konfigurasi harga");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pricing_config")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Konfigurasi dihapus");
      loadConfigs();
    } catch (error) {
      console.error("Error deleting config:", error);
      toast.error("Gagal menghapus konfigurasi");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from("pricing_config")
        .insert({
          user_id: user?.id,
          min_distance: Number(formData.get("min_distance")),
          max_distance: formData.get("max_distance") ? Number(formData.get("max_distance")) : null,
          base_price: Number(formData.get("base_price")),
          price_per_km: Number(formData.get("price_per_km")),
          is_active: true,
        });

      if (error) throw error;
      toast.success("Konfigurasi harga ditambahkan");
      loadConfigs();
      e.currentTarget.reset();
    } catch (error) {
      console.error("Error adding config:", error);
      toast.error("Gagal menambahkan konfigurasi");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Kelola Tarif
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Tambah Konfigurasi Harga</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Atur harga berdasarkan jarak tempuh
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <form onSubmit={handleSubmit} className="grid gap-3 md:gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_distance" className="text-xs md:text-sm">Jarak Min (km)</Label>
                  <Input
                    id="min_distance"
                    name="min_distance"
                    type="number"
                    step="0.1"
                    required
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_distance" className="text-xs md:text-sm">Jarak Max (km) - Opsional</Label>
                  <Input
                    id="max_distance"
                    name="max_distance"
                    type="number"
                    step="0.1"
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_price" className="text-xs md:text-sm">Harga Dasar (Rp)</Label>
                  <Input
                    id="base_price"
                    name="base_price"
                    type="number"
                    required
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_km" className="text-xs md:text-sm">Harga per Km (Rp)</Label>
                  <Input
                    id="price_per_km"
                    name="price_per_km"
                    type="number"
                    required
                    className="text-sm md:text-base"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full md:w-auto" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Konfigurasi
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3 md:space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-sm text-muted-foreground">Memuat...</p>
              </CardContent>
            </Card>
          ) : configs.length === 0 ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-sm text-muted-foreground">Belum ada konfigurasi harga</p>
              </CardContent>
            </Card>
          ) : (
            configs.map((config) => (
              <Card key={config.id}>
                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs md:text-sm font-medium">
                      {config.min_distance} km - {config.max_distance ? `${config.max_distance} km` : "∞"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Dasar: Rp {config.base_price.toLocaleString()} + Rp {config.price_per_km.toLocaleString()}/km
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Hapus</span>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
