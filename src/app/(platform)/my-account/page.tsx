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
  capital: 1000,
  risk_percent: 2,
  trader_level: "Beginner",
};

export default function MyAccountPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newLevel, setNewLevel] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        // 1. Busca o utilizador autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Não autenticado");

        const user = userData.user;
        setEmail(user.email || "");
        setUserId(user.id);

        // 2. Tenta buscar o perfil existente
        const { data, error } = await supabase
          .from("trading_profiles")
          .select("capital, risk_percent, trader_level")
          .eq("user_id", user.id)
          .single();

        if (data) {
          // ✅ Perfil encontrado normalmente
          setProfile(data);
          setNewLevel(data.trader_level);
          return;
        }

        // 3. Perfil não existe — cria automaticamente com valores padrão
        if (error?.code === "PGRST116") {
          console.log("Perfil não encontrado, a criar automaticamente...");

          const traderLevelFromMeta =
            user.user_metadata?.trader_level || "Beginner";

          const { data: created, error: createError } = await supabase
            .from("trading_profiles")
            .insert({
              user_id: user.id,
              capital: DEFAULT_PROFILE.capital,
              risk_percent: DEFAULT_PROFILE.risk_percent,
              trader_level: traderLevelFromMeta,
            })
            .select("capital, risk_percent, trader_level")
            .single();

          if (createError) {
            // 4. Se falhar o insert (ex: RLS ou outro erro), usa valores padrão localmente
            console.warn("Não foi possível criar perfil na BD:", createError.message);
            const fallback = {
              ...DEFAULT_PROFILE,
              trader_level: traderLevelFromMeta,
            };
            setProfile(fallback);
            setNewLevel(fallback.trader_level);
          } else {
            setProfile(created);
            setNewLevel(created.trader_level);
          }
          return;
        }

        // 5. Outro erro de BD — usa fallback silencioso
        console.error("Erro inesperado ao buscar perfil:", error);
        setProfile(DEFAULT_PROFILE);
        setNewLevel(DEFAULT_PROFILE.trader_level);

      } catch (err) {
        console.error("fetchProfile error:", err);
        // Mesmo em caso de erro crítico, mostra o formulário com defaults
        setProfile(DEFAULT_PROFILE);
        setNewLevel(DEFAULT_PROFILE.trader_level);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [supabase]);

  async function updateTraderLevel() {
    if (!profile || !newLevel || !userId) return;
    setUpdating(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // Tenta update — se não existir linha, faz upsert
      const { error } = await supabase
        .from("trading_profiles")
        .upsert(
          {
            user_id: userId,
            trader_level: newLevel,
            capital: profile.capital,
            risk_percent: profile.risk_percent,
          },
          { onConflict: "user_id" }
        );

      if (error) {
        setErrorMsg("Erro ao atualizar nível: " + error.message);
      } else {
        setProfile((prev) => (prev ? { ...prev, trader_level: newLevel } : null));
        setSuccessMsg("Nível atualizado com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err: any) {
      setErrorMsg("Erro inesperado: " + (err?.message ?? "desconhecido"));
    } finally {
      setUpdating(false);
    }
  }

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
        <Settings className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
          My Account
        </h1>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="text-green-400">✓</span> {successMsg}
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
            <div className="bg-gray-950/60 border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <User size={120} />
              </div>

              {/* Avatar + Email */}
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-black text-white shadow-lg flex-shrink-0">
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

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                    <Wallet className="w-3 h-3" /> Trading Capital
                  </div>
                  <div className="text-2xl font-black text-white">
                    ${Number(profile.capital).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
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

              <div className="bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-400">
                Nível atual:{" "}
                <span className="text-white font-bold">{profile.trader_level}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500 font-bold uppercase mb-2 block tracking-wider">
                    Alterar nível
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l} className="bg-gray-800">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={updateTraderLevel}
                  disabled={updating || newLevel === profile.trader_level}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
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
                <Key className="w-5 h-5 text-yellow-500 flex-shrink-0" />
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

            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] text-center">
              <p className="text-xs text-blue-400 leading-relaxed italic">
                "O gerenciamento de risco é a única coisa que separa um trader de um apostador."
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
