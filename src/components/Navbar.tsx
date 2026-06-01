"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { LogoIcon } from "./ui/Icons";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerLoginModal = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  };

  const triggerSignupModal = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-signup-modal"));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg)]/60 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo on Left */}
          <div className="flex items-center gap-2.5">
            <LogoIcon className="text-[var(--text)]" size={28} />
            <span className="font-heading text-lg font-bold tracking-tight text-[var(--text)] hover:opacity-90 transition-opacity select-none">
              Campus<span className="text-[var(--primary)] font-semibold">Circle</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a 
              href="#" 
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--primary)] hover:after:w-full after:transition-all after:duration-300"
            >
              Home
            </a>
            <a 
              href="#about" 
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--primary)] hover:after:w-full after:transition-all after:duration-300"
            >
              About
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--primary)] hover:after:w-full after:transition-all after:duration-300"
            >
              How It Works
            </a>
          </nav>

          {/* Desktop CTA & Theme Toggle on Right */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:scale-[1.05] active:scale-[0.95] transition-all duration-200"
              aria-label="Toggle theme"
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  /* Sun Icon */
                  <svg className="w-5 h-5 text-[var(--text)] transition-transform duration-300 hover:rotate-45" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M21 12h-2.25m-13.5 0H3m2.22 7.78l1.59-1.59m12.38-12.38l1.59-1.59M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
                  </svg>
                ) : (
                  /* Moon Icon */
                  <svg className="w-5 h-5 text-[var(--text)] transition-transform duration-300 hover:-rotate-12" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )
              ) : (
                <div className="w-5 h-5 rounded-full bg-[var(--border)] animate-pulse" />
              )}
            </button>

            <button
              onClick={triggerLoginModal}
              className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 py-2 px-3 focus:outline-none"
            >
              Login
            </button>
            <button
              onClick={triggerSignupModal}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-all duration-200 hover:bg-[var(--primary-hover)] hover:shadow-[0_0_20px_rgba(124,58,237,0.45)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Your College
            </button>
          </div>

          {/* Mobile Hamburger & Theme Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] transition-all duration-200"
              aria-label="Toggle theme"
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M21 12h-2.25m-13.5 0H3m2.22 7.78l1.59-1.59m12.38-12.38l1.59-1.59M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )
              ) : (
                <div className="w-5 h-5 rounded-full bg-[var(--border)] animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus:outline-none transition-colors duration-200"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[var(--bg)]/90 border-b border-[var(--border)] backdrop-blur-lg animate-fade-in" id="mobile-menu">
          <div className="space-y-1 px-4 py-6 sm:px-6">
            <a
              href="#"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-all duration-200"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-all duration-200"
            >
              About
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-all duration-200"
            >
              How It Works
            </a>
            <div className="pt-4 mt-4 border-t border-[var(--border)] space-y-3">
              <button
                onClick={(e) => {
                  setIsOpen(false);
                  triggerLoginModal(e);
                }}
                className="flex w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 text-base font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                Login
              </button>
              <button
                onClick={(e) => {
                  setIsOpen(false);
                  triggerSignupModal(e);
                }}
                className="flex w-full items-center justify-center rounded-lg bg-[var(--primary)] py-3 text-base font-semibold text-white shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-all duration-200 hover:bg-[var(--primary-hover)]"
              >
                Join Your College
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
