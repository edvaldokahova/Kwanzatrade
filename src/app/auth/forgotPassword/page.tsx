"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Mail, Send, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleReset = async () => {

    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/resetPassword`,
    });

    if (error) {
      setMessage(`Erro: ${error.message}`);
      setStatus("error");
    } else {
      setMessage("Se este email estiver cadastrado, receberá instruções para redefinir a senha em instantes.");
      setStatus("success");
    }
  };

  return (

    <main className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-6">

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_40%)]"></div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.06),transparent_40%)]"></div>

      </div>

      <div className="relative w-full max-w-lg">

        <div className="bg-[#0d0d0d] border border-blue-400/20 rounded-3xl p-10 backdrop-blur-xl
        transition-all duration-300
        hover:border-blue-400/40
        hover:-translate-y-1
        shadow-[0_0_35px_rgba(59,130,246,0.25)]">

          <div className="text-center mb-10">

            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              Recuperar acesso
            </h1>

            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Insira o email associado à sua conta e enviaremos um link seguro
              para redefinir a sua senha em segundos.
            </p>

          </div>

          <div className="space-y-5">

            <div className="relative">

              <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />

              <input
                type="email"
                placeholder="Seu email cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-400/40 transition"
              />

            </div>

            {message && (

              <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${
                status === "success"
                  ? "bg-white/5 border-white/20 text-gray-200"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>

                {status === "success"
                  ? <CheckCircle size={18} className="shrink-0 mt-[2px]" />
                  : <AlertCircle size={18} className="shrink-0 mt-[2px]" />}

                <span>{message}</span>

              </div>

            )}

            <button
              onClick={handleReset}
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
            >

              {status === "loading"
                ? "A enviar..."
                : (
                  <>
                    Enviar instruções
                    <Send size={18} />
                  </>
                )}

            </button>

          </div>

          <div className="mt-10 pt-6 border-t border-white/10 text-center">

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition"
            >

              <ArrowLeft size={16} />

              Voltar

            </Link>

          </div>

        </div>

        <p className="text-center mt-8 text-xs text-gray-600 tracking-[0.25em] uppercase">
          KwanzaTrade Security System
        </p>

      </div>

    </main>

  );
}
