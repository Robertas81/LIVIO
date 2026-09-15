import React from "react";
import { HardHat } from "lucide-react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="auth-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="auth-card relative overflow-hidden rounded-[4px] border border-[#E1E4E8] bg-[#FFFFFF] shadow-sm">
          {/* 3px safety-amber top edge accent */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[#F59E0B]" />
          <div className="p-8">
            {/* Brand header */}
            <div className="mb-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-[#0F172A]">
                  <HardHat className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <h1 className="font-display text-[1.25rem] font-bold uppercase leading-none tracking-tight text-[#0F172A]">
                  Project: LIVIO Construction Site Tracker
                </h1>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] border border-[#E1E4E8] bg-[#F4F5F6] px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                <span className="font-mono text-[0.75rem] font-medium tracking-wide text-[#64748B]">
                  LIVIO-2020-12-SIGNED
                </span>
              </div>
            </div>

            {/* Page title */}
            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h2 className="font-display text-[1.125rem] font-semibold text-[#0F172A]">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-1 text-[0.875rem] text-[#64748B]">{subtitle}</p>
                )}
              </div>
            )}

            {children}
          </div>
        </div>

        {footer && (
          <p className="mt-6 text-center text-[0.875rem] text-[#64748B]">{footer}</p>
        )}
      </div>
    </div>
  );
}