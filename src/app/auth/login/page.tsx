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

  const handleLogin = async () => {

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {

      setError("Credenciais inválidas ou erro de conexão.");
      setLoading(false);

    } else {

      router.push("/dashboard");

    }
  };

  const handleGoogleLogin = async () => {

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

  };

  return (

    <main className="relative min-h-screen flex items-center justify-center px-6">

      {/* HERO BACKGROUND */}

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.webp')" }}
      />

      {/* DARK OVERLAY */}

      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* CONTAINER */}

      <div className="relative w-full max-w-md">

        {/* CARD */}

        <div className="bg-[#111112] border border-white/10 rounded-3xl p-10 backdrop-blur-xl
        transition-all duration-300
        hover:border-blue-400/40
        hover:-translate-y-1
        shadow-[0_0_25px_rgba(59,130,246,0.12)]
        hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]">

          {/* HEADER */}

          <div className="text-center mb-10">

            <h1 className="text-4xl font-black tracking-tight text-white mb-3">
              KWANZATRADE LOGIN
            </h1>

            <p className="text-gray-400 text-sm">
              Aceda à inteligência quantitativa do mercado
            </p>

          </div>

          <div className="space-y-5">

            {/* EMAIL */}

            <div className="relative">

              <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />

              <input
                className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-400/40 transition"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

            </div>

            {/* PASSWORD */}

            <div className="relative">

              <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />

              <input
                className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-400/40 transition"
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
              onClick={handleLogin}
              disabled={loading}
            >

              {loading ? "A processar..." : (
                <>
                  Entrar no sistema
                  <LogIn size={18} />
                </>
              )}

            </button>

            {/* DIVIDER */}

            <div className="relative my-6">

              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111112] px-3 text-gray-500 tracking-widest">
                  ou continue com
                </span>
              </div>

            </div>

            {/* GOOGLE LOGIN */}

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 shadow-xl"
            >

              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>

              Entrar com Google

            </button>

          </div>

          {/* SIGNUP */}

          <p className="text-center text-gray-500 text-xs mt-8">

            Não tem uma conta?{" "}

            <Link
              href="/signup"
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Criar conta gratuita
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}
