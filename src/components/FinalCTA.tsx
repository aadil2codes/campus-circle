"use client";

import React from "react";
import { ArrowRightIcon } from "./ui/Icons";

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Large Rounded-3xl Glassmorphic Premium Container */}
        <div className="glass-panel rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-2xl border-[var(--border)] bg-grid-pattern bg-radial-glow bg-card-glow">
          {/* Decorative absolute blur circle inside container */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--primary)]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-normal text-[var(--text)] font-heading leading-[1.15]">
              Bring your campus closer together.
            </h2>

            {/* Subheadline */}
            <p className="mt-6 text-sm sm:text-base md:text-lg text-[var(--text-muted)] font-body leading-relaxed max-w-2xl mx-auto">
              Connect with peers, collaborate on resources, prepare for upcoming placement drives, and get direct senior mentorship on CampusCircle.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-signup-modal"))}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] transition-all duration-200 hover:bg-[var(--primary-hover)] hover:shadow-[0_0_30px_rgba(124,58,237,0.55)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Join
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--border)] px-6 py-3.5 text-sm font-semibold text-[var(--text)] hover:text-[var(--text)] transition-all duration-200 cursor-pointer"
              >
                Login
                <ArrowRightIcon size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
