"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function Login() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {

      setError(error.message);
      setLoading(false);

    } else {

      router.push("/dashboard");

    }

  };

  const handleGoogleLogin = async () => {

    setGoogleLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

  };

  return (

    <main className="min-h-screen bg-[#0d0d0d] flex items-start justify-center px-6 pt-16">
      
      {/* Background */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full"></div>

        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] bg-white/5 blur-[160px] rounded-full"></div>

      </div>

      <div className="relative w-full max-w-lg flex flex-col items-center">

        {/* BOT24 IMAGE */}

        <img
          src="/bot24_an.svg"
          alt="BOT24"
          className="w-40 mb-6 opacity-95"
        />

        <div className="bg-[#0d0d0d] border border-blue-400/20 rounded-3xl p-10 shadow-[0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-xl">

          {/* HEADER */}

          <div className="text-center mb-10">

            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              Bem-vindo de volta
            </h1>

            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Opere Forex com inteligência quantitativa
            </p>

          </div>

          <div className="space-y-5">

            {/* EMAIL */}

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

            {/* PASSWORD */}

            <div className="relative">

              <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />

              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 transition"
              />

            </div>

            {/* ERROR */}

            {error && (

              <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">

                <AlertCircle size={18} />

                {error}

              </div>

            )}

            {/* LOGIN BUTTON */}

            <button
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
              onClick={handleLogin}
              disabled={loading}
            >

              {loading
                ? "Quase lá..."
                : (
                  <>
                    Entrar
                    <LogIn size={18} />
                  </>
                )}

            </button>

            {/* Divider */}

            <div className="relative my-6">

              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0d0d0d] px-3 text-gray-500 tracking-widest">
                  ou continue com
                </span>
              </div>

            </div>

            {/* GOOGLE LOGIN */}

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

          {/* FOOTER */}

          <div className="mt-10 pt-6 border-t border-white/10 text-center text-sm text-gray-400">

            <Link
              href="/auth/forgotPassword"
              className="hover:text-white transition"
            >
              Esqueceu a senha?
            </Link>

            <span className="mx-3">•</span>

            <Link
              href="/auth/register"
              className="hover:text-white transition font-semibold"
            >
              Criar conta
            </Link>

          </div>

        </div>

      </div>

    </main>

  );

}
