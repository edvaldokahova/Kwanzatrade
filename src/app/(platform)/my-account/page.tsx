"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User, Wallet, ShieldAlert, Trophy,
  Key, Mail, Settings, RefreshCw, LogOut,
} from "lucide-react";

type TradingProfile = {
  capital: number;
  risk_percent: number;
  trader_level: string;
};

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function MyAccountPage() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newLevel, setNewLevel] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Não autenticado");

        setEmail(userData.user.email || "");

        const { data, error } = await supabase
          .from("trading_profiles")
          .select("capital, risk_percent, trader_level")
          .eq("user_id", userData.user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          setNewLevel(data.trader_level);
        }
      } catch (err) {
        console.error("fetchProfile error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [supabase]);

  async function updateTraderLevel() {
    if (!profile || !newLevel) return;
    setUpdating(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { error } = await supabase
        .from("trading_profiles")
        .update({ trader_level: newLevel })
        .eq("user_id", userId);

      if (error) {
        setErrorMsg("Erro ao atualizar nível.");
      } else {
        setProfile((prev) => (prev ? { ...prev, trader_level: newLevel } : null));
        setSuccessMsg("Nível atualizado com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      setErrorMsg("Erro ao atualizar nível.");
    } finally {
      setUpdating(false);
    }
  }

  async function changePassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setErrorMsg("Erro ao enviar link de redefinição.");
    } else {
      setSuccessMsg(`Link enviado para: ${email}`);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
          My Account
        </h1>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          ✕ {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-10">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando perfil...</span>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD PRINCIPAL */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-950/60 border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden hover:scale-[1.01] transition-transform">
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
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    <Wallet className="w-3 h-3" /> Trading Capital
                  </div>
                  <div className="text-2xl font-black text-white">
                    ${profile.capital.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    <ShieldAlert className="w-3 h-3" /> Risk Profile
                  </div>
                  <div className="text-2xl font-black text-blue-400">
                    {profile.risk_percent}%
                  </div>
                </div>
              </div>
            </div>

            {/* TRADING EXPERIENCE */}
            <div className="bg-gray-950/60 border border-gray-800 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Trading Experience
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">
                    Nível atual
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={updateTraderLevel}
                  disabled={updating || newLevel === profile.trader_level}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {updating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update Level"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR AÇÕES */}
          <div className="space-y-4">
            <div className="bg-gray-950/60 border border-gray-800 p-6 rounded-[2.5rem] flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                Security & Session
              </h3>

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
        <div className="bg-gray-950/60 p-10 rounded-[2.5rem] text-center border border-gray-800">
          <p className="text-gray-500">
            Perfil não encontrado. Contacte o suporte.
          </p>
        </div>
      )}
    </div>
  );
}
