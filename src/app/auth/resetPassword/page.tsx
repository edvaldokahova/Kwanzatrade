"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, RefreshCcw, CheckCircle, AlertCircle } from "lucide-react";

type PasswordRule = {
  label: string;
  test: (pw: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mínimo de 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Pelo menos uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Pelo menos um número", test: (pw) => /[0-9]/.test(pw) },
  { label: "Pelo menos um símbolo", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function ResetPassword() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const ruleResults = PASSWORD_RULES.map((r) => ({
    ...r,
    passed: r.test(password),
  }));
  const passwordValid = ruleResults.every((r) => r.passed);

  const handleReset = async () => {
    if (!passwordValid) return;

    setStatus("loading");
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(`Erro: ${error.message}`);
        setStatus("error");
      } else {
        setMessage("Senha redefinida com sucesso! A redirecionar...");
        setStatus("success");
        setTimeout(() => router.push("/auth/login"), 2500);
      }
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setMessage("Erro ao redefinir senha. Tente novamente.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-6 py-16">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.06),transparent_40%)]" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-[#0d0d0d] border border-blue-400/20 rounded-3xl p-10 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/40 hover:-translate-y-1 shadow-[0_0_35px_rgba(59,130,246,0.25)]">

          <div className="text-center mb-10">
            <div className="flex justify-center mb-5">
              <RefreshCcw
                className={`w-8 h-8 text-white/70 ${
                  status === "loading" ? "animate-spin" : ""
                }`}
              />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              Definir nova senha
            </h1>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Escolha uma senha forte para proteger a sua conta.
            </p>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
              <input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={status === "success"}
                className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-400/40 transition disabled:opacity-50"
              />
            </div>

            {/* Regras de senha */}
            {password.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl p-4 space-y-2">
                {ruleResults.map(({ label, passed }) => (
                  <p
                    key={label}
                    className={`text-xs flex items-center gap-2 transition-colors ${
                      passed ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    <span>{passed ? "✓" : "○"}</span>
                    {label}
                  </p>
                ))}
              </div>
            )}

            {message && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl text-sm border ${
                  status === "success"
                    ? "bg-white/5 border-white/20 text-gray-200"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle size={18} className="text-green-400 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="shrink-0" />
                )}
                {message}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={!passwordValid || status === "loading" || status === "success"}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  A processar...
                </span>
              ) : status === "success" ? (
                "Senha redefinida ✓"
              ) : (
                "Redefinir senha"
              )}
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => router.push("/auth/login")}
              className="text-gray-400 hover:text-white text-sm font-semibold transition"
            >
              Voltar para o login
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-gray-600 tracking-[0.25em] uppercase">
          KwanzaTrade Security System
        </p>
      </div>
    </main>
  );
}
