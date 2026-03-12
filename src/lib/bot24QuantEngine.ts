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
  try {
    // 1️⃣ Puxar histórico das últimas 24h
    const { data: history, error } = await supabase  
      .from("bot24_history")  
      .select("*")  
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())  
      .order("created_at", { ascending: false })
      .returns<Bot24HistoryItem[]>();
    
    // Se houver erro ou não houver dados, retornamos null em vez de deixar o código crashar
    if (error || !history || history.length === 0) {
      console.log("ℹ️ QuantEngine: Sem dados históricos para processar.");
      return null;
    }

    // 2️⃣ Limpar rankings antigos (Usando um filtro seguro para a Vercel/Supabase)
    await supabase.from("bot24_quant").delete().neq("id", "00000000-0000-0000-0000-000000000000"); 
    
    // 3️⃣ Cálculos de Ranking
    const top10 = [...history]
      .sort((a, b) => (b.marketScore + b.confidence) - (a.marketScore + a.confidence))
      .slice(0, 10);  
    
    const highProb = history
      .filter(h => h.probability >= 80)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);  
    
    // 4️⃣ Preparar inserção
    const insertData = history.map(h => ({  
      history_id: h.id,  
      top10: top10.some(t => t.id === h.id),  
      high_probability: highProb.some(t => t.id === h.id),  
      top_volatility: false, 
      top_momentum: false  
    }));  
    
    if (insertData.length > 0) {
      const { error: insertError } = await supabase.from("bot24_quant").insert(insertData);
      if (insertError) throw insertError;
    }
    
    return { 
      processed: history.length,
      topTrades: top10.length,
      highProbability: highProb.length 
    };

  } catch (err) {
    console.error("❌ Erro crítico no QuantEngine:", err);
    return null;
  }
}
      
