"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Shield, CheckCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["campus", "interests", "goals", "conversations", "ideas"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const triggerLoginModal = () => {
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  };

  const triggerSignupModal = () => {
    window.dispatchEvent(new CustomEvent("open-signup-modal"));
  };

  return (
    <section className="relative w-full overflow-hidden bg-grid-pattern bg-radial-glow py-20 md:py-28 lg:py-36 flex-1">
      {/* Decorative Absolute Radial Blurs for Background Depth */}
      <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex gap-8 items-center justify-center flex-col text-center">
          
          {/* Verified Badge */}
          {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs font-semibold text-[var(--primary)] select-none animate-pulse-slow">
            <CheckCircle className="w-4 h-4" />
            <span>Verified Student Campus Network</span>
          </div> */}

          {/* Heading */}
          <div className="flex gap-4 flex-col w-full max-w-4xl">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-normal font-heading text-[var(--text)] leading-[1.1] md:leading-[1.05]">
              <span>Connect with students who share your</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center pb-2 pt-1.5 text-[var(--primary)] min-h-[50px] sm:min-h-[70px] lg:min-h-[90px]">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-4 text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--text-muted)] max-w-2xl mx-auto font-body">
              One Digital Campus Where Students from Across India Connect and Collaborate
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-row items-center gap-4 mt-4">
            <Button
              size="lg"
              className="gap-2.5 text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold transition-all duration-200"
              variant="outline"
              onClick={triggerLoginModal}
            >
              Login <MoveRight className="w-4 h-4 opacity-70" />
            </Button>
            <Button
              size="lg"
              className="gap-2.5 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-[var(--primary)]/20 font-bold transition-all duration-200"
              onClick={triggerSignupModal}
            >
              Join <MoveRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Centered Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-[var(--border)] w-full max-w-3xl">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {/* 1. Verified Students */}
              <div className="flex items-center gap-2 text-[var(--text-muted)] select-none">
                <CheckCircle className="w-4 h-4 text-[var(--text-muted)] opacity-80" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Verified Campuses</span>
              </div>
              {/* 2. No Spam */}
              <div className="flex items-center gap-2 text-[var(--text-muted)] select-none">
                <Shield className="w-4 h-4 text-[var(--text-muted)] opacity-80" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Build Connections</span>
              </div>
              {/* 3. Campus-Only Access */}
              <div className="flex items-center gap-2 text-[var(--text-muted)] select-none">
                <Key className="w-4 h-4 text-[var(--text-muted)] opacity-80" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Grow Together</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
