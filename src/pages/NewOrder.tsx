import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface Destination {
  address: string;
  contact_name: string;
  contact_phone: string;
  notes: string;
}

const NewOrder = () => {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState("direct");
  const [customerId, setCustomerId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([
    { address: "", contact_name: "", contact_phone: "", notes: "" }
  ]);
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
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const addDestination = () => {
    if (destinations.length < 10) {
      setDestinations([...destinations, { address: "", contact_name: "", contact_phone: "", notes: "" }]);
    } else {
      toast.error("Maksimal 10 tujuan");
    }
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  const updateDestination = (index: number, field: keyof Destination, value: string) => {
    const updated = [...destinations];
    updated[index][field] = value;
    setDestinations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupAddress.trim()) {
      toast.error("Alamat pickup harus diisi");
      return;
    }

    if (destinations.some(d => !d.address.trim())) {
      toast.error("Semua alamat tujuan harus diisi");
      return;
    }

    setLoading(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id,
          customer_id: customerId || null,
          order_number: orderNumber,
          pickup_address: pickupAddress,
          delivery_type: deliveryType,
          status: "pending",
          notes: orderNotes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create destinations
      const destinationsData = destinations.map((dest, index) => ({
        order_id: order.id,
        sequence_number: index + 1,
        address: dest.address,
        contact_name: dest.contact_name || null,
        contact_phone: dest.contact_phone || null,
        notes: dest.notes || null,
        delivery_status: "pending",
      }));

      const { error: destError } = await supabase
        .from("order_destinations")
        .insert(destinationsData);

      if (destError) throw destError;

      toast.success("Pesanan berhasil dibuat");
      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Gagal membuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/orders")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-2xl font-bold">Pesanan Baru</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Informasi Pickup</CardTitle>
              <CardDescription className="text-xs md:text-sm">Detail pengambilan barang</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress" className="text-xs md:text-sm">Alamat Pickup *</Label>
                <Textarea
                  id="pickupAddress"
                  placeholder="Masukkan alamat lengkap pickup"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                  className="text-sm md:text-base min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryType" className="text-xs md:text-sm">Jenis Pengiriman</Label>
                <Select value={deliveryType} onValueChange={setDeliveryType}>
                  <SelectTrigger className="text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Langsung</SelectItem>
                    <SelectItem value="relay">Estafet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer" className="text-xs md:text-sm">Pelanggan (Opsional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="text-sm md:text-base">
                    <SelectValue placeholder="Pilih pelanggan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderNotes" className="text-xs md:text-sm">Catatan Pesanan</Label>
                <Textarea
                  id="orderNotes"
                  placeholder="Catatan tambahan untuk pesanan ini"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-base md:text-lg">Tujuan Pengiriman</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Maksimal 10 tujuan ({destinations.length}/10)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDestination}
                  disabled={destinations.length >= 10}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Tambah</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4">
              {destinations.map((dest, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardHeader className="p-3 md:p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm md:text-base">Tujuan {index + 1}</CardTitle>
                      </div>
                      {destinations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDestination(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Alamat Tujuan *</Label>
                      <Textarea
                        placeholder="Masukkan alamat lengkap tujuan"
                        value={dest.address}
                        onChange={(e) => updateDestination(index, "address", e.target.value)}
                        required
                        className="text-sm md:text-base"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs md:text-sm">Nama Kontak</Label>
                        <Input
                          placeholder="Nama penerima"
                          value={dest.contact_name}
                          onChange={(e) => updateDestination(index, "contact_name", e.target.value)}
                          className="text-sm md:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs md:text-sm">No. Telepon</Label>
                        <Input
                          placeholder="08xx xxxx xxxx"
                          value={dest.contact_phone}
                          onChange={(e) => updateDestination(index, "contact_phone", e.target.value)}
                          className="text-sm md:text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Catatan Tujuan</Label>
                      <Textarea
                        placeholder="Catatan untuk tujuan ini"
                        value={dest.notes}
                        onChange={(e) => updateDestination(index, "notes", e.target.value)}
                        className="text-sm md:text-base"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/orders")}
              className="flex-1"
              size="sm"
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="flex-1" size="sm">
              {loading ? "Menyimpan..." : "Buat Pesanan"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewOrder;
