import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyJoin from "@/components/WhyJoin";
import Topics from "@/components/Topics";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ApplyModal from "@/components/modals/ApplyModal";
import AuthModal from "@/components/modals/AuthModal";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--primary)]/30 selection:text-[var(--text)] overflow-x-hidden public-page">
      {/* Locked Background Glows to Prevent Empty Bottom Gap and Layout Bleeds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[var(--primary)]/8 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-[var(--primary-hover)]/10 rounded-full blur-[140px]" />
      </div>

      {/* Sticky Premium Navigation */}
      <Navbar />

      {/* Main Page Layout */}
      <main className="flex flex-col flex-1 relative z-10">
        <Hero />
        
        {/* Subtle Horizontal Gradient Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        
        <WhyJoin />
        
        {/* Subtle Horizontal Gradient Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        
        <Topics />
        
        {/* Subtle Horizontal Gradient Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        
        <HowItWorks />
      </main>

      {/* Premium Multi-Column Footer */}
      <Footer />

      {/* Founding Membership Onboarding Modal */}
      <ApplyModal />

      {/* Campus Authentication Modal (Login/Signup/Forgot) */}
      <AuthModal />
    </div>
  );
}
