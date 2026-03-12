import { supabase } from "./supabaseClient";

type Bot24HistoryItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  momentum: number;
  volatility: number;
  probability: number;
  marketScore: number;
  created_at: string;
};

export async function runQuantEngine() {
  const { data: history, error } = await supabase  
    .from("bot24_history")  
    .select("*")  
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())  
    .order("created_at", { ascending: false })
    .returns<Bot24HistoryItem[]>();
  
  if (error || !history || history.length === 0) return null;

  // Limpar rankings antigos de forma segura
  await supabase.from("bot24_quant").delete().filter("id", "neq", "00000000-0000-0000-0000-000000000000"); 
  
  const top10 = [...history].sort((a, b) => (b.marketScore + b.confidence) - (a.marketScore + a.confidence)).slice(0, 10);  
  const highProb = history.filter(h => h.probability >= 80).sort((a, b) => b.probability - a.probability).slice(0, 5);  
  
  const insertData = history.map(h => ({  
    history_id: h.id,  
    top10: top10.some(t => t.id === h.id),  
    high_probability: highProb.some(t => t.id === h.id),  
    top_volatility: false, // Simplificado para evitar erros de nulo
    top_momentum: false  
  }));  
  
  if (insertData.length > 0) {
    await supabase.from("bot24_quant").insert(insertData);
  }
  
  return { top10, highProb };  
}
