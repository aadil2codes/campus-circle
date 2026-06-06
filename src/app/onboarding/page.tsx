"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { VerifiedIcon, LogoIcon, SparklesIcon, UsersIcon, LayersIcon } from "@/components/ui/Icons";

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live session states
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isMockLogin, setIsMockLogin] = useState(false);

  // STEP 2: Basic Info
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState(""); // Locked (prefilled from DB)
  const [bio, setBio] = useState(""); // Optional

  // STEP 3: College Details
  const [collegeName, setCollegeName] = useState("");
  const [course, setCourse] = useState(""); // Required
  const [year, setYear] = useState(""); // Required
  const [branch, setBranch] = useState(""); // Required
  const [gradYear, setGradYear] = useState(""); // Required
  const [showCourseSelect, setShowCourseSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [showGradYearSelect, setShowGradYearSelect] = useState(false);

  // STEP 3 additions: College Autocomplete
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeSuggestions, setCollegeSuggestions] = useState<any[]>([]);
  const [isCollegeSelected, setIsCollegeSelected] = useState(false);
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [searchingColleges, setSearchingColleges] = useState(false);

  // STEP 4: DP Upload (Recommended - Skippable)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  // STEP 5: Interests & Socials (Optional - Skippable)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const courseSelectRef = useRef<HTMLDivElement>(null);
  const yearSelectRef = useRef<HTMLDivElement>(null);
  const branchSelectRef = useRef<HTMLDivElement>(null);
  const gradYearSelectRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const collegeSearchRef = useRef<HTMLDivElement>(null);

  const courses = ["B.Tech", "M.Tech", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "B.Com", "M.Com", "PhD"];
  const courseBranches: Record<string, string[]> = {
    "B.Tech": ["Computer Science (CSE)", "Electronics (ECE)", "Information Technology (IT)", "Mechanical", "Civil", "Electrical", "Chemical", "Biotechnology", "Aerospace"],
    "M.Tech": ["Computer Science (CSE)", "VLSI Design", "Software Engineering", "Mechanical", "Electrical Power Systems", "Structural Engineering"],
    "BCA": ["Computer Applications", "Data Science", "Cloud Computing", "Cyber Security"],
    "MCA": ["Software Development", "Data Science", "Mobile Applications", "AI & Machine Learning"],
    "BBA": ["General Management", "Finance", "Marketing", "Human Resources"],
    "MBA": ["Finance", "Marketing", "Human Resources", "Operations", "Information Technology", "International Business"],
    "B.Sc": ["Physics", "Chemistry", "Mathematics", "Computer Science", "Biotechnology", "Microbiology"],
    "M.Sc": ["Physics", "Chemistry", "Mathematics", "Computer Science", "Information Technology", "Biotechnology"],
    "B.Com": ["General Accounts", "Taxation", "Banking & Insurance", "Honors"],
    "M.Com": ["Accounts & Finance", "Business Management", "Banking"],
    "PhD": ["Computer Science", "Engineering Research", "Basic Sciences", "Management Studies", "Humanities"]
  };

  const years = ["1st Year", "2nd Year", "3rd Year", "Final Year", "Alumni"];
  const graduationYears = ["2026", "2027", "2028", "2029", "2030"];
  const interestsList = [
    "Coding",
    "Startups",
    "AI",
    "Placements",
    "Design",
    "Gaming",
    "Hackathons",
    "Freelancing",
    "Content Creation",
    "Competitive Programming"
  ];

  // Load active session (live Supabase or mock parameters)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mock = urlParams.get("mock_login") === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;
      const email = urlParams.get("email") || sessionStorage.getItem("mock_user_email") || "";

      if (mock) {
        setIsMockLogin(true);
        setUserId("mock-user-id");
        setUserEmail(email || "student@campus.edu");
        
        // Load existing mock profile if it exists
        const mockProfileStr = localStorage.getItem("mock_user_profile");
        if (mockProfileStr) {
          try {
            const profile = JSON.parse(mockProfileStr);
            setUsername(profile.username || "student");
            const cName = profile.college_name || "IIT Bombay";
            setCollegeName(cName);
            setCollegeSearch(cName);
            setIsCollegeSelected(true);
          } catch (e) {
            setCollegeName("IIT Bombay");
            setCollegeSearch("IIT Bombay");
            setIsCollegeSelected(true);
            setUsername("student");
          }
        } else {
          setCollegeName("IIT Bombay");
          setCollegeSearch("IIT Bombay");
          setIsCollegeSelected(true);
          setUsername("student");
        }
      } else {
        fetchLiveSession();
      }
    }
  }, []);

  const fetchLiveSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || "");

        // Prefill username and college name from their newly registered profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile) {
          const cName = profile.college_name || "";
          setCollegeName(cName);
          setCollegeSearch(cName);
          if (cName) setIsCollegeSelected(true);
          setUsername(profile.username || "");
          if (profile.full_name && profile.full_name !== "College Addition Request") {
            setFullName(profile.full_name);
          }
        } else {
          // Fallback to application parameters
          const { data: app } = await supabase
            .from("applications")
            .select("company_name, full_name")
            .eq("work_email", session.user.email)
            .maybeSingle();

          if (app) {
            const cName = app.company_name;
            setCollegeName(cName);
            setCollegeSearch(cName);
            if (cName) setIsCollegeSelected(true);
            if (app.full_name && app.full_name !== "College Addition Request") {
              setFullName(app.full_name);
            }
          }
        }
      } else {
        // Not logged in, forward to home
        window.location.href = "/";
      }
    } catch (err) {
      console.warn("Live session fetch bypassed or unconfigured.");
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (courseSelectRef.current && !courseSelectRef.current.contains(event.target as Node)) {
        setShowCourseSelect(false);
      }
      if (yearSelectRef.current && !yearSelectRef.current.contains(event.target as Node)) {
        setShowYearSelect(false);
      }
      if (branchSelectRef.current && !branchSelectRef.current.contains(event.target as Node)) {
        setShowBranchSelect(false);
      }
      if (gradYearSelectRef.current && !gradYearSelectRef.current.contains(event.target as Node)) {
        setShowGradYearSelect(false);
      }
      if (collegeSearchRef.current && !collegeSearchRef.current.contains(event.target as Node)) {
        setCollegeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when search input changes
  useEffect(() => {
    if (isCollegeSelected) {
      setCollegeSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      if (!collegeSearch.trim()) {
        setCollegeSuggestions([]);
        return;
      }
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
    }, 200); // 200ms debounce

    return () => clearTimeout(handler);
  }, [collegeSearch, isCollegeSelected]);

  // Client-Side Canvas Image Compression Handler
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using Canvas down to 250px x 250px JPEG at 0.75 quality
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 250;
        
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setAvatarUrl(compressedBase64);
        setImageLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleNextStep = () => {
    setError("");
    if (step === 2) {
      if (!fullName) {
        setError("Full Name is required.");
        return;
      }
    }
    if (step === 3) {
      if (!collegeName || !isCollegeSelected) {
        setError("Please search and select a verified college from the suggestions dropdown.");
        return;
      }
      if (!course || !year || !branch || !gradYear) {
        setError("Course, year, branch, and graduation year are required.");
        return;
      }
    }
    setStep((prev) => (prev + 1) as OnboardingStep);
  };

  const handlePrevStep = () => {
    setError("");
    setStep((prev) => (prev - 1) as OnboardingStep);
  };

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  const handleSubmitProfile = async () => {
    setError("");
    setLoading(true);
    setStep(6);

    try {
      if (!username.trim()) {
        setError("Username is required.");
        setLoading(false);
        setStep(5);
        return;
      }

      if (!fullName.trim()) {
        setError("Full Name is required.");
        setLoading(false);
        setStep(5);
        return;
      }

      if (!collegeName || !isCollegeSelected) {
        setError("Please search and select a verified college from the suggestions dropdown.");
        setLoading(false);
        setStep(5);
        return;
      }

      if (isMockLogin) {
        // --- MOCK MODE: UPDATE PROFILE IN LOCALSTORAGE ---
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockProfile = {
          username: username.trim().toLowerCase(),
          full_name: fullName,
          avatar_url: avatarUrl,
          bio,
          college_name: collegeName,
          year,
          branch: course ? `${course} - ${branch}` : branch,
          graduation_year: gradYear,
          interests: selectedTags,
          instagram_url: instagramUrl || null,
          linkedin_url: linkedinUrl || null,
          github_url: githubUrl || null,
          onboarding_completed: true,
          created_at: new Date().toISOString()
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("techleaders_onboarded", "true");
          localStorage.setItem("mock_user_profile", JSON.stringify(mockProfile));
          localStorage.setItem("techleaders_joined_communities", "{}");
        }

        window.location.href = `/dashboard?mock_login=true&email=${encodeURIComponent(userEmail)}`;
        return;
      }

      if (!userId) {
        throw new Error("Active user session not found. Please log in again.");
      }

      // --- LIVE SUPABASE: UPSERT PROFILE ROW (inserts if missing, updates if exists) ---
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          username: username.trim().toLowerCase(),
          full_name: fullName,
          avatar_url: avatarUrl || null,
          bio: bio || null,
          college_name: collegeName,
          year,
          branch: course ? `${course} - ${branch}` : branch,
          graduation_year: gradYear,
          interests: selectedTags,
          instagram_url: instagramUrl || null,
          linkedin_url: linkedinUrl || null,
          github_url: githubUrl || null,
          onboarding_completed: true,
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error("Supabase profile update failed:", updateError);
        throw updateError;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("techleaders_joined_communities", "{}");
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Completing onboarding failed:", err);
      setError(err?.message || "Failed to finalize profile setup. Please try again.");
      setLoading(false);
      setStep(5);
    }
  };

  // Render Fallback Initials Avatar
  const renderInitials = () => {
    const initials = fullName
      ? fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
      : "CC";
    return (
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand/60 to-blue-600/40 flex items-center justify-center border-2 border-white/10 text-white font-heading font-extrabold text-2xl shadow-inner select-none">
        {initials}
      </div>
    );
  };

  // Step transition variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };


  return (
    <div className="relative min-h-screen flex flex-col bg-navy-deep text-slate-100 font-body items-center justify-center p-4 overflow-hidden public-page">
      {/* Locked Background Glows to Prevent Bottom Gap and Layout Bleeds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[50vw] h-[50vw] bg-brand/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[45vw] h-[45vw] bg-blue-900/5 rounded-full blur-[120px]" />
      </div>

      {/* Main Container box */}
      <div className="w-full max-w-[520px] relative z-10 flex flex-col items-center">
        
        {/* Progress indicator */}
        {step < 6 && (
          <div className="w-full max-w-[420px] flex items-center justify-between px-2 mb-6 text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Profile Setup</span>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((s) => (
                <div
                  key={s}
                  className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-brand shadow-[0_0_8px_rgba(24,95,165,0.4)]" : "bg-white/[0.04]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl border-white/[0.06] min-h-[480px] flex flex-col justify-between relative bg-card-glow">
          
          {/* Card neon strip */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

          <AnimatePresence mode="wait" custom={step}>
            
            {/* STEP 1: WELCOME SCREEN */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-8 shadow-inner select-none animate-pulse-slow">
                    <LogoIcon className="text-blue-400" size={32} />
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-4">
                    <VerifiedIcon size={12} />
                    <span>Private Campus Network</span>
                  </div>

                  <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight leading-tight">
                    Welcome to CircleNet
                  </h2>
                  <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Your email is verified! Now let's set up your custom identity inside your college campus network. It takes less than two minutes.
                  </p>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-6"
                >
                  Create My Profile
                </button>
              </motion.div>
            )}

            {/* STEP 2: BASIC INFO (FULL NAME - REQUIRED, BIO - OPTIONAL) */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between animate-fade-in"
              >
                <div className="space-y-4 text-left">
                  <div>
                    <h3 className="text-xl font-bold font-heading text-white tracking-tight">Basic Profile Info</h3>
                    <p className="text-xs text-slate-400 mt-1">Set up your displayed name and profile biography.</p>
                  </div>

                  {/* 1. Username (Fully Editable) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Username</label>
                      <span className="text-[10px] text-brand font-bold uppercase">Required</span>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm font-heading select-none">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                        placeholder="username"
                        className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body font-semibold tracking-wide"
                      />
                    </div>
                  </div>

                  {/* 2. Full Name input (Required) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Full Name</label>
                      <span className="text-[10px] text-brand font-bold uppercase">Required</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Arjun Mehta"
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                  </div>

                  {/* 3. Biography textarea (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Bio</label>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Optional</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell the community about your current study focus, coding track, clubs, or placement prep interests..."
                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                      <p className="text-xs font-semibold text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: COLLEGE INFO (YEAR, BRANCH, GRAD YEAR - REQUIRED) */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4 text-left">
                  <div>
                    <h3 className="text-xl font-bold font-heading text-white tracking-tight">College Coordinates</h3>
                    <p className="text-xs text-slate-400 mt-1">Specify your verified academic details.</p>
                  </div>

                  {/* College Name (Locked / Non-Changeable) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">College Name</label>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Verified Selection
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={collegeSearch}
                        className="w-full bg-[#040815]/40 border border-white/[0.04] rounded-xl px-4 py-3 text-sm text-slate-500 font-body font-semibold tracking-wide cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Course & Year Row (Required selectors) */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Course Dropdown */}
                    <div className="space-y-1.5" ref={courseSelectRef}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Course</label>
                        <span className="text-[9px] text-brand font-bold uppercase">Req</span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCourseSelect(!showCourseSelect)}
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-xs sm:text-sm text-left text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all flex items-center justify-between"
                        >
                          <span className={course ? "text-white" : "text-slate-600"}>
                            {course || "Select Course"}
                          </span>
                          <svg className={`w-4 h-4 text-slate-500 transition-transform ${showCourseSelect ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <AnimatePresence>
                          {showCourseSelect && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-0 right-0 mt-1 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-y-auto max-h-[160px] z-20"
                            >
                              {courses.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setCourse(c);
                                    setBranch(""); // Reset branch on course change
                                    setShowCourseSelect(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-300 hover:bg-brand/10 hover:text-white transition-colors"
                                >
                                  {c}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Year Dropdown */}
                    <div className="space-y-1.5" ref={yearSelectRef}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Year</label>
                        <span className="text-[9px] text-brand font-bold uppercase">Req</span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowYearSelect(!showYearSelect)}
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-xs sm:text-sm text-left text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all flex items-center justify-between"
                        >
                          <span className={year ? "text-white" : "text-slate-600"}>
                            {year || "Select Year"}
                          </span>
                          <svg className={`w-4 h-4 text-slate-500 transition-transform ${showYearSelect ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <AnimatePresence>
                          {showYearSelect && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-0 right-0 mt-1 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-20"
                            >
                              {years.map((y) => (
                                <button
                                  key={y}
                                  type="button"
                                  onClick={() => {
                                    setYear(y);
                                    setShowYearSelect(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-300 hover:bg-brand/10 hover:text-white transition-colors"
                                >
                                  {y}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                  </div>

                  {/* Branch & Graduation Year Row (Required selectors) */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* Branch Dropdown */}
                    <div className="space-y-1.5" ref={branchSelectRef}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Branch</label>
                        <span className="text-[9px] text-brand font-bold uppercase">Req</span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!course}
                          onClick={() => setShowBranchSelect(!showBranchSelect)}
                          className={`w-full border px-4 py-3 text-xs sm:text-sm text-left transition-all flex items-center justify-between rounded-xl ${
                            course 
                              ? "bg-[#040815]/80 border-white/[0.06] text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40" 
                              : "bg-[#040815]/30 border-white/[0.03] text-slate-600 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span className={branch ? "text-white" : "text-slate-600"}>
                            {course 
                              ? (branch || "Select Branch") 
                              : "Select Course First"}
                          </span>
                          {course && (
                            <svg className={`w-4 h-4 text-slate-500 transition-transform ${showBranchSelect ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>

                        <AnimatePresence>
                          {showBranchSelect && course && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-0 right-0 mt-1 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-y-auto max-h-[160px] z-20"
                            >
                              {(courseBranches[course] || []).map((b) => (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => {
                                    setBranch(b);
                                    setShowBranchSelect(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-300 hover:bg-brand/10 hover:text-white transition-colors"
                                >
                                  {b}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Graduation Year dropdown (Required) */}
                    <div className="space-y-1.5" ref={gradYearSelectRef}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Graduation Year</label>
                        <span className="text-[10px] text-brand font-bold uppercase">Required</span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowGradYearSelect(!showGradYearSelect)}
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-xs sm:text-sm text-left text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all flex items-center justify-between"
                        >
                          <span className={gradYear ? "text-white" : "text-slate-600"}>
                            {gradYear || "Select Year"}
                          </span>
                          <svg className={`w-4 h-4 text-slate-500 transition-transform ${showGradYearSelect ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <AnimatePresence>
                          {showGradYearSelect && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-0 right-0 mt-1 bg-[#050b1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-20"
                            >
                              {graduationYears.map((gy) => (
                                <button
                                  key={gy}
                                  type="button"
                                  onClick={() => {
                                    setGradYear(gy);
                                    setShowGradYearSelect(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-300 hover:bg-brand/10 hover:text-white transition-colors"
                                >
                                  {gy}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                      <p className="text-xs font-semibold text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PROFILE PICTURE UPLOAD (RECOMMENDED - SKIPPABLE) */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between animate-fade-in"
              >
                <div className="space-y-4 text-center">
                  <div className="text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-heading text-white tracking-tight">Profile Picture</h3>
                      <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Recommended</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Upload a face avatar so batchmates recognize you, or skip to finish later.</p>
                  </div>

                  {/* DP preview window frame */}
                  <div className="relative w-28 h-28 mx-auto my-8">
                    {imageLoading ? (
                      <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center mx-auto shadow-inner">
                        <svg className="animate-spin h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : avatarUrl ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand/50 mx-auto shadow-lg relative group">
                        <img src={avatarUrl} alt="Compressed Avatar Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          className="absolute inset-0 bg-[#000000a6] text-red-400 font-semibold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      renderInitials()
                    )}

                    {/* Verified badge placement */}
                    <div className="absolute bottom-1 right-2">
                      <VerifiedIcon size={22} className="shadow-2xl" />
                    </div>
                  </div>

                  {/* Dropzone container */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/[0.08] hover:border-brand/40 bg-[#040815]/50 hover:bg-[#070e24]/40 rounded-2xl p-6 cursor-pointer transition-all duration-300 max-w-sm mx-auto group"
                  >
                    <svg className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors mx-auto mb-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-xs font-semibold text-slate-300">Click or Drag photo here</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Supports JPEG / PNG (Max 5MB)</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={imageLoading}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {avatarUrl ? "Continue" : "Skip & Continue"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: INTERESTS GRID & OPTIONAL SOCIALS (INTERESTS - OPTIONAL, SOCIALS - OPTIONAL) */}
            {step === 5 && (
              <motion.div
                key="step5"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4 text-left">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-heading text-white tracking-tight">Interests & Socials</h3>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Optional</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Select topics you are interested in and add your socials (all skippable).</p>
                  </div>

                  {/* Interests selectors */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Select Interests (Optional)</label>
                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {interestsList.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-brand/15 border-brand/50 text-blue-400 shadow-[0_0_10px_rgba(24,95,165,0.15)]"
                                : "bg-[#040815]/60 border-white/[0.04] text-slate-400 hover:border-white/[0.08] hover:text-slate-200"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Social inputs */}
                  <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Social Links (Optional)</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-400">Instagram Username</label>
                        <input
                          type="text"
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value.replace(/\s/g, ""))}
                          placeholder="instagram.com/handle"
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all"
                        />
                      </div>

                      {/* Github */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-400">GitHub Profile</label>
                        <input
                          type="text"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value.replace(/\s/g, ""))}
                          placeholder="github.com/handle"
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all"
                        />
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">LinkedIn Profile Link</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/handle"
                        className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                      <p className="text-xs font-semibold text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitProfile}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Complete Setup"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: SETUP COMPLETE LOADER PANEL */}
            {step === 6 && (
              <motion.div
                key="step6"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-10"
              >
                <div className="py-8 flex flex-col items-center justify-center gap-6">
                  <svg className="animate-spin h-10 w-10 text-brand" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-200 font-heading">Finalizing Campus Account...</h4>
                    <p className="text-xs text-slate-500 leading-normal max-w-[220px] mx-auto">Configuring your personal student circles and opening channels.</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
