"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Workspace {
  id: string;
  orgName: string;
  propertyCount: number;
}

const workspaces: Workspace[] = [
  { id: "org-1", orgName: "TruVade Properties Ltd", propertyCount: 4 },
  { id: "org-2", orgName: "Ikoyi Luxury Stays", propertyCount: 2 },
];

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: string;
  setActiveWorkspace: (id: string) => void;
  current: Workspace;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0].id);
  const current = workspaces.find((w) => w.id === activeWorkspace) ?? workspaces[0];

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, current }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
