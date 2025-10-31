import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Order {
  id: string;
  order_number: string;
  pickup_address: string;
  status: string;
  total_price: number;
  created_at: string;
  delivery_type: string;
}

const Orders = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error("Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Menunggu", icon: Clock, variant: "secondary" as const },
      picked_up: { label: "Diambil", icon: Package, variant: "default" as const },
      in_transit: { label: "Dalam Perjalanan", icon: Truck, variant: "default" as const },
      delivered: { label: "Terkirim", icon: CheckCircle, variant: "default" as const },
      cancelled: { label: "Dibatalkan", icon: XCircle, variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold truncate">Kelola Pesanan</h1>
          </div>
          <Button onClick={() => navigate("/orders/new")} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Pesanan Baru</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm md:text-base text-muted-foreground">Memuat pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-8 md:py-12">
            <CardContent className="space-y-4 p-4 md:p-6">
              <Package className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-base md:text-lg font-semibold">Belum ada pesanan</h3>
                <p className="text-sm md:text-base text-muted-foreground">Mulai dengan membuat pesanan pertama Anda</p>
              </div>
              <Button onClick={() => navigate("/orders/new")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Buat Pesanan Baru
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg truncate">{order.order_number}</CardTitle>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{order.pickup_address}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Jenis: {order.delivery_type === "direct" ? "Langsung" : "Estafet"}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    {order.total_price && (
                      <p className="text-lg md:text-xl font-bold text-primary">
                        Rp {order.total_price.toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
