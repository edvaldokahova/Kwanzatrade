// src/lib/bot24QuantEngine.ts
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
  // 1️⃣ Puxar histórico das últimas 24h
  // Removido o <Bot24HistoryItem> do .from() e adicionado o .returns<>() ao final
  const { data: history, error } = await supabase  
    .from("bot24_history")  
    .select("*")  
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())  
    .order("created_at", { ascending: false })
    .returns<Bot24HistoryItem[]>(); // Isso resolve o erro de tipagem de forma limpa
  
  if (error || !history) {  
    console.error("Erro ao buscar histórico:", error);  
    return;  
  }  
  
  // Limpar rankings antigos  
  await supabase.from("bot24_quant").delete().neq("id", ""); 
  
  // 2️⃣ Top 10 trades do dia (marketScore + confiança)  
  const top10 = [...history]  
    .sort((a, b) => (b.marketScore + b.confidence) - (a.marketScore + a.confidence))  
    .slice(0, 10);  
  
  // 3️⃣ Top 5 high probability  
  const highProb = history  
    .filter(h => h.probability >= 80)  
    .sort((a, b) => b.probability - a.probability)  
    .slice(0, 5);  
  
  // 4️⃣ Top Volatility  
  const topVolatility = [...history]  
    .sort((a, b) => b.volatility - a.volatility)  
    .slice(0, 5);  
  
  // 5️⃣ Top Momentum  
  const topMomentum = [...history]  
    .sort((a, b) => b.momentum - a.momentum)  
    .slice(0, 5);  
  
  // Inserir rankings no banco  
  const insertData = history.map(h => ({  
    history_id: h.id,  
    top10: top10.some(t => t.id === h.id),  
    high_probability: highProb.some(t => t.id === h.id),  
    top_volatility: topVolatility.some(t => t.id === h.id),  
    top_momentum: topMomentum.some(t => t.id === h.id)  
  }));  
  
  if (insertData.length > 0) {
    const { error: insertError } = await supabase  
      .from("bot24_quant")  
      .insert(insertData);  
    
    if (insertError) console.error("Erro ao inserir rankings:", insertError);  
  }
  
  return { top10, highProb, topVolatility, topMomentum };  
}