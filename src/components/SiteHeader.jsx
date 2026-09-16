import { Link } from "react-router-dom";
import { HardHat, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const email = user?.email || "";

  return (
    <header className="sticky top-0 z-20 h-14 bg-[#0F172A] text-white">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-white/10">
            <HardHat className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <span className="font-display text-[0.95rem] font-bold uppercase tracking-wide text-white">
            Project: LIVIO Construction Site Tracker
          </span>
        </Link>

        {/* Live site pill indicator */}
        <div className="hidden items-center gap-1.5 rounded-[4px] border border-white/10 bg-white/5 px-2 py-1 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
          <span className="font-mono text-[0.7rem] font-medium tracking-wide text-[#94A3B8]">
            LIVIO-2020-12-SIGNED
          </span>
        </div>

        {/* Right-aligned user menu */}
        <div className="ml-auto flex items-center gap-3">
          {email && (
            <span className="hidden max-w-[200px] truncate text-[0.8rem] text-[#94A3B8] md:inline">
              {email}
            </span>
          )}
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#94A3B8] transition-colors hover:text-[#F59E0B]"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}