import { createActor } from "@/backend";
import { useIsAdmin } from "@/hooks/useQueries";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  isLoginError: boolean;
  isSessionExpired: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    isSessionExpired,
  } = useInternetIdentity();

  const adminQuery = useIsAdmin();
  const { actor } = useActor(createActor);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      recordedRef.current = false;
      return;
    }
    if (!actor || recordedRef.current) return;
    recordedRef.current = true;
    void actor.recordSignIn().catch(() => {
      recordedRef.current = false;
    });
  }, [isAuthenticated, actor]);

  const value: AuthContextValue = {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    isSessionExpired,
    isAdmin: adminQuery.data === true,
    isAdminLoading: adminQuery.isLoading,
    login: () => login(),
    logout: () => clear(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
