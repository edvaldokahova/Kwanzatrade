"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import {
  User, Mail, Lock, Trophy,
  UserPlus, AlertCircle, CheckCircle, Send,
} from "lucide-react";

export default function Register() {
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
    if (!fullName || !email || !password) { setError("Preencha todos os campos."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name: fullName, trader_level: traderLevel } },
      });
      if (error) { setError(error.message); } else { setSuccess(true); }
    } catch { setError("Erro ao criar conta. Tente novamente."); }
    finally { setLoading(false); }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch { setGoogleLoading(false); }
  };

  const resendEmail = async () => {
    setResending(true);
    try { await supabase.auth.resend({ type: "signup", email }); }
    finally { setResending(false); }
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

          {success ? (
            /* Estado de sucesso */
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-400/10 border border-green-400/20 mb-4">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <h2 className="text-xl font-black text-white">Conta criada!</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Verifique o seu email para confirmar o registo antes de entrar.
                </p>
              </div>

              <button
                onClick={resendEmail}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm"
              >
                {resending ? "A reenviar..." : <><Send size={15} /> Reenviar email de confirmação</>}
              </button>

              <p className="text-center text-sm text-gray-600">
                Email confirmado?{" "}
                <Link href="/auth/login" className="text-gray-300 hover:text-white font-semibold transition">
                  Fazer login
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight">Criar conta gratuita</h1>
                <p className="text-gray-500 text-sm mt-1">Junte-se à nova geração de traders angolanos</p>
              </div>

              <div className="space-y-4">

                {/* Google */}
                <button
                  onClick={handleGoogleRegister}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#0b0b0c] border border-gray-800 hover:border-gray-600 text-white font-medium py-3 rounded-xl transition text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.54 30.33 0 24 0 14.64 0 6.5 5.48 2.56 13.44l7.98 6.2C12.24 13.28 17.67 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.63-.15-3.2-.43-4.72H24v9h12.7c-.55 2.97-2.22 5.48-4.73 7.18l7.27 5.66C43.87 37.43 46.5 31.52 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M10.54 28.64a14.5 14.5 0 010-9.28l-7.98-6.2A23.97 23.97 0 000 24c0 3.77.9 7.34 2.56 10.84l7.98-6.2z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.27-5.66c-2.02 1.35-4.6 2.14-8.63 2.14-6.33 0-11.76-3.78-13.46-9.14l-7.98 6.2C6.5 42.52 14.64 48 24 48z"/>
                  </svg>
                  {googleLoading ? "A redirecionar..." : "Continuar com Google"}
                </button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#111113] px-4 text-gray-600 tracking-widest">ou</span>
                  </div>
                </div>

                {/* Nome */}
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
                  <input
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition"
                  />
                </div>

                {/* Senha */}
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Senha (mín. 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition"
                  />
                </div>

                {/* Nível */}
                <div className="relative">
                  <Trophy className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
                  <select
                    value={traderLevel}
                    onChange={(e) => setTraderLevel(e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm outline-none focus:border-gray-600 transition appearance-none"
                  >
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                  </select>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "A criar conta..." : <><UserPlus size={16} /> Criar conta</>}
                </button>

              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {!success && (
          <p className="text-center text-sm text-gray-600 mt-6">
            Já possui conta?{" "}
            <Link href="/auth/login" className="text-gray-300 hover:text-white font-semibold transition">
              Entrar
            </Link>
          </p>
        )}

      </div>
    </main>
  );
}
