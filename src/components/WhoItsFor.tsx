"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Users, ArrowRight, Sparkles, GraduationCap } from "lucide-react";

interface CollegeRecord {
  name: string;
  city: string;
  state: string;
}

export default function WhoItsFor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CollegeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock Session check to preserve state for local testing
  const [isMock, setIsMock] = useState(false);
  const [mockEmail, setMockEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMock(sessionStorage.getItem("mock_user_session") === "true");
      setMockEmail(sessionStorage.getItem("mock_user_email") || "");
    }
  }, []);

  const getCommunityUrl = (collegeName: string) => {
    const slug = collegeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    return `/community/${slug}${isMock ? `?mock_login=true&email=${encodeURIComponent(mockEmail)}` : ""}`;
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions as query changes
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/colleges?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Failed to fetch college suggestions:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const featuredCommunities = [
    {
      name: "BITS Pilani",
      location: "Pilani, Rajasthan",
      members: "1,240 students",
      description: "The private network for BITSians to share placement roadmaps, DSA guides, and collaborate on hackathons.",
      gradient: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
      accent: "bg-blue-500",
    },
    {
      name: "IIT Bombay",
      location: "Mumbai, Maharashtra",
      members: "2,150 students",
      description: "Connect with IITB students and alumni at Google, Microsoft, and startups. Share resources and prepare for tech drives.",
      gradient: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
      accent: "bg-purple-500",
    },
    {
      name: "Delhi Technological University (DTU)",
      location: "New Delhi, Delhi",
      members: "1,890 students",
      description: "The central hub for DTU students. Swap notes, verify semester exam question banks, and join campus clubs.",
      gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
      accent: "bg-emerald-500",
    },
    {
      name: "NIT Trichy",
      location: "Tiruchirappalli, Tamil Nadu",
      members: "1,120 students",
      description: "Connect with NIT Trichy peers. Collaborate on inter-college tech fests and discover internship referrals.",
      gradient: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
      accent: "bg-amber-500",
    },
    {
      name: "VIT Vellore",
      location: "Vellore, Tamil Nadu",
      members: "3,400 students",
      description: "The ultimate developer community for VITians. Join LeetCode study circles and prepare for coding rounds.",
      gradient: "from-rose-500/10 to-red-500/10 border-rose-500/20",
      accent: "bg-rose-500",
    },
    {
      name: "NSUT Delhi",
      location: "New Delhi, Delhi",
      members: "1,450 students",
      description: "Private networking space for Netaji Subhas University of Technology students. Join hackathon teams and interview circles.",
      gradient: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20",
      accent: "bg-cyan-500",
    },
  ];

  return (
    <section id="community" className="py-20 md:py-28 relative bg-[var(--bg)]">
      {/* Background Soft Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-normal text-[var(--text)] font-heading">
              Explore Verified Campus Communities
            </h2>
            <p className="mt-4 text-base md:text-lg text-[var(--text-muted)] font-body leading-relaxed max-w-2xl mx-auto">
              Find your college or explore other active private networks connecting tech students, seniors, and alumni across India.
            </p>
          </motion.div>
        </div>

        {/* Live Search Bar Component */}
        <div className="max-w-xl mx-auto mb-16 relative" ref={dropdownRef}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors duration-200" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search 1,000+ verified Indian engineering colleges..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl pl-12 pr-10 py-4 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 transition-all font-body shadow-lg shadow-[var(--primary)]/5"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          {/* Search Dropdown Suggestions */}
          <AnimatePresence>
            {dropdownOpen && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-y-auto max-h-[260px] z-50 divide-y divide-[var(--border)]/30"
              >
                {suggestions.length > 0 ? (
                  suggestions.map((c, index) => (
                    <a
                      key={`${c.name}-${index}`}
                      href={getCommunityUrl(c.name)}
                      className="w-full text-left px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between group focus:outline-none"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                          {c.name}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.city}, {c.state}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </a>
                  ))
                ) : (
                  <div className="px-5 py-6 text-center text-[var(--text-muted)]">
                    <GraduationCap className="w-8 h-8 text-[var(--text-muted)] opacity-60 mx-auto mb-2" />
                    <p className="text-sm font-semibold">College not found</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Please enter a valid verified institute name.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Featured Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {featuredCommunities.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`p-6 sm:p-8 rounded-3xl border bg-gradient-to-br ${item.gradient} bg-[var(--surface)] hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300 flex flex-col justify-between group`}
            >
              <div>
                {/* Badge with initials */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-10 h-10 rounded-xl ${item.accent}/10 flex items-center justify-center text-sm font-extrabold text-white group-hover:scale-105 transition-all duration-300 font-heading select-none`}>
                    <div className={`w-6 h-6 rounded-lg ${item.accent} flex items-center justify-center shadow-lg shadow-[var(--primary)]/10`}>
                      {item.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] select-none">
                    <Users className="w-3.5 h-3.5" />
                    <span>{item.members}</span>
                  </div>
                </div>

                {/* College Title */}
                <h3 className="text-lg font-semibold font-heading text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  {item.name}
                </h3>
                
                {/* Location */}
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1 font-body">
                  <MapPin className="w-3 h-3 opacity-80" />
                  {item.location}
                </p>

                {/* Description */}
                <p className="mt-4 text-xs sm:text-sm text-[var(--text-muted)] font-body leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-5 border-t border-[var(--border)]/20">
                <a
                  href={getCommunityUrl(item.name)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors group/btn"
                >
                  Explore Community
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
