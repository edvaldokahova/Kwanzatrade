"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

type PasswordRule = {
  label: string;
  test: (pw: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mínimo de 8 caracteres",        test: (pw) => pw.length >= 8 },
  { label: "Pelo menos uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Pelo menos um número",           test: (pw) => /[0-9]/.test(pw) },
  { label: "Pelo menos um símbolo",          test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function ResetPassword() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const ruleResults = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
  const passwordValid = ruleResults.every((r) => r.passed);

  const handleReset = async () => {
    if (!passwordValid) return;
    setStatus("loading"); setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage(`Erro: ${error.message}`); setStatus("error"); }
      else { setMessage("Senha redefinida com sucesso! A redirecionar..."); setStatus("success"); setTimeout(() => router.push("/auth/login"), 2500); }
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setMessage("Erro ao redefinir senha. Tente novamente.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0c] flex items-center justify-center px-6 py-16">

      {/* Glow de fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-blue-500/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] bg-blue-500/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image src="/kwanzatrade-logo.svg" alt="KwanzaTrade" width={160} height={32} />
        </div>

        {/* Card */}
        <div className="bg-[#111113] border border-gray-800 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">

          {status === "success" ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-400/10 border border-green-400/20 mb-4">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <h2 className="text-xl font-black text-white">Senha redefinida!</h2>
                <p className="text-gray-500 text-sm mt-2">A redirecionar para o login...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight">Definir nova senha</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Escolha uma senha forte para proteger a sua conta.
                </p>
              </div>

              <div className="space-y-4">

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === "loading"}
                    className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition disabled:opacity-50"
                  />
                </div>

                {/* Regras de senha */}
                {password.length > 0 && (
                  <div className="bg-[#0b0b0c] border border-gray-800 rounded-xl p-4 space-y-2">
                    {ruleResults.map(({ label, passed }) => (
                      <p key={label} className={`text-xs flex items-center gap-2 transition-colors ${passed ? "text-green-400" : "text-gray-600"}`}>
                        <span>{passed ? "✓" : "○"}</span>
                        {label}
                      </p>
                    ))}
                  </div>
                )}

                {message && status === "error" && (
                  <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle size={16} className="shrink-0" />
                    {message}
                  </div>
                )}

                <button
                  onClick={handleReset}
                  disabled={!passwordValid || status === "loading"}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      A processar...
                    </span>
                  ) : "Redefinir senha"}
                </button>

              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          <button
            onClick={() => router.push("/auth/login")}
            className="inline-flex items-center gap-1 hover:text-gray-300 transition"
          >
            <ArrowLeft size={13} /> Voltar para o login
          </button>
        </p>

      </div>
    </main>
  );
}
