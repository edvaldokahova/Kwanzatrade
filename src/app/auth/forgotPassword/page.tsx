"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Mail, Send, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleReset = async () => {
    if (!email) { setMessage("Insira o seu email."); setStatus("error"); return; }
    setStatus("loading"); setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/resetPassword`,
      });
      if (error) { setMessage(`Erro: ${error.message}`); setStatus("error"); }
      else { setMessage("Se este email estiver cadastrado, receberá instruções para redefinir a senha em instantes."); setStatus("success"); }
    } catch (err) {
      console.error("Erro ao enviar link de redefinição:", err);
      setMessage("Erro ao enviar link de redefinição. Tente novamente.");
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
                <h2 className="text-xl font-black text-white">Email enviado!</h2>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">{message}</p>
              </div>
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm"
              >
                <ArrowLeft size={15} /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight">Recuperar acesso</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enviaremos um link seguro para redefinir a sua senha.
                </p>
              </div>

              <div className="space-y-4">

                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="Email cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    disabled={status === "loading"}
                    className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition disabled:opacity-50"
                  />
                </div>

                {message && status === "error" && (
                  <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle size={16} className="shrink-0" />
                    {message}
                  </div>
                )}

                <button
                  onClick={handleReset}
                  disabled={status === "loading"}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50 text-sm"
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      A enviar...
                    </span>
                  ) : (
                    <><Send size={15} /> Enviar instruções</>
                  )}
                </button>

              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          <Link href="/auth/login" className="inline-flex items-center gap-1 hover:text-gray-300 transition">
            <ArrowLeft size={13} /> Voltar para o login
          </Link>
        </p>

      </div>
    </main>
  );
}
