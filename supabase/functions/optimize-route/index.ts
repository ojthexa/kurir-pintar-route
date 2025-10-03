import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destinations } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!destinations || !Array.isArray(destinations) || destinations.length < 2) {
      return new Response(
        JSON.stringify({ error: "Minimal 2 tujuan diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (destinations.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maksimal 10 tujuan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Optimizing route for destinations:", destinations);

    const systemPrompt = `Anda adalah asisten optimasi rute pengiriman. Tugas Anda adalah mengurutkan alamat tujuan berdasarkan jarak terdekat untuk membuat rute pengiriman yang paling efisien.

Pertimbangkan:
1. Urutan geografis yang logis
2. Minimalisasi jarak total perjalanan
3. Hindari rute yang bolak-balik

Berikan respons dalam format JSON dengan struktur:
{
  "optimizedRoute": ["alamat1", "alamat2", "alamat3", ...]
}`;

    const userPrompt = `Optimalkan urutan rute pengiriman untuk alamat-alamat berikut, urutkan dari yang terdekat satu sama lain:

${destinations.map((dest: string, idx: number) => `${idx + 1}. ${dest}`).join("\n")}

Berikan urutan yang paling efisien dalam format JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const aiResponse = data.choices[0].message.content;
    
    let optimizedRoute;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        optimizedRoute = parsed.optimizedRoute || parsed.route || destinations;
      } else {
        optimizedRoute = destinations;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response, using original order:", parseError);
      optimizedRoute = destinations;
    }

    return new Response(
      JSON.stringify({ optimizedRoute }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in optimize-route function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
