"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["vibrant", "verified", "collaborative", "connected", "supportive"],
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
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-semibold rounded-full hover:bg-[var(--primary)]/20 transition-all select-none"
            >
              <CheckCircle className="w-4 h-4 text-[var(--primary)]" /> Verified Student Campus Network
            </Button>
          </div>
          <div className="flex gap-4 flex-col w-full max-w-4xl">
            <h1 className="text-5xl md:text-7xl tracking-tighter text-center font-regular font-heading text-[var(--text)] leading-none">
              <span>Connect with students who share your</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 text-[var(--primary)] min-h-[80px]">
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

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-[var(--text-muted)] max-w-2xl text-center mx-auto mt-4 font-body">
              Connect beyond chaotic WhatsApp groups. Share study notes, internship alerts, placement prep resources, and club announcements with verified peers from your college campus.
            </p>
          </div>
          <div className="flex flex-row gap-3 mt-4">
            <Button
              size="lg"
              className="gap-4 text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]"
              variant="outline"
              onClick={triggerLoginModal}
            >
              Login <MoveRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              className="gap-4 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-[var(--primary)]/20"
              onClick={triggerSignupModal}
            >
              Join <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
