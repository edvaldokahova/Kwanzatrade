// src/lib/geminiClient.ts

export async function fetchGeminiAnalysis(data: any) {
  const apiKey = process.env.GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
Analise o seguinte mercado Forex e retorne um sinal:

Dados:
${JSON.stringify(data)}

Retorne:
- signal (BUY ou SELL)
- confidence (0-100)
- suggestedTimeframe
- tradingWindow
- riskSuggestion
`,
              },
            ],
          },
        ],
      }),
    }
  );

  const result = await response.json();

  try {
    const text = result.candidates[0].content.parts[0].text;

    return {
      signal: text.includes("BUY") ? "BUY" : "SELL",
      confidence: 70,
      suggestedTimeframe: "15m",
      tradingWindow: "London Session",
      riskSuggestion: "1%"
    };
  } catch (error) {
    console.error("Gemini parsing error:", error);

    return {
      signal: "NEUTRAL",
      confidence: 0,
      suggestedTimeframe: "-",
      tradingWindow: "-",
      riskSuggestion: "-"
    };
  }
}