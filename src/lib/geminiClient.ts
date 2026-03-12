export async function fetchGeminiAnalysis(data: any) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analise este mercado e responda em JSON estrito:
              ${JSON.stringify(data)}
              Campos: signal (BUY/SELL), confidence (number), entry_price, stop_loss, take_profit, suggestedTimeframe, tradingWindow, riskSuggestion.`
            }]
          }]
        }),
      }
    );

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    
    // Tenta extrair o JSON da resposta da IA
    return JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      signal: "NEUTRAL",
      confidence: 50,
      entry_price: 0,
      stop_loss: 0,
      take_profit: 0,
      suggestedTimeframe: "N/A",
      tradingWindow: "N/A",
      riskSuggestion: "Aguardar confirmação"
    };
  }
}
