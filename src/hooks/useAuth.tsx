import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toEmail, type ActionKey, type MenuKey, type Profile } from "@/lib/auth";

interface AuthCtx {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isApproved: boolean;
  myPlayerId: string | null;
  can: (menu: MenuKey, action: ActionKey) => boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("ft_profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_ev, s) => {
      setSession(s);
      if (s) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === "admin" && profile?.status === "approved";
  const isApproved = profile?.status === "approved";

  function can(menu: MenuKey, action: ActionKey): boolean {
    if (!isApproved) return false;
    if (isAdmin) return true;
    return profile?.perms?.[menu]?.[action] === true;
  }

  async function signIn(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    if (error) throw new Error("เข้าสู่ระบบไม่สำเร็จ — ตรวจ username/รหัสผ่าน");
  }

  async function signUp(username: string, password: string, displayName: string) {
    const { error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
      options: { data: { username: username.trim().toLowerCase(), display_name: displayName.trim() } },
    });
    if (error) {
      if (/already registered|exists/i.test(error.message))
        throw new Error("username นี้ถูกใช้แล้ว");
      throw new Error(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  return (
    <Ctx.Provider
      value={{
        loading,
        session,
        profile,
        isAdmin,
        isApproved,
        myPlayerId: profile?.player_id ?? null,
        can,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
