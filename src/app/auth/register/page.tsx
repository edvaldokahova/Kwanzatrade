// src/pages/auth/register.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import { User, Mail, Lock, Trophy, UserPlus, AlertCircle } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [traderLevel, setTraderLevel] = useState("Iniciante");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          name: fullName, 
          trader_level: traderLevel 
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Registro com sucesso - redireciona para login ou mostra aviso de confirmação
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2">CRIAR CONTA</h1>
          <p className="text-gray-500 text-sm">Junte-se à elite dos traders angolanos.</p>
        </div>

        <div className="space-y-4">
          {/* Nome Completo */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-600 w-5 h-5" />
            <input
              className="w-full bg-gray-950 border border-gray-800 p-3 pl-11 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-600 transition"
              placeholder="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-600 w-5 h-5" />
            <input
              className="w-full bg-gray-950 border border-gray-800 p-3 pl-11 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-600 transition"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-600 w-5 h-5" />
            <input
              className="w-full bg-gray-950 border border-gray-800 p-3 pl-11 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-600 transition"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Nível de Trader */}
          <div className="relative">
            <Trophy className="absolute left-3 top-3.5 text-gray-600 w-5 h-5" />
            <select
              className="w-full bg-gray-950 border border-gray-800 p-3 pl-11 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-600 transition appearance-none"
              value={traderLevel}
              onChange={(e) => setTraderLevel(e.target.value)}
            >
              <option>Iniciante</option>
              <option>Intermediário</option>
              <option>Avançado</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            className="w-full bg-white hover:bg-blue-600 hover:text-white text-black font-black py-3 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 mt-2"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "A PROCESSAR..." : (
              <>
                REGISTAR AGORA
                <UserPlus size={18} />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-8">
          Já possui uma conta?{" "}
          <Link href="/auth/login" className="text-blue-500 hover:underline font-bold">
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
}