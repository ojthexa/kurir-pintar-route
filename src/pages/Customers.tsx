import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Users, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

const Customers = () => {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
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
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      toast.error("Gagal memuat pelanggan");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const { error } = await supabase.from("customers").insert({
        user_id: user.id,
        ...newCustomer,
      });

      if (error) throw error;

      toast.success("Pelanggan berhasil ditambahkan");
      setDialogOpen(false);
      setNewCustomer({ name: "", phone: "", address: "", notes: "" });
      loadCustomers();
    } catch (error) {
      toast.error("Gagal menambahkan pelanggan");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold truncate">Database Pelanggan</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Tambah Pelanggan</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Input
                    id="notes"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm md:text-base text-muted-foreground">Memuat pelanggan...</p>
          </div>
        ) : customers.length === 0 ? (
          <Card className="text-center py-8 md:py-12">
            <CardContent className="space-y-4 p-4 md:p-6">
              <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-base md:text-lg font-semibold">Belum ada pelanggan</h3>
                <p className="text-sm md:text-base text-muted-foreground">Mulai dengan menambahkan pelanggan pertama</p>
              </div>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelanggan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">{customer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 md:space-y-3 p-4 md:p-6 pt-0">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs md:text-sm">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground line-clamp-2">{customer.address}</span>
                  </div>
                  {customer.notes && (
                    <p className="text-xs md:text-sm text-muted-foreground italic line-clamp-2">{customer.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Customers;
