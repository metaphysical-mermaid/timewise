import type { ReactNode } from "react";
import { BottomTabNav } from "./BottomTabNav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--bg)]">
      {children}
      <BottomTabNav />
    </div>
  );
}
