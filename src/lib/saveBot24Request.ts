import { supabase } from "@/lib/supabaseClient";

export async function saveBot24Request(data: {
  pair: string;
  timeframe: string;
  capital: number;
  risk_percent: number;
  trader_level?: string;
}) {

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) return null;

  const { data: result } = await supabase
    .from("bot24_requests")
    .insert({
      user_id: user.id,
      pair: data.pair,
      timeframe: data.timeframe,
      capital: data.capital,
      risk_percent: data.risk_percent,
      trader_level: data.trader_level || "beginner"
    })
    .select()
    .single();

  return result;

}