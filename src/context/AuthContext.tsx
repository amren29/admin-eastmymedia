"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

const PUBLIC_PAGES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/setup",
  "/reset-password",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserData = async (uid: string): Promise<UserData | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("uid, email, full_name, phone_number, role, status, created_at")
      .eq("uid", uid)
      .single();

    if (error || !data) return null;

    return {
      uid: data.uid,
      email: data.email,
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
    };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    router.push("/login");
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        const ud = await fetchUserData(session.user.id);
        setUserData(ud);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const ud = await fetchUserData(session.user.id);
        setUserData(ud);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect logic
  useEffect(() => {
    if (loading) return;

    const isPublicPage = PUBLIC_PAGES.includes(pathname);

    if (!user) {
      if (!isPublicPage) {
        router.push("/login");
      }
      return;
    }

    if (!userData) return;

    if (userData.status === "rejected") {
      logout();
      return;
    }

    if (userData.status === "pending") {
      if (pathname !== "/pending-approval") {
        router.push("/pending-approval");
      }
      return;
    }

    // Approved user on public pages => redirect to dashboard
    if (userData.status === "approved") {
      if (isPublicPage) {
        router.push("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, loading, pathname]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
