"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  User, Mail, Lock, Trophy,
  UserPlus, AlertCircle, CheckCircle, Send,
} from "lucide-react";

export default function Register() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [traderLevel, setTraderLevel] = useState("Iniciante");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName, trader_level: traderLevel },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setGoogleLoading(false);
    }
  };

  const resendEmail = async () => {
    setResending(true);
    try {
      await supabase.auth.resend({ type: "signup", email });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-6 py-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-[#0d0d0d] border border-blue-400/20 rounded-3xl p-10 shadow-[0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              Abrir conta Gratuita
            </h1>
            <p className="text-gray-400 text-sm">
              Junte-se à nova geração de traders angolanos.
            </p>
          </div>

          {!success && (
            <>
              <button
                onClick={handleGoogleRegister}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.54 30.33 0 24 0 14.64 0 6.5 5.48 2.56 13.44l7.98 6.2C12.24 13.28 17.67 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.63-.15-3.2-.43-4.72H24v9h12.7c-.55 2.97-2.22 5.48-4.73 7.18l7.27 5.66C43.87 37.43 46.5 31.52 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.54 28.64a14.5 14.5 0 010-9.28l-7.98-6.2A23.97 23.97 0 000 24c0 3.77.9 7.34 2.56 10.84l7.98-6.2z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.27-5.66c-2.02 1.35-4.6 2.14-8.63 2.14-6.33 0-11.76-3.78-13.46-9.14l-7.98 6.2C6.5 42.52 14.64 48 24 48z"/>
                </svg>
                {googleLoading ? "A redirecionar..." : "Continuar com Google"}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">ou</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>
            </>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl text-sm border bg-white/5 border-white/20 text-gray-200">
                <CheckCircle size={18} className="shrink-0 mt-[2px] text-green-400" />
                <span>
                  Conta criada com sucesso. Verifique o seu email para confirmar o
                  cadastro antes de fazer login.
                </span>
              </div>

              <button
                onClick={resendEmail}
                disabled={resending}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition"
              >
                {resending ? "A reenviar..." : (<><Send size={18} /> Reenviar email de confirmação</>)}
              </button>

              <div className="text-center text-sm text-gray-400">
                Email confirmado?{" "}
                <Link href="/auth/login" className="text-white font-semibold hover:text-gray-300">
                  Fazer login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
                <input
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="relative">
                <Trophy className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
                <select
                  value={traderLevel}
                  onChange={(e) => setTraderLevel(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-white/30 transition appearance-none"
                >
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <AlertCircle size={18} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                {loading ? "A criar conta..." : (<><UserPlus size={18} /> Criar conta</>)}
              </button>
            </div>
          )}

          {!success && (
            <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
              Já possui conta?{" "}
              <Link href="/auth/login" className="text-white font-semibold hover:text-gray-300 transition">
                Entrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
