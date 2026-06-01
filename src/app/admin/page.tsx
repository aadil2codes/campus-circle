"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon, VerifiedIcon, ArrowRightIcon } from "@/components/ui/Icons";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [gateError, setGateError] = useState("");

  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // 1. Session Password check to feel frictionless
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authState = sessionStorage.getItem("techleaders_admin_auth");
      const savedPassword = sessionStorage.getItem("techleaders_admin_password");
      if (authState === "true" && savedPassword) {
        setIsAuthenticated(true);
      } else {
        // Clean up in case of inconsistent state
        sessionStorage.removeItem("techleaders_admin_auth");
        sessionStorage.removeItem("techleaders_admin_password");
        setIsAuthenticated(false);
      }
    }
  }, []);

  // Fetch pending applications
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    setIsLoading(true);
    setActionError("");
    try {
      const savedPassword = sessionStorage.getItem("techleaders_admin_password") || "";
      const res = await fetch("/api/applications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${savedPassword}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        throw new Error("Session expired or unauthorized. Please log in again.");
      }

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to load applications.");

      setApplications(resData.data || []);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setActionError(err.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Gate Verification (Client calls secure API using password to verify and fetch)
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/applications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });

      if (res.status === 401) {
        setGateError("Invalid administrator key. Access denied.");
        return;
      }

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Authentication failed.");

      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("techleaders_admin_auth", "true");
        sessionStorage.setItem("techleaders_admin_password", password);
      }
      setApplications(resData.data || []);
    } catch (err: any) {
      console.error("Authentication failed:", err);
      setGateError(err.message || "Could not verify credentials. Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout admin
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setApplications([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("techleaders_admin_auth");
      sessionStorage.removeItem("techleaders_admin_password");
    }
  };

  // 3. Approve Action: updates DB, fires webhook, generates Magic Link, emails Welcome Alert
  const handleApprove = async (app: any) => {
    setActionLoadingId(app.id);
    setActionError("");
    try {
      const savedPassword = sessionStorage.getItem("techleaders_admin_password") || "";
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${savedPassword}`,
        },
        body: JSON.stringify({
          id: app.id,
          email: app.work_email,
          name: app.full_name,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to complete approval.");

      console.log("Member successfully approved:", resData);

      // Remove approved item from state table smoothly
      setApplications((prev) => prev.filter((item) => item.id !== app.id));
    } catch (err: any) {
      console.error("Approval flow failed:", err);
      setActionError(err.message || "Approval process encountered an error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Reject Action: updates DB status to 'rejected' securely via server-side PATCH
  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    setActionError("");
    try {
      const savedPassword = sessionStorage.getItem("techleaders_admin_password") || "";
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${savedPassword}`,
        },
        body: JSON.stringify({
          id,
          status: "rejected",
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to reject application.");

      console.log("Member successfully rejected:", resData);

      // Remove rejected item from state table smoothly
      setApplications((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Rejection flow failed:", err);
      setActionError(err.message || "Failed to reject application.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-navy-deep text-slate-100 font-body select-none">
      {/* Visual background accents */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-white/[0.04] bg-[#02040ae6] backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LogoIcon className="text-white" size={24} />
              <span className="font-heading text-base font-bold tracking-tight text-white">
                Campus<span className="text-blue-500 font-semibold">Circle</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/[0.05] text-slate-400 font-bold select-none ml-2 tracking-wider uppercase">
                Admin
              </span>
            </div>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 bg-[#02040a]/40 hover:bg-slate-900/60 px-3.5 py-1.5 rounded-lg transition-all"
              >
                Secure Lockout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {!isAuthenticated ? (
            
            // GATE SCREEN: PASSWORD PROTECTION CARD
            <motion.div
              key="gate-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-[420px] glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl border-white/[0.06] text-center"
            >
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                CampusCircle Administration
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-normal max-w-[280px] mx-auto">
                Authorized entry required. Please submit your secure lockout key.
              </p>

              <form onSubmit={handleVerifyPassword} className="mt-8 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security Key</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body text-center"
                  />
                </div>

                {gateError && (
                  <p className="text-[11px] font-semibold text-red-400 animate-pulse text-center">
                    {gateError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3 text-xs font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.25)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Enter Dashboard
                </button>
              </form>
            </motion.div>
          ) : (
            
            // ADMIN DASHBOARD SCREEN: MANAGE APPLICATIONS
            <motion.div
              key="dashboard-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col animate-fade-in"
            >
              {/* Header Title Grid */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
                    Pending Campus Applications
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-normal mt-1">
                    Review student application details and approve access.
                  </p>
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Pending Requests ({applications.length})</span>
                </div>
              </div>

              {/* Error Alerts */}
              {actionError && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-xs font-semibold text-red-400">{actionError}</p>
                </div>
              )}

              {/* Table Wrapper */}
              <div className="glass-panel rounded-2xl border-white/[0.06] shadow-2xl overflow-hidden w-full">
                
                {isLoading ? (
                  
                  // TABLE LOADING STATE
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Syncing Applications Database...</p>
                  </div>
                ) : applications.length === 0 ? (
                  
                  // TABLE EMPTY STATE
                  <div className="py-24 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/[0.05] flex items-center justify-center mx-auto mb-4">
                      <VerifiedIcon size={20} className="text-slate-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">Inbox fully cleared</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">No pending founding membership requests need review.</p>
                  </div>
                ) : (
                  
                  // TABLE CONTAINER
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.04] bg-[#030610]/60">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Applicant Details</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">College & Branch Context</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Social Profile</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Administrative Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence initial={false}>
                          {applications.map((app) => (
                            <motion.tr
                              key={app.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, x: -30, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors"
                            >
                              {/* Applicant Details */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {app.linkedin_url && app.linkedin_url.startsWith("http") && (app.linkedin_url.includes("avatar") || app.linkedin_url.includes("image") || app.linkedin_url.includes("photo") || app.linkedin_url.includes("google") || app.linkedin_url.includes("lh3") || app.linkedin_url.endsWith(".png") || app.linkedin_url.endsWith(".jpg") || app.linkedin_url.endsWith(".jpeg") || app.linkedin_url.endsWith(".webp") || app.full_name === "College Addition Request") ? (
                                    <img 
                                      src={app.linkedin_url} 
                                      alt="Avatar" 
                                      onError={(e) => {
                                        // Hide broken image placeholder
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                      className="w-9 h-9 rounded-full border border-white/[0.08] object-cover bg-slate-900/60 shrink-0"
                                    />
                                  ) : null}
                                  <div>
                                    <p className="text-sm font-bold text-white font-heading">{app.full_name}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5"><a href={`mailto:${app.work_email}`} className="hover:text-blue-400 transition-colors">{app.work_email}</a></p>
                                  </div>
                                </div>
                              </td>
                              
                              {/* College & Branch Context */}
                              <td className="px-6 py-4">
                                <p className="text-xs font-semibold text-slate-200">{app.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{app.company_name} · {app.company_size}</p>
                              </td>
                              
                              {/* LinkedIn Profile */}
                              <td className="px-6 py-4">
                                <a
                                  href={app.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold group transition-colors"
                                >
                                  <span>View Profile</span>
                                  <svg className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                </a>
                              </td>
                              
                              {/* Status */}
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                                  {app.status}
                                </span>
                              </td>
                              
                              {/* Actions */}
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleReject(app.id)}
                                    disabled={actionLoadingId !== null}
                                    className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/40 text-[11px] font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    {actionLoadingId === app.id ? "..." : "Reject"}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleApprove(app)}
                                    disabled={actionLoadingId !== null}
                                    className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-[11px] font-bold text-white shadow-md hover:shadow-[0_0_10px_rgba(24,95,165,0.25)] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    {actionLoadingId === app.id ? (
                                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : null}
                                    <span>Approve</span>
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
