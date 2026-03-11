// app/api/runQuantEngine.ts
import { runQuantEngine } from "@/lib/bot24QuantEngine";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await runQuantEngine();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao rodar o Quant Engine:", error);
    return NextResponse.json(
      { error: "Erro no Quant Engine" },
      { status: 500 }
    );
  }
}