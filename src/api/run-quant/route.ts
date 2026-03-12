// src/app/api/run-quant/route.ts
import { runQuantEngine } from "@/lib/bot24QuantEngine";
import { NextResponse } from "next/server";

// Força a API a não guardar cache de resposta (queremos dados novos sempre que for chamada)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runQuantEngine();
    
    if (!result) {
      return NextResponse.json(
        { message: "Nenhum dado encontrado para processar no momento." },
        { status: 200 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao rodar o Quant Engine:", error);
    return NextResponse.json(
      { error: "Erro interno no Quant Engine" },
      { status: 500 }
    );
  }
}
