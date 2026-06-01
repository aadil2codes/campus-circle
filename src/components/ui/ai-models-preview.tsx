import React, { useMemo } from "react";
import { motion } from "framer-motion";

export type AiModel = {
  id: string;
  name: string;
  provider?: string;
  family?: string;
  version?: string;
  description?: string;
  contextWindowTokens?: number;
  inputPricePer1KTokensUSD?: number;
  outputPricePer1KTokensUSD?: number;
  supports?: {
    vision?: boolean;
    functionCalling?: boolean;
    toolUse?: boolean;
    streaming?: boolean;
    jsonMode?: boolean;
    audioIn?: boolean;
    audioOut?: boolean;
  };
  tags?: string[];
  meta?: Record<string, unknown>;
};

type Props = {
  models: AiModel[];
  className?: string;
};

export const AiModelsList: React.FC<Props> = ({ models, className = "" }) => {
  const sorted = useMemo(() => {
    return [...models].sort((a, b) => {
      return (a.provider || "").localeCompare(b.provider || "");
    });
  }, [models]);

  return (
    <div className={`w-full ${className}`}>
      <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">AI Models</h2>

      <motion.ul 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
      >
        {sorted.map((m) => (
          <motion.li
            key={m.id}
            variants={{
              hidden: { opacity: 0, y: 25 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm p-6 md:p-8 hover:-translate-y-2 hover:border-[var(--primary)]/40 hover:shadow-[0_12px_24px_-8px_rgba(124,58,237,0.16)] hover:bg-gradient-to-b hover:from-[var(--surface)] hover:to-[var(--surface-2)]/20 transition-all duration-500 ease-out text-left h-full flex flex-col justify-start"
          >
            <div>
              <span className="font-semibold text-[17px] leading-tight text-[var(--text)] block">{m.name}</span>
              <p className="mt-4 text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                {m.description || "No description available"}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};
