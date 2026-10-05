import { createClient } from "@supabase/supabase-js";

export type WheelPrize = {
  id: string;
  name: string;
  probability: number;
  color: string;
  gradientId: string;
  icon: string;
  labelLine1: string;
  labelLine2: string;
};

export const defaultPrizes: WheelPrize[] = [
  {
    id: "1",
    name: "₹500 Cashback",
    probability: 30,
    color: "#EF4D3F",
    gradientId: "grad-coral",
    icon: "coins",
    labelLine1: "₹500",
    labelLine2: "CASHBACK",
  },
  {
    id: "2",
    name: "₹1000 Cashback",
    probability: 10,
    color: "#3767D6",
    gradientId: "grad-blue",
    icon: "rupee",
    labelLine1: "₹1000",
    labelLine2: "CASHBACK",
  },
  {
    id: "3",
    name: "Food Coupon",
    probability: 20,
    color: "#F8C84B",
    gradientId: "grad-yellow",
    icon: "food",
    labelLine1: "FOOD",
    labelLine2: "COUPON",
  },
  {
    id: "4",
    name: "Tumbler",
    probability: 15,
    color: "#2A9D8F",
    gradientId: "grad-teal",
    icon: "tumbler",
    labelLine1: "TUMBLER",
    labelLine2: "",
  },
  {
    id: "5",
    name: "Better Luck Next Time",
    probability: 25,
    color: "#F58A3B",
    gradientId: "grad-orange",
    icon: "star",
    labelLine1: "BETTER LUCK",
    labelLine2: "NEXT TIME",
  },
];

let localPrizes: WheelPrize[] = [...defaultPrizes];

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getPrizes(): Promise<WheelPrize[]> {
  const supabase = getSupabaseAdmin();

  // Local fallback keeps development working before Supabase is configured.
  if (!supabase) return localPrizes;

  const { data, error } = await supabase
    .from("wheel_config")
    .select("prizes")
    .eq("id", "main")
    .maybeSingle();

  if (error) {
    console.error("Failed to load wheel configuration:", error.message);
    return localPrizes;
  }

  if (!data?.prizes || !Array.isArray(data.prizes)) {
    return localPrizes;
  }

  localPrizes = data.prizes as WheelPrize[];
  return localPrizes;
}

export async function setPrizes(newPrizes: WheelPrize[]): Promise<WheelPrize[]> {
  const normalized = newPrizes.map((p) => ({
    ...p,
    probability: Number(p.probability) || 0,
  }));

  localPrizes = normalized;

  const supabase = getSupabaseAdmin();
  if (!supabase) return localPrizes;

  const { error } = await supabase
    .from("wheel_config")
    .upsert(
      {
        id: "main",
        prizes: normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("Failed to save wheel configuration:", error.message);
    throw new Error("Could not save the wheel. Check the database configuration.");
  }

  return normalized;
}
