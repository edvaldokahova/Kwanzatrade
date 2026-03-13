"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Pega a sessão atual
      const { data } = await supabase.auth.getSession();

      // Pega o tipo de link enviado pelo Supabase
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type"); // signup, recovery, etc.

      if (data.session) {
        // Se houver sessão válida, vai para dashboard
        router.push("/dashboard");
      } else if (type === "recovery") {
        // Se for link de reset de senha, vai para a página de reset
        router.push("/auth/resetPassword");
      } else {
        // Para todos os outros casos (signup ou erro), vai para login
        router.push("/auth/login");
      }
    };

    handleCallback();
  }, []);

  return null;
}
