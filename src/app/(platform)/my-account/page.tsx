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

const DEFAULT_PROFILE: TradingProfile = {
  capital:      1000,
  risk_percent: 2,
  trader_level: "Beginner",
};

export default function MyAccountPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile,    setProfile]    = useState<TradingProfile | null>(null);
  const [email,      setEmail]      = useState("");
  const [userId,     setUserId]     = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(false);
  const [newLevel,   setNewLevel]   = useState("");
  const [newCapital, setNewCapital] = useState<number>(1000);
  const [newRisk,    setNewRisk]    = useState<number>(2);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Não autenticado");

        const user = userData.user;
        setEmail(user.email || "");
        setUserId(user.id);

        const { data, error } = await supabase
          .from("trading_profiles")
          .select("capital, risk_percent, trader_level")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setProfile(data);
          setNewLevel(data.trader_level);
          setNewCapital(data.capital);
          setNewRisk(data.risk_percent);
          return;
        }

        if (error?.code === "PGRST116") {
          const traderLevelFromMeta =
            user.user_metadata?.trader_level || "Beginner";

          const { data: created, error: createError } = await supabase
            .from("trading_profiles")
            .insert({
              user_id:      user.id,
              capital:      DEFAULT_PROFILE.capital,
              risk_percent: DEFAULT_PROFILE.risk_percent,
              trader_level: traderLevelFromMeta,
            })
            .select("capital, risk_percent, trader_level")
            .single();

          if (createError) {
            const fallback = {
              ...DEFAULT_PROFILE,
              trader_level: traderLevelFromMeta,
            };
            setProfile(fallback);
            setNewLevel(fallback.trader_level);
            setNewCapital(fallback.capital);
            setNewRisk(fallback.risk_percent);
          } else {
            setProfile(created);
            setNewLevel(created.trader_level);
            setNewCapital(created.capital);
            setNewRisk(created.risk_percent);
          }
          return;
        }

        setProfile(DEFAULT_PROFILE);
        setNewLevel(DEFAULT_PROFILE.trader_level);
        setNewCapital(DEFAULT_PROFILE.capital);
        setNewRisk(DEFAULT_PROFILE.risk_percent);
      } catch (err) {
        console.error("fetchProfile error:", err);
        setProfile(DEFAULT_PROFILE);
        setNewLevel(DEFAULT_PROFILE.trader_level);
        setNewCapital(DEFAULT_PROFILE.capital);
        setNewRisk(DEFAULT_PROFILE.risk_percent);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [supabase]);

  async function updateProfile() {
    if (!profile || !userId) return;
    setUpdating(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("trading_profiles")
        .upsert(
          {
            user_id:      userId,
            trader_level: newLevel,
            capital:      Number(newCapital),
            risk_percent: Number(newRisk),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        setErrorMsg("Erro ao atualizar perfil: " + error.message);
      } else {
        setProfile({
          trader_level: newLevel,
          capital:      Number(newCapital),
          risk_percent: Number(newRisk),
        });
        setSuccessMsg("Perfil atualizado com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err: any) {
      setErrorMsg("Erro inesperado: " + (err?.message ?? "desconhecido"));
    } finally {
      setUpdating(false);
    }
  }

  // Detecta se há alterações pendentes
  const hasChanges =
    profile !== null &&
    (newLevel   !== profile.trader_level  ||
     newCapital !== profile.capital       ||
     newRisk    !== profile.risk_percent);

  async function changePassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/resetPassword`,
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
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-gray-500" />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
          MEU{" "}
          <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
            PERFIL
          </span>
        </h1>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <span>✓</span> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <span>✕</span> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-16 justify-center">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">A carregar perfil...</span>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD PRINCIPAL */}
          <div className="md:col-span-2 space-y-6">

            {/* Avatar + Email */}
            <div className="bg-gray-950/60 border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-indigo-700 flex items-center justify-center text-3xl font-black text-black shadow-lg flex-shrink-0">
                  {email[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <p className="text-white font-bold truncate">{email}</p>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">Membro Livre</p>
                </div>
              </div>

              {/* ✅ Stats — reflectem o perfil real */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                    <Wallet className="w-3 h-3" /> Trading Capital
                  </div>
                  <div className="text-2xl font-black text-white">
                    ${Number(profile.capital).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Atualizado a cada análise
                  </p>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                    <ShieldAlert className="w-3 h-3" /> Risk Profile
                  </div>
                  <div className="text-2xl font-black text-green-400">
                    {profile.risk_percent}%
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Atualizado a cada análise
                  </p>
                </div>
              </div>
            </div>

            {/* TRADING SETTINGS — editar capital, risco e nível */}
            <div className="bg-gray-950/60 border border-gray-800 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <Trophy className="w-5 h-5 text-white" />
                Configurações de Trading
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Estes valores são usados como pré-definição nas análises e são
                atualizados automaticamente a cada análise que executas.
                Podes também ajustá-los manualmente aqui.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Capital */}
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-2 block tracking-wider">
                    Capital ($)
                  </label>
                  <input
                    type="number"
                    value={newCapital}
                    onChange={(e) => setNewCapital(Number(e.target.value))}
                    min={1}
                    className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-white transition"
                  />
                </div>

                {/* Risco */}
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-2 block tracking-wider">
                    Risco por operação (%)
                  </label>
                  <input
                    type="number"
                    value={newRisk}
                    onChange={(e) => setNewRisk(Number(e.target.value))}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-white transition"
                  />
                </div>
              </div>

              {/* Nível */}
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block tracking-wider">
                  Nível de experiência
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-white transition appearance-none"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l} className="bg-gray-800">
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={updateProfile}
                disabled={updating || !hasChanges}
                className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  "Guardar alterações"
                )}
              </button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-gray-950/60 border border-gray-800 p-6 rounded-[2.5rem] flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                Security & Session
              </h3>

              <button
                onClick={changePassword}
                className="flex items-center gap-3 w-full bg-gray-800/80 hover:bg-gray-700 text-white p-4 rounded-2xl transition border border-gray-700/50"
              >
                <Key className="w-5 h-5 text-white flex-shrink-0" />
                <span className="font-bold text-sm">Reset Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 p-4 rounded-2xl transition border border-red-500/20"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm">Logout</span>
              </button>
            </div>

            <div className="p-6 bg-gray-500/5 border border-gray-800 rounded-[2.5rem] text-center">
              <p className="text-xs text-white leading-relaxed italic">
                "O gerenciamento de risco é a única coisa que separa um trader
                de um apostador."
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
