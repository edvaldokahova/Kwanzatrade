"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const router = useRouter();

  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : error.message
        );
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-6 py-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg flex flex-col items-center">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-400 text-sm">
            Opere Forex com inteligência quantitativa
          </p>
        </div>

        <div className="space-y-5 w-full">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
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
              <>
                Entrar
                <LogIn size={18} />
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#191919] px-4 text-gray-500 tracking-[0.2em]">
                ou continue com
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-[#0b0b0c] border border-white/10 hover:border-white/30 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "A redirecionar..." : "Entrar com Google"}
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-sm text-gray-400 w-full">
          <Link href="/auth/forgotPassword" className="hover:text-white transition">
            Esqueceu a senha?
          </Link>
          <span className="mx-3 text-gray-700">•</span>
          <Link href="/auth/register" className="hover:text-white transition font-semibold">
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}
