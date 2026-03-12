import { supabase } from "./supabaseClient"; // Mudado de @/ para ./ para evitar erro de resolução

export async function saveBot24Request(data: {
  pair: string;
  timeframe: string;
  capital: number;
  risk_percent: number;
  trader_level?: string;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return null;

    const { data: result, error } = await supabase
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

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Erro ao salvar request:", error);
    return null;
  }
}
