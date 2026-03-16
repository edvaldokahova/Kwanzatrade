import { runQuantEngine } from "@/lib/bot24QuantEngine";
import { NextResponse } from "next/server";

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
  } catch (error: any) {
    console.error("Quant Engine error:", error);
    return NextResponse.json(
      { error: "Erro interno no Quant Engine" },
      { status: 500 }
    );
  }
}
