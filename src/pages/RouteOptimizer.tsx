import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Navigation, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Destination {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

const RouteOptimizer = () => {
  const [user, setUser] = useState<User | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([{ id: "1", address: "" }]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const addDestination = () => {
    if (destinations.length >= 10) {
      toast.error("Maksimal 10 tujuan");
      return;
    }
    setDestinations([...destinations, { id: Date.now().toString(), address: "" }]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length === 1) {
      toast.error("Minimal 1 tujuan diperlukan");
      return;
    }
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  const updateDestination = (id: string, address: string) => {
    setDestinations(destinations.map((d) => (d.id === id ? { ...d, address } : d)));
  };

  const optimizeRoute = async () => {
    const validDestinations = destinations.filter((d) => d.address.trim());
    
    if (validDestinations.length < 2) {
      toast.error("Minimal 2 tujuan diperlukan untuk optimasi");
      return;
    }

    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-route", {
        body: { destinations: validDestinations.map((d) => d.address) },
      });

      if (error) throw error;

      setOptimizedRoute(data.optimizedRoute);
      toast.success("Rute berhasil dioptimalkan!");
    } catch (error: any) {
      console.error("Route optimization error:", error);
      toast.error(error.message || "Gagal mengoptimalkan rute");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <h1 className="text-base md:text-2xl font-bold">Optimasi Rute Multi-Tujuan</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Navigation className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Input Tujuan Pengiriman
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Masukkan hingga 10 alamat tujuan. AI akan mengoptimalkan urutan rute terdekat untuk Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {destinations.map((destination, index) => (
                <div key={destination.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <Label htmlFor={`destination-${destination.id}`} className="text-xs md:text-sm">
                      Tujuan {index + 1}
                    </Label>
                    <Input
                      id={`destination-${destination.id}`}
                      placeholder="Masukkan alamat tujuan"
                      value={destination.address}
                      onChange={(e) => updateDestination(destination.id, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  {destinations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDestination(destination.id)}
                      className="mt-6 md:mt-8 h-8 w-8 md:h-10 md:w-10 shrink-0"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={addDestination}
                disabled={destinations.length >= 10}
                className="flex-1"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-xs md:text-sm">Tambah Tujuan ({destinations.length}/10)</span>
              </Button>
              <Button
                onClick={optimizeRoute}
                disabled={optimizing || destinations.filter((d) => d.address.trim()).length < 2}
                className="flex-1"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-xs md:text-sm">{optimizing ? "Mengoptimalkan..." : "Optimalkan Rute"}</span>
              </Button>
            </div>

            {optimizedRoute.length > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Rute Optimal
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Urutan pengiriman yang paling efisien</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <ol className="space-y-2 md:space-y-3">
                    {optimizedRoute.map((destination, index) => (
                      <li key={index} className="flex items-start gap-2 md:gap-3">
                        <div className="flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs md:text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 pt-0.5 md:pt-1">
                          <p className="font-medium text-xs md:text-sm">{destination}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RouteOptimizer;
