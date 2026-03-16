"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // 🔹 novo client
import { 
  User, Wallet, ShieldAlert, Trophy, Key, Mail, Settings, 
  RefreshCw, LogOut 
} from "lucide-react";

type TradingProfile = {
  capital: number;
  risk_percent: number;
  trader_level: string;
};

export default function MyAccountPage() {
  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newLevel, setNewLevel] = useState<string>("");

  const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const supabase = createClient(); // 🔹 instância client-side

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Usuário não autenticado");
        const user = userData.user;
        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("trading_profiles")
          .select("capital, risk_percent, trader_level")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          setNewLevel(data.trader_level);
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [supabase]);

  async function updateTraderLevel() {
    if (!profile) return;
    setUpdating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { error } = await supabase
        .from("trading_profiles")
        .update({ trader_level: newLevel })
        .eq("user_id", userId);

      if (error) {
        alert("Erro ao atualizar nível");
      } else {
        setProfile(prev => prev ? { ...prev, trader_level: newLevel } : null);
        alert("Nível de experiência atualizado!");
      }
    } catch (err) {
      console.error("Erro ao atualizar nível:", err);
      alert("Erro ao atualizar nível");
    } finally {
      setUpdating(false);
    }
  }

  async function changePassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) alert("Erro ao enviar link de redefinição");
    else alert("Link de redefinição enviado para: " + email);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase">My Account</h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Quase lá...</span>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD PRINCIPAL - USUÁRIO */}
          <div className="md:col-span-2 space-y-6">

            <div className="bg-gray-950/50 border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl group hover:scale-[1.01] transition-transform">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <User size={120} />
              </div>

              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  {email[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {email}
                  </h2>
                  <p className="text-gray-500 text-sm">Membro Bot24 Premium</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    <Wallet className="w-3 h-3" /> Trading Capital
                  </div>
                  <div className="text-2xl font-black text-white">${profile.capital.toLocaleString()}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    <ShieldAlert className="w-3 h-3" /> Risk Profile
                  </div>
                  <div className="text-2xl font-black text-blue-400">{profile.risk_percent}%</div>
                </div>
              </div>
            </div>

            {/* CONFIGURAÇÕES DE TRADING */}
            <div className="bg-gray-950/50 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Trading Experience
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Current Level</label>
                  <select
                    value={newLevel}
                    onChange={e => setNewLevel(e.target.value)}
                    className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                  >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <button
                  onClick={updateTraderLevel}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Update Level"}
                </button>
              </div>
            </div>

          </div>

          {/* BARRA LATERAL - ACÇÕES */}
          <div className="space-y-4">

            <div className="bg-gray-950/50 border border-gray-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Security & Session</h3>

              <button
                onClick={changePassword}
                className="flex items-center gap-3 w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-2xl transition border border-gray-700"
              >
                <Key className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm">Reset Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 p-4 rounded-2xl transition border border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-sm">Logout</span>
              </button>
            </div>

            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] text-center">
              <p className="text-xs text-blue-400 leading-relaxed italic">
                "O gerenciamento de risco é a única coisa que separa um trader de um apostador."
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-gray-950/50 p-10 rounded-[2.5rem] text-center border border-gray-800">
          <p className="text-gray-500">Profile not found. Please contact support.</p>
        </div>
      )}

    </div>
  );
}
