"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {

  const router = useRouter();

  useEffect(() => {

    const checkSession = async () => {

      const { data } = await supabase.auth.getSession();

      if (data.session) {

        router.push("/dashboard");

      } else {

        router.push("/auth/login");

      }

    };

    checkSession();

  }, []);

  return null;

}
