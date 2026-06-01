import React from "react";
import { VerifiedIcon, SparklesIcon, SystemIcon, ChartIcon, ChatBubbleIcon } from "./ui/Icons";

export default function DashboardPreview() {
  return (
    <div className="relative w-full min-h-[580px] flex items-center justify-center p-4 md:p-8 select-none">
      {/* Background Radial Ambient Blue Glows for Right Column */}
      <div className="absolute top-12 left-1/4 w-[350px] h-[350px] bg-[var(--primary)]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[280px] h-[280px] bg-[var(--primary)]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Perspective Dashboard Container */}
      <div className="relative w-full max-w-[540px] flex flex-col gap-5 animate-fade-in z-10">
        
        {/* 1. Student Profile Card (Top floating left) */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-4 md:p-5 shadow-2xl border-[var(--border)] transition-all duration-300 w-[92%] sm:w-[85%] self-start hover:z-20">
          <div className="flex items-start gap-4">
            {/* Custom Premium Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)]/40 to-[var(--primary)]/20 flex items-center justify-center border border-[var(--border)] text-[var(--text)] font-heading font-semibold text-base shadow-inner">
                AM
              </div>
              <div className="absolute -bottom-1 -right-1">
                <VerifiedIcon size={18} className="shadow-lg" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold font-heading text-[var(--text)]">Arjun Mehta</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 font-medium">
                  Student
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">3rd Year CS @ IIT Bombay · Ex-GSoC</p>
              
              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                  Next.js & React
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                  DSA & CP
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                  Hackathons
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Discussion Card (Center) */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 shadow-2xl border-[var(--border)] relative hover:z-20">
          {/* Card Accent Ribbon */}
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <SparklesIcon size={16} className="text-[var(--primary)]" />
              <span className="text-xs font-semibold text-[var(--primary)] font-heading uppercase tracking-wider">#placement-prep</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-[var(--text-muted)]">Active Discussion</span>
            </div>
          </div>

          {/* Question / Post Content */}
          <div className="mt-3.5">
            <h3 className="text-sm font-semibold font-heading text-[var(--text)] leading-snug">
              What are the most common system design questions being asked in Google and Uber placement rounds this season?
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2 line-clamp-2">
              "Most rounds focus heavily on low-level design for key-value stores and rate limiters. Seniors are suggesting doing..."
            </p>
          </div>

          {/* Thread Footer: Avatars + Reply Count */}
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              {/* Stacked Avatar Preview */}
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[var(--surface)] border-2 border-[var(--bg)] flex items-center justify-center text-[9px] font-bold text-[var(--text)]">RK</div>
                <div className="w-6 h-6 rounded-full bg-[var(--surface-2)] border-2 border-[var(--bg)] flex items-center justify-center text-[9px] font-bold text-[var(--text)]">SY</div>
                <div className="w-6 h-6 rounded-full bg-[var(--border)] border-2 border-[var(--bg)] flex items-center justify-center text-[9px] font-bold text-[var(--text)]">NM</div>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                4 Seniors replied
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200">
              <ChatBubbleIcon size={14} />
              <span className="text-[11px] font-semibold">18 Replies</span>
            </div>
          </div>
        </div>

        {/* 3. Note Shares Chart Card (Bottom right floating) */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-4 md:p-5 shadow-2xl border-[var(--border)] w-[95%] sm:w-[88%] self-end hover:z-20">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <SystemIcon size={15} className="text-[var(--text-muted)]" />
              <h5 className="text-xs font-semibold font-heading text-[var(--text)]">#study-notes</h5>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">Resource Growth</span>
          </div>

          <p className="text-xs text-[var(--text)] font-medium">Academic & Placement Lab Resource Shares</p>
          
          {/* Custom Latency Graph Widget */}
          <div className="mt-3.5 space-y-2">
            {/* Before Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)] font-medium">Standard Syllabus Notes Shared</span>
                <span className="text-red-400 font-semibold font-heading">15 shares</span>
              </div>
              <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-red-500/40 rounded-full border-r-2 border-red-400" />
              </div>
            </div>

            {/* After Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)] font-medium">DSA Sheet & Placement Guides Shared</span>
                <span className="text-green-400 font-semibold font-heading">142 shares</span>
              </div>
              <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="w-[82%] h-full bg-green-500/60 rounded-full border-r-2 border-green-400 transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Small Overlapping Campus Stats Widget (Floating left overlay) */}
        <div className="glass-panel rounded-xl p-3 shadow-2xl border-[var(--border)] absolute -left-6 bottom-8 w-[150px] hidden sm:block hover:scale-105 transition-transform duration-300 z-30">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--border)]">
            <ChartIcon size={13} className="text-[var(--primary)]" />
            <span className="text-[9px] font-bold text-[var(--text)] uppercase tracking-wider">CAMPUS STATS</span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div>
              <p className="text-[9px] text-[var(--text-muted)]">Note Shares</p>
              <p className="text-[10px] font-bold text-[var(--text)]">450+ Shared</p>
            </div>
            <div>
              <p className="text-[9px] text-[var(--text-muted)]">Active Seniors</p>
              <p className="text-[10px] font-bold text-emerald-400">120+ Verified</p>
            </div>
            <div className="flex items-center gap-1 pt-1 mt-1 border-t border-[var(--border)]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wide">100% Active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
