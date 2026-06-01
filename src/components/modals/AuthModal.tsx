"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { VerifiedIcon, LogoIcon } from "../ui/Icons";

type AuthView = "login" | "signup" | "forgot" | "request_college";

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Request College form states
  const [reqCollegeName, setReqCollegeName] = useState("");
  const [reqCollegeLocation, setReqCollegeLocation] = useState("");
  const [reqCollegeNotes, setReqCollegeNotes] = useState("");
  const [reqCollegeEmail, setReqCollegeEmail] = useState("");
  const [reqCollegeAvatar, setReqCollegeAvatar] = useState("");

  // Mandatory details collected at registration
  const [username, setUsername] = useState("");
  const [collegeName, setCollegeName] = useState("");

  // College Autocomplete additions for Signup
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeSuggestions, setCollegeSuggestions] = useState<any[]>([]);
  const [isCollegeSelected, setIsCollegeSelected] = useState(false);
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [searchingColleges, setSearchingColleges] = useState(false);
  const collegeSearchRef = React.useRef<HTMLDivElement>(null);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpResending, setOtpResending] = useState(false);

  // Username validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Auto-validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Listen for open-login-modal and open-signup-modal global events
  useEffect(() => {
    const handleOpenLogin = () => {
      setView("login");
      setIsOpen(true);
      resetStates();
    };

    const handleOpenSignup = () => {
      setView("signup");
      setIsOpen(true);
      resetStates();
    };

    window.addEventListener("open-login-modal", handleOpenLogin);
    window.addEventListener("open-signup-modal", handleOpenSignup);

    return () => {
      window.removeEventListener("open-login-modal", handleOpenLogin);
      window.removeEventListener("open-signup-modal", handleOpenSignup);
    };
  }, []);

  const resetStates = () => {
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setUsername("");
    setCollegeName("");
    setCollegeSearch("");
    setIsCollegeSelected(false);
    setCollegeSuggestions([]);
    setCollegeDropdownOpen(false);
    setUsernameAvailable(null);
    setUsernameLoading(false);
    setUsernameError("");
    setEmailError("");
    setPasswordError("");
    setOtpSent(false);
    setOtpCode("");
    setOtpToken("");
    setOtpError("");
    setOtpResending(false);
    setReqCollegeName("");
    setReqCollegeLocation("");
    setReqCollegeNotes("");
    setReqCollegeEmail("");
    setReqCollegeAvatar("");
  };

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

  // Auto-generate clean, unique campus handles based on college email prefix
  useEffect(() => {
    if (view === "signup" && email) {
      const cleanEmail = email.trim().toLowerCase();
      const prefix = cleanEmail.split("@")[0].replace(/[^a-z0-9_.]/g, "");
      if (prefix) {
        // If the current username already starts with the new prefix, preserve its random suffix
        const currentSuffix = username.startsWith(prefix) ? username.slice(prefix.length) : "";
        if (currentSuffix && /^[0-9_]*$/.test(currentSuffix)) {
          setUsername(prefix + currentSuffix);
        } else {
          const rand = Math.floor(1000 + Math.random() * 9000);
          setUsername(`${prefix}_${rand}`);
        }
      }
    }
  }, [email, view]);

  // Debounced username availability validation (disabled since handles are uniquely auto-generated)
  useEffect(() => {
    setUsernameAvailable(true);
    setUsernameLoading(false);
    setUsernameError("");
  }, [username, view]);

  // Close college dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (collegeSearchRef.current && !collegeSearchRef.current.contains(event.target as Node)) {
        setCollegeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when search input changes in signup
  useEffect(() => {
    if (isCollegeSelected) {
      setCollegeSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setSearchingColleges(true);
      try {
        const res = await fetch(`/api/colleges?q=${encodeURIComponent(collegeSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setCollegeSuggestions(data);
        }
      } catch (err) {
        console.error("Failed to fetch college suggestions:", err);
      } finally {
        setSearchingColleges(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [collegeSearch, isCollegeSelected]);

  // Client-side validations
  const validateInputs = (): boolean => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }

    if (view !== "forgot") {
      if (!password) {
        setPasswordError("Password is required.");
        valid = false;
      } else if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        valid = false;
      }
    }

    if (view === "signup") {
      if (!collegeName || !isCollegeSelected) {
        setError("Please search and select a verified college from the suggestions dropdown.");
        valid = false;
      }
    }

    return valid;
  };

  // Helper action: request a new college to be added by the admin via detailed form
  const handleRequestCollegeSubmit = async () => {
    setError("");
    setSuccess("");

    const cleanEmail = reqCollegeEmail.trim();
    const cleanName = reqCollegeName.trim();
    const cleanLocation = reqCollegeLocation.trim();
    const cleanNotes = reqCollegeNotes.trim();

    if (!cleanEmail) {
      setError("Please fill in your email address first so we can verify and log your request.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!cleanName) {
      setError("Please specify the name of the college.");
      return;
    }

    if (!cleanLocation) {
      setError("Please specify the location (city/state) of the college.");
      return;
    }

    setLoading(true);

    try {
      console.log(`Submitting college addition request: ${cleanName} (${cleanLocation}) for student: ${cleanEmail}...`);
      const { error: insertError } = await supabase
        .from("applications")
        .insert([
          {
            full_name: "College Addition Request",
            work_email: cleanEmail.toLowerCase(),
            title: cleanNotes ? `Request Notes: ${cleanNotes}` : "Campus Access Waitlist",
            company_name: cleanName,
            company_size: cleanLocation,
            linkedin_url: reqCollegeAvatar.trim() ? reqCollegeAvatar.trim() : "https://campuscircle.com/requested",
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(`Request for "${cleanName}" submitted successfully! The admin will review and add it shortly.`);
      
      // Update email state in main form if it was empty, to be helpful!
      if (!email) {
        setEmail(cleanEmail);
      }
      
      // Transition back to signup after 3.5 seconds
      setTimeout(() => {
        setView("signup");
        setSuccess("");
        // Clean up the request form fields
        setReqCollegeName("");
        setReqCollegeLocation("");
        setReqCollegeNotes("");
        setReqCollegeEmail("");
        setReqCollegeAvatar("");
      }, 3500);
    } catch (err: any) {
      console.error("Failed to submit college request:", err);
      const errMsg = err?.message || "";
      if (errMsg.includes("duplicate key") || errMsg.includes("unique constraint") || errMsg.includes("applications_work_email_key")) {
        setError("Email already exists");
      } else {
        setError(errMsg || "Failed to submit college request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper action: send OTP code to student email
  const handleSendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      console.log(`Requesting sign-up OTP code for email: ${email}...`);
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          email: email,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to dispatch verification code.");

      setOtpToken(resData.token);
      setOtpSent(true);
      setOtpCode("");
      setOtpError("");
      console.log("Sign-up OTP code sent successfully!");
    } catch (err: any) {
      console.error("Failed to request sign-up OTP:", err);
      setError(err?.message || "Verification code could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper action: resend OTP code
  const handleResendOtp = async () => {
    setOtpResending(true);
    setOtpError("");
    try {
      console.log(`Resending sign-up OTP code to: ${email}...`);
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          email: email,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to resend code.");

      setOtpToken(resData.token);
      setOtpCode("");
      setSuccess("New verification code successfully sent!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend verification code.");
    } finally {
      setOtpResending(false);
    }
  };

  // Verification and final submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setOtpError("");

    if (!validateInputs()) return;

    // If SignUp is active and OTP hasn't been sent, trigger sending OTP first!
    if (view === "signup" && !otpSent) {
      await handleSendOtp();
      return;
    }

    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isMock = !supabaseUrl || supabaseUrl.includes("your_supabase_url");

    try {
      // --- SIGNUP OTP CODE CRYPTOGRAPHIC VERIFICATION STEP ---
      if (view === "signup") {
        if (otpCode.length !== 6) {
          setOtpError("Please enter a valid 6-digit code.");
          setLoading(false);
          return;
        }

        console.log(`Verifying OTP: ${otpCode} for email: ${email}...`);
        const verifyRes = await fetch("/api/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify",
            email: email,
            otp: otpCode,
            token: otpToken,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Invalid verification code.");
        }

        console.log("Email verified! Finalizing registration...");
      }

      if (isMock) {
        // --- MOCK MODE AUTHENTICATION HANDLER ---
        await new Promise((resolve) => setTimeout(resolve, 1200));

        if (view === "signup") {
          console.warn("Mock Auth Registration successful for", email);
          
          const mockProfile = {
            username: username.trim().toLowerCase(),
            full_name: "",
            avatar_url: "",
            bio: "",
            college_name: collegeName,
            year: "",
            branch: "",
            graduation_year: "",
            interests: [],
            instagram_url: null,
            linkedin_url: null,
            onboarding_completed: false,
          };

          if (typeof window !== "undefined") {
            sessionStorage.setItem("mock_user_session", "true");
            sessionStorage.setItem("mock_user_email", email);
            localStorage.setItem("techleaders_onboarded", "false");
            localStorage.setItem("mock_user_profile", JSON.stringify(mockProfile));
          }

          setSuccess("Email verified! Redirecting to setup wizard...");
          
          setTimeout(() => {
            window.location.href = `/onboarding?mock_login=true&email=${encodeURIComponent(email)}`;
          }, 1000);

        } else if (view === "login") {
          console.warn("Mock Auth Login successful for", email);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("mock_user_session", "true");
            sessionStorage.setItem("mock_user_email", email);
          }

          setSuccess("Logged in successfully! Redirecting...");

          setTimeout(() => {
            const localOnboarded = localStorage.getItem("techleaders_onboarded");
            if (localOnboarded === "true") {
              window.location.href = `/dashboard?mock_login=true&email=${encodeURIComponent(email)}`;
            } else {
              window.location.href = `/onboarding?mock_login=true&email=${encodeURIComponent(email)}`;
            }
          }, 1000);

        } else if (view === "forgot") {
          setSuccess("Password reset instructions sent (Mock Mode)!");
        }
        setLoading(false);
        return;
      }

      // --- LIVE SUPABASE AUTHENTICATION HANDLER ---
      if (view === "signup") {
        // 1. Sign up user via Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        const user = data.user;
        if (!user) throw new Error("Registration failed to retrieve user context.");

        // 2. Create the initial profile row with onboarding_completed = false
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            username: username.trim().toLowerCase(),
            full_name: "", 
            avatar_url: null,
            bio: null,
            college_name: collegeName,
            year: "", 
            branch: "", 
            graduation_year: null,
            interests: [],
            instagram_url: null,
            linkedin_url: null,
            onboarding_completed: false,
          });

        if (insertError) {
          console.error("Live profile initial insert failed:", insertError);
        }

        setSuccess("Email verified! Account successfully created.");

        setTimeout(() => {
          window.location.href = "/onboarding";
        }, 1200);

      } else if (view === "login") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        setSuccess("Logged in successfully! Loading...");

        const user = data.user;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("user_id", user.id)
            .maybeSingle();

          setTimeout(() => {
            if (profile && profile.onboarding_completed) {
              window.location.href = "/dashboard";
            } else {
              window.location.href = "/onboarding";
            }
          }, 800);
        }

      } else if (view === "forgot") {
        const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });

        if (resetError) throw resetError;

        setSuccess("Password reset instructions dispatched to your college email!");
      }
    } catch (err: any) {
      console.error(`Authentication process encountered an error in view: ${view}`, err);
      if (view === "signup" && otpSent) {
        setOtpError(err?.message || "Authentication process encountered an error.");
      } else {
        setError(err?.message || "Authentication process encountered an error.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#02040ae6] backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-[400px] bg-[#040815]/95 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden z-10 font-body public-page"
          >
            {/* Ambient Radial Accent */}
            <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-brand to-transparent" />

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

            {/* Header section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2.5 mx-auto">
                <LogoIcon className="text-white" size={24} />
                <span className="font-heading text-lg font-bold tracking-tight text-white select-none">
                  Campus<span className="text-blue-500 font-semibold">Circle</span>
                </span>
              </div>

              <h3 className="text-xl font-bold font-heading text-white tracking-tight mt-4">
                {view === "login" && "Welcome Back!"}
                {view === "signup" && (otpSent ? "Verify Email" : "Join Your Campus")}
                {view === "forgot" && "Reset Password"}
                {view === "request_college" && "Request Your College"}
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-normal max-w-[280px] mx-auto">
                {view === "login" && "Log in to connect with your college community circles."}
                {view === "signup" && (otpSent ? `Confirm verification code sent to ${email}` : "Create your account to unlock private student networks.")}
                {view === "forgot" && "Submit your email to receive recovery instructions."}
                {view === "request_college" && "Can't find your campus? Submit a request to the admin to add your college community."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* === REQUEST COLLEGE FORM VIEW === */}
              {view === "request_college" ? (
                <motion.div
                  key="request-college-screen"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 animate-fade-in text-left"
                >
                  {/* Your Email */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Email</label>
                    <input
                      type="email"
                      required
                      value={reqCollegeEmail}
                      onChange={(e) => setReqCollegeEmail(e.target.value)}
                      placeholder="you@college.edu"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                  </div>

                  {/* College Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College Name</label>
                    <input
                      type="text"
                      required
                      value={reqCollegeName}
                      onChange={(e) => setReqCollegeName(e.target.value)}
                      placeholder="e.g. Jawahar Lal University"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                  </div>

                  {/* Location (City, State) */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</label>
                    <input
                      type="text"
                      required
                      value={reqCollegeLocation}
                      onChange={(e) => setReqCollegeLocation(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                  </div>

                  {/* Additional Info / Notes (Optional) */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Additional Info</label>
                      <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={reqCollegeNotes}
                      onChange={(e) => setReqCollegeNotes(e.target.value)}
                      placeholder="e.g. Website URL or specific domain"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                  </div>



                  {/* Status messages alerts */}
                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl animate-fade-in text-left">
                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                      </p>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl animate-fade-in text-left">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {success}
                      </p>
                    </div>
                  )}

                  {/* Send Request Button */}
                  <button
                    type="button"
                    onClick={handleRequestCollegeSubmit}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Sending Request...</span>
                      </div>
                    ) : (
                      <span>Send Request</span>
                    )}
                  </button>

                  {/* Cancel / Back Button */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setView("signup");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-400 transition-colors focus:outline-none cursor-pointer"
                    >
                      &larr; Cancel & Go Back
                    </button>
                  </div>
                </motion.div>
              ) : view === "signup" && otpSent ? (
                <motion.div
                  key="otp-sent-screen"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 text-center animate-fade-in"
                >
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-300">6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setOtpCode(val);
                      }}
                      placeholder="000000"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-lg font-bold text-center tracking-[10px] text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body font-mono"
                    />
                    
                    {otpError && (
                      <p className="text-[11px] font-semibold text-red-400 mt-1 flex items-center justify-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {otpError}
                      </p>
                    )}
                  </div>

                  {success && (
                    <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl animate-fade-in text-left">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {success}
                      </p>
                    </div>
                  )}

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
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <span>Verify & Create Account</span>
                    )}
                  </button>

                  <div className="text-center pt-1.5">
                    <button
                      type="button"
                      disabled={otpResending}
                      onClick={handleResendOtp}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {otpResending ? "Resending code..." : "Resend code"}
                    </button>
                  </div>

                  <div className="text-center">
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
                </motion.div>
              ) : (
                /* === STANDARD FORMS VIEW (LOGIN, SIGNUP OR FORGOT) === */
                <div className="space-y-4 animate-fade-in">
                  
                  {/* College Email (Common for Login, Signup, Forgot) */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arjun@iitb.ac.in"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                    {emailError && <p className="text-[10px] text-red-400 font-medium mt-1">{emailError}</p>}
                  </div>

                  {/* SignUp Specific Fields (Username and College Name) */}
                  {view === "signup" && (
                    <div className="space-y-4">
                      
                      {/* College Name Search Autocomplete Dropdown */}
                      <div className="space-y-1.5 text-left" ref={collegeSearchRef}>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College Name</label>
                          {isCollegeSelected ? (
                            <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Select verified
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={collegeSearch}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCollegeSearch(val);
                              setIsCollegeSelected(false);
                              setCollegeDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setCollegeDropdownOpen(true);
                            }}
                            placeholder="Type to search e.g. IIT, NIT, GGV..."
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                          />
                          
                          {searchingColleges && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <svg className="animate-spin h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          )}

                          <AnimatePresence>
                            {collegeDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-y-auto max-h-[180px] z-30 divide-y divide-white/[0.02]"
                              >
                                {searchingColleges && collegeSuggestions.length === 0 ? (
                                  <div className="px-4 py-6 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-slate-400">Searching campuses...</span>
                                  </div>
                                ) : collegeSuggestions.length > 0 ? (
                                  collegeSuggestions.map((c: any, index) => (
                                    <button
                                      key={`${c.name}-${index}`}
                                      type="button"
                                      onClick={() => {
                                        setCollegeName(c.name);
                                        setCollegeSearch(c.name);
                                        setIsCollegeSelected(true);
                                        setCollegeDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-brand/10 transition-colors flex flex-col gap-0.5 group focus:outline-none"
                                    >
                                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                                        {c.name}
                                      </span>
                                      <span className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">
                                        {c.city}, {c.state}
                                      </span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-4 text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
                                    <p className="text-xs font-semibold">College not found</p>
                                    <p className="text-[9px] text-slate-600">Select from suggestions or request to add it.</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReqCollegeName(collegeSearch);
                                        setReqCollegeEmail(email);
                                        setView("request_college");
                                        setCollegeDropdownOpen(false);
                                        setError("");
                                        setSuccess("");
                                      }}
                                      className="mt-1 px-3 py-1.5 bg-brand hover:bg-brand-hover text-[10px] font-bold text-white rounded-lg shadow-md transition-all focus:outline-none cursor-pointer"
                                    >
                                      Request Your College
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Password Field (Conditional for Login & Signup) */}
                  {view !== "forgot" && (
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                        {view === "login" && (
                          <button
                            type="button"
                            onClick={() => setView("forgot")}
                            className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                          >
                            Forgot Password?
                      </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                        >
                          {showPassword ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {passwordError && <p className="text-[10px] text-red-400 font-medium mt-1">{passwordError}</p>}
                    </div>
                  )}

                  {/* Status messages alerts */}
                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl animate-fade-in text-left">
                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                      </p>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl animate-fade-in text-left">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {success}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || (view === "signup" && (usernameLoading || usernameAvailable === false))}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Please Wait...</span>
                      </div>
                    ) : (
                      <span>
                        {view === "login" && "Log In"}
                        {view === "signup" && "Register & Verify Email"}
                        {view === "forgot" && "Send Reset Link"}
                      </span>
                    )}
                  </button>
                </div>
              )}

            </form>

            {/* Modal Footer toggles */}
            {(!otpSent || view !== "signup") && (
              <div className="mt-6 pt-4 border-t border-white/[0.04] text-center text-xs text-slate-500">
                {view === "login" && (
                  <p>
                    New to the community?{" "}
                    <button
                      onClick={() => {
                        setView("signup");
                        setError("");
                        setSuccess("");
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                    >
                      Create an account
                    </button>
                  </p>
                )}

                {view === "signup" && (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setView("login");
                        setError("");
                        setSuccess("");
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                    >
                      Log in instead
                    </button>
                  </p>
                )}

                {view === "forgot" && (
                  <button
                    onClick={() => {
                      setView("login");
                      setError("");
                      setSuccess("");
                    }}
                    className="font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none flex items-center gap-1.5 mx-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Login</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
