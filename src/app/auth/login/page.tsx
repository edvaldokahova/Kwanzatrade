"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Preencha email e senha."); return; }
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
      } else {
        router.push("/dashboard");
      }
    } catch { setError("Erro ao fazer login. Tente novamente."); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch { setGoogleLoading(false); }
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

          <div className="mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">Bem-vindo de volta</h1>
            <p className="text-gray-500 text-sm mt-1">Entre na sua conta para continuar</p>
          </div>

          <div className="space-y-4">

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#0b0b0c] border border-gray-800 hover:border-gray-600 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "A redirecionar..." : "Entrar com Google"}
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

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-600 w-4 h-4" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#0b0b0c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-gray-600 transition"
              />
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link href="/auth/forgotPassword" className="text-xs text-gray-500 hover:text-gray-300 transition">
                Esqueceu a senha?
              </Link>
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
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50 text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  A entrar...
                </span>
              ) : (
                <><LogIn size={16} /> Entrar</>
              )}
            </button>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Não tem conta?{" "}
          <Link href="/auth/register" className="text-gray-300 hover:text-white font-semibold transition">
            Criar conta gratuita
          </Link>
        </p>

      </div>
    </main>
  );
}
