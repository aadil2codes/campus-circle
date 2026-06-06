import React from "react";
import { LogoIcon } from "./ui/Icons";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)] pt-12 pb-6 md:pt-16 md:pb-8 select-none text-[var(--text-muted)] font-body relative z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Upper Multi-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 items-start mb-12">
          
          {/* Left Column: Brand Logo & Tagline */}
          <div className="md:col-span-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5">
              <LogoIcon className="text-[var(--text)]" size={24} />
              <span className="font-heading text-base font-bold tracking-tight text-[var(--text)] select-none">
                Circle<span className="text-[var(--primary)] font-semibold">Net</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              The digital campus connecting students, seniors, and alumni across India.
            </p>
          </div>

          {/* Right Columns: Links */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-8 w-full">
            {/* 1. About */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">About</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#about" className="hover:text-[var(--text)] transition-colors">Platform</a></li>
                <li><a href="#why-join" className="hover:text-[var(--text)] transition-colors">Why Join</a></li>
              </ul>
            </div>

            {/* 2. Community */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Community</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#community" className="hover:text-[var(--text)] transition-colors">Students</a></li>
                <li><a href="#roles" className="hover:text-[var(--text)] transition-colors">Campus Groups</a></li>
              </ul>
            </div>

            {/* 3. Topics */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Topics</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#topics" className="hover:text-[var(--text)] transition-colors">Discussions</a></li>
                <li><a href="#resources" className="hover:text-[var(--text)] transition-colors">Notes & Guides</a></li>
              </ul>
            </div>

            {/* 4. Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Contact</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#apply" className="hover:text-[var(--text)] transition-colors">Join</a></li>
                <li><a href="mailto:support@circlenet.in" className="hover:text-[var(--text)] transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Lower Section: Copyright and Legal */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[var(--text-muted)]">
            © 2026 CircleNet. Built for college communities. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-[11px] font-medium text-[var(--text-muted)]">
            <a href="#privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</a>
            <a href="#conduct" className="hover:text-[var(--text)] transition-colors">Code of Conduct</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
