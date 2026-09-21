import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Role = "VISITANTE" | "ESTUDIANTE" | "ADMIN";

export const ROLE_LABEL: Record<Role, string> = {
  VISITANTE: "Visitante",
  ESTUDIANTE: "Estudiante",
  ADMIN: "Administrador",
};

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  userAge: number;
  setUserAge: (age: number) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("ESTUDIANTE");
  const [userAge, setUserAge] = useState(20);

  const value = useMemo(
    () => ({ role, setRole, userAge, setUserAge }),
    [role, userAge],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole debe usarse dentro de <RoleProvider>");
  }
  return context;
}
