"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client"; // 🔹 novo client
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Trophy,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Send
} from "lucide-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [traderLevel, setTraderLevel] = useState("Iniciante");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient(); // 🔹 instância client-side

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            trader_level: traderLevel
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      setError("Erro ao criar conta");
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    } catch (err) {
      console.error("Erro no login com Google:", err);
      setGoogleLoading(false);
    }
  };

  const resendEmail = async () => {
    setResending(true);
    try {
      await supabase.auth.resend({
        type: "signup",
        email: email
      });
    } catch (err) {
      console.error("Erro ao reenviar email:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-6 py-16">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-lg flex flex-col items-center">
        <div className="bg-[#0d0d0d] border border-blue-400/20 rounded-3xl p-10 shadow-[0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-xl w-full">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              Abrir conta Gratuita
            </h1>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
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
                  <path fill="#4285F4" d="M46.5 24.5c0-1.63-.15-3.2-.43-4.72H24v9h12.7 c-.55 2.97-2.22 5.48-4.73 7.18l7.27 5.66 C43.87 37.43 46.5 31.52 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.54 28.64a14.5 14.5 0 010-9.28l-7.98-6.2A23.97 23.97 0 000 24c0 3.77.9 7.34 2.56 10.84l7.98-6.2z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.27-5.66 c-2.02 1.35-4.6 2.14-8.63 2.14 -6.33 0-11.76-3.78-13.46-9.14l-7.98 6.2C6.5 42.52 14.64 48 24 48z"/>
                </svg>
                {googleLoading ? "A redirecionar..." : "Continuar com Google"}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-white/10"></div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">ou</span>
                <div className="flex-1 h-[1px] bg-white/10"></div>
              </div>
            </>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl text-sm border bg-white/5 border-white/20 text-gray-200">
                <CheckCircle size={18} className="shrink-0 mt-[2px]" />
                <span>
                  Conta criada com sucesso.  
                  Verifique o seu email para confirmar o cadastro antes de fazer login.
                </span>
              </div>

              <button
                onClick={resendEmail}
                disabled={resending}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
              >
                {resending ? "A reenviar..." : (
                  <>
                    Reenviar email de confirmação
                    <Send size={18}/>
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-400">
                Depois de confirmar o email, faça login:
                <Link href="/auth/login" className="ml-2 text-white font-semibold hover:text-gray-300">
                  Ir para login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-500 w-5 h-5"/>
                <input
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5"/>
                <input
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5"/>
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="relative">
                <Trophy className="absolute left-4 top-3.5 text-gray-500 w-5 h-5"/>
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
                  <AlertCircle size={18}/>
                  {error}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
              >
                {loading ? "A criar conta..." : (
                  <>
                    Criar conta
                    <UserPlus size={18}/>
                  </>
                )}
              </button>
            </div>
          )}

          {!success && (
            <div className="mt-10 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
              Já possui uma conta?
              <Link href="/auth/login" className="ml-2 text-white hover:text-gray-300 font-semibold transition">
                Entrar
              </Link>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-xs text-gray-600 tracking-[0.25em] uppercase">
          Trading System
        </p>
      </div>
    </main>
  );
}
