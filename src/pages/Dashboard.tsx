import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Package, Users, TrendingUp, MapPin, LogOut, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalCustomers: 0,
    completedToday: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  });
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

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [ordersResult, customersResult] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact" }),
        supabase.from("customers").select("*", { count: "exact" }),
      ]);

      const activeOrders = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .in("status", ["pending", "picked_up", "in_transit"]);

      const today = new Date().toISOString().split("T")[0];
      const completedToday = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("status", "delivered")
        .gte("updated_at", today);

      const allOrders = await supabase
        .from("orders")
        .select("total_price");

      const todayOrders = await supabase
        .from("orders")
        .select("total_price")
        .gte("created_at", today);

      const totalRevenue = allOrders.data?.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0) || 0;
      const todayRevenue = todayOrders.data?.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0) || 0;

      setStats({
        totalOrders: ordersResult.count || 0,
        activeOrders: activeOrders.count || 0,
        totalCustomers: customersResult.count || 0,
        completedToday: completedToday.count || 0,
        todayRevenue,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              Kurir Pintar
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
            <LogOut className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Keluar</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-3 mb-4 md:mb-8">
          <Card 
            className="shadow-lg hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => navigate("/orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Pesanan Aktif</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-xl md:text-3xl font-bold text-accent">{stats.activeOrders}</div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => navigate("/orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Selesai Hari Ini</CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-xl md:text-3xl font-bold text-primary">{stats.completedToday}</div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => navigate("/orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Pesanan</CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-xl md:text-3xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => navigate("/customers")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Pelanggan</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-xl md:text-3xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Pendapatan Hari Ini</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold text-accent">
                Rp {stats.todayRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Pendapatan Total</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold text-primary">
                Rp {stats.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/orders")}>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Kelola Pesanan
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Tambah, lihat, dan update status pesanan</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Button className="w-full" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Buat Pesanan Baru
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/customers")}>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Database Pelanggan
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Kelola kontak pelanggan Anda</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Button className="w-full" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelanggan
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/route-optimizer")}>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                Optimasi Rute
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">AI untuk rute multi-tujuan terdekat</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Button className="w-full" variant="default" size="sm">
                Optimalkan Rute
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/pricing")}>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Kelola Tarif
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Atur tarif pengiriman berdasarkan jarak</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Button className="w-full" variant="outline" size="sm">
                Kelola Tarif
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
