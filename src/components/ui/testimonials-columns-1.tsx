"use client";

import React from "react";
import { motion } from "motion/react";

export interface TestimonialItem {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-[var(--primary)]/5 max-w-xs w-full transition-colors duration-300"
                  key={i}
                >
                  <div className="text-sm leading-relaxed text-[var(--text)]">{text}</div>
                  <div className="flex items-center gap-2.5 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover border border-[var(--border)]"
                    />
                    <div className="flex flex-col">
                      <div className="text-xs font-bold font-heading text-[var(--text)] tracking-tight leading-4">
                        {name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] leading-4 font-body">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
