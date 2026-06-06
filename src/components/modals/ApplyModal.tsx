"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { VerifiedIcon } from "../ui/Icons";

export default function ApplyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [queuePos, setQueuePos] = useState(47);
  const [copied, setCopied] = useState(false);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpResending, setOtpResending] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState("");
  const [showTitleSelect, setShowTitleSelect] = useState(false);
  const [showSizeSelect, setShowSizeSelect] = useState(false);

  // Select refs for click-away detection
  const titleSelectRef = useRef<HTMLDivElement>(null);
  const sizeSelectRef = useRef<HTMLDivElement>(null);

  // Listen for global custom trigger event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSuccess(false);
      setLoading(false);
      setFullName("");
      setWorkEmail("");
      setTitle("");
      setCompanyName("");
      setCompanySize("");
      setLinkedinUrl("");
      setEmailError("");
      setError("");
      setOtpSent(false);
      setOtpCode("");
      setOtpToken("");
      setOtpError("");
    };

    window.addEventListener("open-apply-modal", handleOpen);
    return () => window.removeEventListener("open-apply-modal", handleOpen);
  }, []);

  // Disable scroll when modal is open and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Click-out handlers for selects
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (titleSelectRef.current && !titleSelectRef.current.contains(event.target as Node)) {
        setShowTitleSelect(false);
      }
      if (sizeSelectRef.current && !sizeSelectRef.current.contains(event.target as Node)) {
        setShowSizeSelect(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Email validation: checks standard formatting, accepts personal and custom domains
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }

    setEmailError("");
    return true;
  };

  // Asynchronous Form Submission Handler: Requests verification code to prove email existence
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Verify all fields are completed
    if (!fullName || !workEmail || !title || !companyName || !companySize || !linkedinUrl) {
      setError("All fields are required.");
      return;
    }

    // Verify domain is valid
    if (!validateEmail(workEmail)) {
      return;
    }

    setLoading(true);

    try {
      console.log(`Requesting OTP verification code for: ${workEmail}...`);
      
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          email: workEmail,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to send verification code.");

      setOtpToken(resData.token);
      setOtpSent(true);
      console.log("Verification OTP code generated and signed token received successfully.");
    } catch (err: any) {
      console.error("Failed to request OTP:", err);
      setError(err?.message || "Verification code could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Resend OTP code to the candidate's email
  const handleResendOtp = async () => {
    setOtpResending(true);
    setOtpError("");
    try {
      console.log(`Resending verification code to: ${workEmail}...`);
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          email: workEmail,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to resend code.");
      
      setOtpToken(resData.token);
      setOtpCode("");
      console.log("New verification code successfully resent!");
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend verification code.");
    } finally {
      setOtpResending(false);
    }
  };

  // 2. Submit OTP Code (form handler wrapper)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      await triggerOtpVerification(otpCode);
    } else {
      setOtpError("Please enter a valid 6-digit code.");
    }
  };

  // 3. Cryptographically verify OTP and perform actual database insertion
  const triggerOtpVerification = async (code: string) => {
    setLoading(true);
    setOtpError("");
    try {
      console.log(`Verifying OTP code: ${code} for email: ${workEmail}...`);
      
      // Step A: Call API to verify OTP
      const verifyRes = await fetch("/api/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          email: workEmail,
          otp: code,
          token: otpToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Invalid verification code.");
      }

      console.log("OTP verified successfully! Inserting final application row into Supabase...");

      // Step B: If verification succeeded, insert application row into Supabase
      const { data, error: insertError } = await supabase
        .from("applications")
        .insert([
          {
            full_name: fullName,
            work_email: workEmail,
            title: title,
            company_name: companyName,
            company_size: companySize,
            linkedin_url: linkedinUrl,
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

      // Step C: Fetch new queue position (total count + 1)
      const { count, error: countError } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      const queuePosition = (count || 0) + 1;
      setQueuePos(queuePosition);
      setSuccess(true);
    } catch (err: any) {
      console.error("OTP Verification or database submission failed:", err);
      setOtpError(err?.message || "Failed to complete verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper Actions: Copy Link & Share LinkedIn
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLinkedIn = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(
        "I just joined CircleNet, the private digital community for my college campus! Join your college circles here: " + window.location.origin
      );
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}&summary=${text}`, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[520px] glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl border-white/[0.08] overflow-hidden z-10 max-h-[92vh] flex flex-col bg-navy-deep/95 bg-card-glow public-page"
          >
            {/* Ambient Accent Radial Bulb */}
            <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-brand/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Close Toggle */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-full p-1.5 hover:bg-white/[0.05] transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable Form Body for Small viewports */}
            <div className="overflow-y-auto pr-1 -mr-2">
              <AnimatePresence mode="wait">
                {!success ? (
                  !otpSent ? (
                    // STEP 1: ACTIVE FORM SYSTEM
                    <motion.div
                      key="form-step"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Header Details */}
                      <div className="mb-8">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-3.5 select-none">
                          <VerifiedIcon size={11} />
                          <span>Verified Students Only</span>
                        </div>
                        <h3 className="text-2xl font-bold font-heading text-white tracking-tight">
                          Join Your College Community
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-normal">
                          Connecting students, seniors, and alumni from your campus.
                        </p>
                      </div>

                      {/* Form Layout */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* 1. Full Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Full name</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Arjun Mehta"
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                          />
                        </div>

                        {/* 2. Work Email */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">College email</label>
                          <input
                            type="email"
                            required
                            value={workEmail}
                            onChange={(e) => {
                              setWorkEmail(e.target.value);
                              if (emailError) validateEmail(e.target.value);
                            }}
                            onBlur={(e) => validateEmail(e.target.value)}
                            placeholder="arjun@iitb.ac.in"
                            className={`w-full bg-[#040815]/80 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all font-body ${
                              emailError
                                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                                : "border-white/[0.06] focus:border-brand focus:ring-brand/40"
                            }`}
                          />
                          {emailError && (
                            <p className="text-[11px] font-semibold text-red-400 mt-1 flex items-center gap-1 animate-pulse">
                              <span className="w-1 h-1 rounded-full bg-red-400" />
                              {emailError}
                            </p>
                          )}
                        </div>

                        {/* 3. Title Custom Selector */}
                        <div className="space-y-1.5" ref={titleSelectRef}>
                          <label className="text-xs font-semibold text-slate-300">Year / Branch</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowTitleSelect(!showTitleSelect)}
                              className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-left text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all flex items-center justify-between"
                            >
                              <span className={title ? "text-white" : "text-slate-600"}>
                                {title || "Select year/branch"}
                              </span>
                              <svg
                                className={`w-4 h-4 text-slate-500 transition-transform ${showTitleSelect ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            <AnimatePresence>
                              {showTitleSelect && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 8 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 right-0 mt-1.5 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-20"
                                >
                                  {["1st Year", "2nd Year", "3rd Year", "Final Year", "Alumni"].map((option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => {
                                        setTitle(option);
                                        setShowTitleSelect(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-300 hover:bg-brand/10 hover:text-white transition-colors"
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* 4. Company Name & Company Size Layout Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">College name</label>
                            <input
                              type="text"
                              required
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="IIT Bombay"
                              className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                            />
                          </div>

                          <div className="space-y-1.5" ref={sizeSelectRef}>
                            <label className="text-xs font-semibold text-slate-300">Student type</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowSizeSelect(!showSizeSelect)}
                                className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-left text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all flex items-center justify-between"
                              >
                                <span className={companySize ? "text-white" : "text-slate-600"}>
                                  {companySize || "Select student type"}
                                </span>
                                <svg
                                  className={`w-4 h-4 text-slate-500 transition-transform ${showSizeSelect ? "rotate-180" : ""}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              <AnimatePresence>
                                {showSizeSelect && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 mt-1.5 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-20"
                                  >
                                    {["Undergraduate", "Postgraduate", "PhD Scholar", "Alumni"].map((sizeOption) => (
                                      <button
                                        key={sizeOption}
                                        type="button"
                                        onClick={() => {
                                          setCompanySize(sizeOption);
                                          setShowSizeSelect(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-300 hover:bg-brand/10 hover:text-white transition-colors"
                                      >
                                        {sizeOption}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {/* 5. LinkedIn Profile URL */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-300">Instagram / LinkedIn profile</label>
                            <span className="text-[10px] text-slate-500 font-medium">Helper field</span>
                          </div>
                          <input
                            type="url"
                            required
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="instagram.com/arjun or linkedin.com/in/arjun"
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                          />
                          <p className="text-[10px] text-slate-500 font-medium">Used to connect you with peers.</p>
                        </div>

                        {/* Submission Error Alert */}
                        {error && (
                          <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl animate-fade-in">
                            <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              {error}
                            </p>
                          </div>
                        )}

                        {/* Submit Button Action */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(24,95,165,0.25)] transition-all duration-200 hover:bg-brand-hover hover:shadow-[0_0_30px_rgba(24,95,165,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4 select-none"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Sending Code...</span>
                            </div>
                          ) : (
                            <span>Submit application</span>
                          )}
                        </button>

                      </form>
                    </motion.div>
                  ) : (
                    // STEP 1B: OTP VERIFICATION SCREEN
                    <motion.div
                      key="otp-step"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-8">
                        <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold font-heading text-center text-white tracking-tight">
                          Confirm your email
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-center text-slate-400 leading-normal max-w-sm mx-auto">
                          We sent a 6-digit verification code to <span className="text-brand font-semibold">{workEmail}</span>. Please enter it below to complete your application.
                        </p>
                      </div>

                      <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Verification Code</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setOtpCode(val);
                              if (val.length === 6) {
                                triggerOtpVerification(val);
                              }
                            }}
                            placeholder="000000"
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-lg font-bold text-center tracking-[10px] text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                          />
                          {otpError && (
                            <p className="text-[11px] font-semibold text-red-400 mt-1 flex items-center justify-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              {otpError}
                            </p>
                          )}
                        </div>

                        {/* Verify button */}
                        <button
                          type="submit"
                          disabled={loading || otpCode.length !== 6}
                          className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Verifying & Submitting...</span>
                            </div>
                          ) : (
                            <span>Verify & Submit Application</span>
                          )}
                        </button>

                        <div className="text-center pt-2">
                          <button
                            type="button"
                            disabled={otpResending}
                            onClick={handleResendOtp}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer disabled:opacity-50"
                          >
                            {otpResending ? "Resending new code..." : "Resend code"}
                          </button>
                        </div>

                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode("");
                              setOtpError("");
                            }}
                            className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer"
                          >
                            &larr; Back to edit details
                          </button>
                        </div>

                      </form>
                    </motion.div>
                  )
                ) : (
                  
                  // STEP 2: APPLICATION SUCCESS DIALOGUE
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-center py-6"
                  >
                    {/* Animated Emerald Tick Circle */}
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    {/* Succession copy */}
                    <h3 className="text-2xl font-bold font-heading text-white tracking-tight">
                      Application received
                    </h3>
                    <h4 className="mt-3 text-lg font-bold font-heading text-brand tracking-wide animate-pulse">
                      You're #{queuePos} in line
                    </h4>
                    <p className="mt-4 text-sm text-slate-400 font-body leading-relaxed max-w-sm mx-auto">
                      We’ll review your student details and email you within 48 hours.
                    </p>

                    {/* Social sharing tools */}
                    <div className="mt-10 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] max-w-sm mx-auto">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3.5">
                        Know another student who should join?
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCopyLink}
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-[#02040a]/40 hover:bg-slate-900/60 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer select-none"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span>{copied ? "Copied!" : "Copy invite link"}</span>
                        </button>

                        <button
                          onClick={handleShareLinkedIn}
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-[#02040a]/40 hover:bg-slate-900/60 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer select-none"
                        >
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          <span>Share on LinkedIn</span>
                        </button>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
