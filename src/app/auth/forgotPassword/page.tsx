"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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

    <main className="min-h-screen bg-[#0b0b0c] flex items-center justify-center px-6">

      {/* Background Light Effect */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full"></div>

        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full"></div>

      </div>

      {/* Container */}

      <div className="relative w-full max-w-lg">

        {/* Card */}

        <div className="bg-[#111112] border border-white/10 rounded-3xl p-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          {/* Header */}

          <div className="text-center mb-10">

            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              Recuperar acesso
            </h1>

            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Insira o email associado à sua conta e enviaremos um link seguro
              para redefinir a sua senha em segundos.
            </p>

          </div>

          {/* Input */}

          <div className="space-y-5">

            <div className="relative">

              <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />

              <input
                type="email"
                placeholder="Seu email cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-0 transition"
              />

            </div>

            {/* Message */}

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

            {/* Button */}

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

          {/* Divider */}

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

        {/* Footer */}

        <p className="text-center mt-8 text-xs text-gray-600 tracking-[0.25em] uppercase">
          KwanzaTrade Security System
        </p>

      </div>

    </main>

  );
}