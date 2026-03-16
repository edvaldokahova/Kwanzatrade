import { NextResponse } from "next/server";
import { runGeminiScheduler } from "@/lib/geminiScheduler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Não autorizado", { status: 401 });
  }

  try {
    await runGeminiScheduler();
    return NextResponse.json({
      success: true,
      message: "Scheduler executado com sucesso",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
