import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Register",
      description: "Create your profile and join your college community."},
    {
      number: "02",
      title: "Join Communities",
      description: "Explore discussions and communities from colleges across India."
    },
    {
      number: "03",
      title: "Connect",
      description: "Build meaningful connections with students, seniors, and alumni."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Centered Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-normal text-[var(--text)] font-heading">
            How it works
          </h2>
          <p className="mt-4 text-base md:text-lg text-[var(--text-muted)] font-body leading-relaxed">
           One platform. Thousands of students. Countless connections.
          </p>
        </div>

        {/* 3 Step Process Container */}
        <div className="relative">
          
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-7 left-[12%] right-[12%] h-[1px] border-t border-dashed border-[var(--border)]" />

          {/* Mobile Connecting Line */}
          <div className="md:hidden absolute left-7 top-6 bottom-6 w-[1px] border-l border-dashed border-[var(--border)]" />

          {/* Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-row md:flex-col items-start md:items-center text-left md:text-center gap-6 md:gap-5 group relative"
              >
                {/* Glowing Numbered Circle */}
                <div className="flex-shrink-0 w-14 h-14 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] text-lg font-semibold font-heading flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.15)] group-hover:border-[var(--primary)]/70 group-hover:bg-[var(--primary)]/20 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-300 select-none">
                  {step.number}
                </div>

                {/* Text Content */}
                <div className="pt-2 md:pt-0">
                  <h3 className="text-lg font-semibold font-heading text-[var(--text)] group-hover:text-[var(--text)] transition-colors duration-200">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)] font-body leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
