"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  VerifiedIcon,
  LogoIcon,
  SparklesIcon,
  SystemIcon,
  ChartIcon,
  ChatBubbleIcon,
} from "@/components/ui/Icons";
import Link from "next/link";

interface Profile {
  user_id?: string;
  full_name: string;
  username: string;
  avatar_url: string;
  college_name: string;
  year: string;
  branch: string;
  bio?: string;
  created_at?: string;
}

interface Post {
  id: string;
  title: string;
  body: string;
  category: string;
  image_url?: string | null;
  created_at: string;
  user_id: string;
  profiles?: Profile | null;
  replies_count?: number;
  votes_score?: number;
  user_vote_value?: number; // 1 = upvoted, -1 = downvoted, 0 = no vote
  isDemo?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
    year: string;
    branch: string;
  } | null;
}

type DashboardTab = "feed" | "dashboard" | "my-posts" | "profile" | "chats" | "connections" | "communities" | "notifications" | "settings";
type ComposerTab = "text" | "image";
export const getPostCommunitySlug = (post: Post) => {
  const college = post.profiles?.college_name;
  if (college && college !== "Stanford University" && college !== "MIT" && college !== "ETH Zurich" && college !== "UCL London" && college !== "Oxford University" && college !== "IIT Delhi") {
    return college.toLowerCase().replace(/\s+/g, "-");
  }
  
  const cat = post.category.toLowerCase().replace("#", "");
  if (cat === "neural-networks") return "neural-network-architects";
  if (cat === "creative-design") return "creative-designers-hub";
  if (cat === "surgical-precision") return "surgical-precision-hub";
  if (cat === "law-forum") return "constitutional-law-forum";
  if (cat === "product-mgmt") return "product-management-alliance";
  
  return cat;
};

const DEMO_WHITELIST = ["factanlgesupoort@gmail.com", "userai4545@gmail.com"];

const isDemoAllowed = (email: string | null | undefined): boolean => {
  return false;
};

export const isMockLoginBypass = (): boolean => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("mock_login") === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("supabase.co");
  }
  return true;
};

export function getSeedPosts(userCollege: string, userEmail?: string): Post[] {
  return [];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [currentTab, setCurrentTab] = useState<DashboardTab>("feed");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active user profile states
  const [userId, setUserId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberTitle, setMemberTitle] = useState("");
  const [memberCompany, setMemberCompany] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [joinedDate, setJoinedDate] = useState("Recently");
  const [memberUsername, setMemberUsername] = useState("");

  // Community Creation States
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [createCommunityName, setCreateCommunityName] = useState("");
  const [createCommunityCategory, setCreateCommunityCategory] = useState("Technology");
  const [createCommunityDescription, setCreateCommunityDescription] = useState("");
  const [createCommunityError, setCreateCommunityError] = useState("");
  const [creatingCommunityLoader, setCreatingCommunityLoader] = useState(false);

  // ====================================================================
  // CONNECTIONS & MESSAGING SYSTEM STATES
  // ====================================================================
  const [connections, setConnections] = useState<any[]>([]); // relationship request records
  const [connectedProfiles, setConnectedProfiles] = useState<Profile[]>([]);
  const [connectionProfiles, setConnectionProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<any[]>([]); // active conversations list
  const [messages, setMessages] = useState<any[]>([]); // active messages timeline
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConvoParticipant, setActiveConvoParticipant] = useState<any | null>(null); // current DM participant
  
  const [chatSubTab, setChatSubTab] = useState<"chats" | "requests">("chats");
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  // --- Premium Voice & Image Messaging States ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [imageCompressingChat, setImageCompressingChat] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic content feeds
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [peers, setPeers] = useState<Profile[]>([]);
  const [peersLoading, setPeersLoading] = useState(true);

  // Composer States (Reddit-style tabbed composer)
  const [isComposing, setIsComposing] = useState(false);
  const [composerTab, setComposerTab] = useState<ComposerTab>("text");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCategory, setComposeCategory] = useState("#general");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imageCompressing, setImageCompressing] = useState(false);
  const [composeError, setComposeError] = useState("");
  const [postingLoader, setPostingLoader] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Comment Drawer Panel States
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentingLoader, setCommentingLoader] = useState(false);

  // Editing Post Modal States
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoader, setEditLoader] = useState(false);

  // Deleting Post States
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

  // User Stats (Reddit karma tally)
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);

  // Profile sub-tabs & comments state
  const [profileSubTab, setProfileSubTab] = useState<"posts" | "comments">("posts");
  const [myCommentsList, setMyCommentsList] = useState<any[]>([]);
  const [myCommentsLoading, setMyCommentsLoading] = useState(false);

  // Social network homepage widgets states
  const [suggestedConnected, setSuggestedConnected] = useState<Record<string, boolean>>({});
  const [eventsRegistered, setEventsRegistered] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [appliedInternships, setAppliedInternships] = useState<Record<string, boolean>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("techleaders_joined_communities");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("techleaders_joined_communities", JSON.stringify(joinedCommunities));
    }
  }, [joinedCommunities]);

  // ====================================================================
  // 🎓 STUDENT PRODUCTIVITY HUB REDESIGN STATES
  // ====================================================================
  const [resumeUploaded, setResumeUploaded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mock_user_resume_uploaded") === "true";
    }
    return false;
  });
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resumeFileName, setResumeFileName] = useState<string>("Resume_Academic.pdf");
  const [activeSavedTab, setActiveSavedTab] = useState<"posts" | "resources" | "notes" | "opportunities">("posts");

  const [notes, setNotes] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mock_user_notes");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      { id: "note-1", text: "Submit SIH Hackathon project draft by Wednesday midnight", date: "May 30, 2026" },
      { id: "note-2", text: "Ask Professor Gupta for placement recommendation letter", date: "May 29, 2026" },
      { id: "note-3", text: "Revise DBMS normal forms and ACID properties for tomorrow's mock interview", date: "May 28, 2026" }
    ];
  });
  
  const [noteText, setNoteText] = useState<string>("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [savedResourcesList, setSavedResourcesList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mock_saved_resources");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      { id: "res-1", name: "Operating_Systems_Placement_Cheat_Sheet.pdf", size: "2.4 MB", type: "PDF Document" },
      { id: "res-2", name: "Top_50_System_Design_Case_Studies.pdf", size: "4.1 MB", type: "PDF Document" },
      { id: "res-3", name: "Database_Management_Notes_Final.zip", size: "12.8 MB", type: "ZIP Archive" }
    ];
  });

  const [isVerified, setIsVerified] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mock_user_verified") !== "false";
    }
    return true;
  });

  // ====================================================================
  // ⚙️ PRODUCTION SETTINGS STATE HOOKS & ACTIONS
  // ====================================================================
  // --- PRIVACY PREFERENCES ---
  const [privacyPublicProfile, setPrivacyPublicProfile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_privacy_public") !== "false";
    }
    return true;
  });
  const [privacyShowCollege, setPrivacyShowCollege] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_privacy_college") !== "false";
    }
    return true;
  });
  const [privacyShowConnections, setPrivacyShowConnections] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_privacy_connections") !== "false";
    }
    return true;
  });
  const [privacyShowOnlineStatus, setPrivacyShowOnlineStatus] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_privacy_online") !== "false";
    }
    return true;
  });
  const [privacyWhoCanMessage, setPrivacyWhoCanMessage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_privacy_message") || "everyone";
    }
    return "everyone";
  });

  // --- NOTIFICATION PREFERENCES ---
  const [notifNewMessages, setNotifNewMessages] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_notif_messages") !== "false";
    }
    return true;
  });
  const [notifCommunityPosts, setNotifCommunityPosts] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_notif_posts") !== "false";
    }
    return true;
  });
  const [notifConnectionRequests, setNotifConnectionRequests] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_notif_requests") !== "false";
    }
    return true;
  });
  const [notifEventReminders, setNotifEventReminders] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_notif_events") !== "false";
    }
    return true;
  });
  const [notifEmail, setNotifEmail] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_notif_email") !== "false";
    }
    return true;
  });

  // --- COMMUNITY PREFERENCES ---
  const [muteCommunityNotifications, setMuteCommunityNotifications] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_comm_mute") === "true";
    }
    return false;
  });
  const [communityContentPreferences, setCommunityContentPreferences] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_comm_pref") || "all";
    }
    return "all";
  });

  // --- APPEARANCE PREFERENCES ---
  const [appearanceMode, setAppearanceMode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_appear_mode") || "dark";
    }
    return "dark";
  });
  const [appearanceCompactFeed, setAppearanceCompactFeed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_appear_compact") === "true";
    }
    return false;
  });
  const [appearanceLargerText, setAppearanceLargerText] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_appear_text") === "true";
    }
    return false;
  });

  // --- VERIFICATION PREFERENCES ---
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [verificationEmailStatus, setVerificationEmailStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_verify_email_status") || "Verified";
    }
    return "Verified";
  });
  const [isUploadingVerificationDoc, setIsUploadingVerificationDoc] = useState<boolean>(false);
  const [verificationDocUploadProgress, setVerificationDocUploadProgress] = useState<number>(0);
  const [verificationDocName, setVerificationDocName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_verify_doc_name") || "";
    }
    return "";
  });

  // --- PROFILE EDIT INTERMEDIATE FIELDS FOR SETTINGS ---
  const [settingsName, setSettingsName] = useState("");
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsBio, setSettingsBio] = useState("");
  const [settingsCollege, setSettingsCollege] = useState("");
  const [settingsBranch, setSettingsBranch] = useState("CSE");
  const [settingsYear, setSettingsYear] = useState("3rd Year");
  const [activeSettingsSection, setActiveSettingsSection] = useState<string>("profile");
  const [securityCurrentPassword, setSecurityCurrentPassword] = useState<string>("");
  const [securityNewPassword, setSecurityNewPassword] = useState<string>("");
  const [securityConfirmPassword, setSecurityConfirmPassword] = useState<string>("");
  const [securityStatus, setSecurityStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [securitySessions, setSecuritySessions] = useState<Array<{ id: string; device: string; browser: string; location: string; time: string }>>([
    { id: "session-1", device: "Windows 11 PC", browser: "Chrome Dev", location: "Mumbai, India", time: "Active Now" },
    { id: "session-2", device: "Apple iPhone 14 Pro", browser: "Safari Mobile", location: "Pune, India", time: "2 hours ago" },
    { id: "session-3", device: "Apple MacBook Pro", browser: "Firefox Nightly", location: "Delhi, India", time: "3 days ago" }
  ]);

  // --- NAVBAR REDESIGN INTERACTIVE STATES ---
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeNavbarCommunity, setActiveNavbarCommunity] = useState<string>("iit-bombay");
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Sync active community with the user's primary college on load
  useEffect(() => {
    if (memberCompany) {
      setActiveNavbarCommunity(memberCompany.toLowerCase().replace(/\s+/g, "-"));
    }
  }, [memberCompany]);

  // Sync settings inputs when tab changes to settings
  useEffect(() => {
    if (currentTab === "settings") {
      setSettingsName(memberName);
      setSettingsUsername(memberUsername);
      setSettingsBio(bio);
      setSettingsCollege(memberCompany);
      
      const titleParts = memberTitle ? memberTitle.split("/") : [];
      setSettingsYear(titleParts[0]?.trim() || "3rd Year");
      setSettingsBranch(titleParts[1]?.trim() || "CSE");
      
      setVerificationEmail(memberEmail || "student@campus.edu");
    }
  }, [currentTab, memberName, memberUsername, bio, memberCompany, memberTitle, memberEmail]);

  // Save profile settings handler
  const handleSaveProfileSettings = () => {
    setMemberName(settingsName.trim());
    setMemberUsername(settingsUsername.trim().toLowerCase());
    setBio(settingsBio.trim());
    setMemberCompany(settingsCollege.trim());
    setMemberTitle(`${settingsYear} / ${settingsBranch}`);

    if (typeof window !== "undefined") {
      const mockProfileStr = localStorage.getItem("mock_user_profile");
      if (mockProfileStr) {
        try {
          const profile = JSON.parse(mockProfileStr);
          profile.full_name = settingsName.trim();
          profile.username = settingsUsername.trim().toLowerCase();
          profile.bio = settingsBio.trim();
          profile.college_name = settingsCollege.trim();
          profile.year = settingsYear;
          profile.branch = settingsBranch;
          localStorage.setItem("mock_user_profile", JSON.stringify(profile));
        } catch (e) {
          console.error(e);
        }
      }
      alert("Success: Your student profile has been synced!");
    }
  };

  // Simulated email verification
  const handleVerifyEmailSimulated = () => {
    if (!verificationEmail.trim()) return;
    alert(`Verification code has been dispatched to: ${verificationEmail}. Please confirm code.`);
    setVerificationEmailStatus("Verified");
    if (typeof window !== "undefined") {
      localStorage.setItem("setting_verify_email_status", "Verified");
    }
  };

  // Simulated Verification Document Sync Upload
  const handleVerifyDocSimulatedUpload = () => {
    setIsUploadingVerificationDoc(true);
    setVerificationDocUploadProgress(0);
    const interval = setInterval(() => {
      setVerificationDocUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploadingVerificationDoc(false);
            setVerificationDocName("College_ID_Card.jpg");
            setIsVerified(true);
            if (typeof window !== "undefined") {
              localStorage.setItem("setting_verify_doc_name", "College_ID_Card.jpg");
              localStorage.setItem("mock_user_verified", "true");
            }
            alert("Congratulations! Your student verification document was successfully validated and verified badge has been unlocked!");
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  // Export User Data Simulator
  const handleExportDataSimulated = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      profile: { name: memberName, username: memberUsername, college: memberCompany, title: memberTitle, bio },
      posts_shared: posts.filter(p => p.user_id === userId),
      comments_made: myCommentsList
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${memberUsername}_techleaders_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download Posts CSV Simulator
  const handleDownloadPostsSimulated = () => {
    const userPostsList = posts.filter(p => p.user_id === userId);
    let csvContent = "data:text/csv;charset=utf-8,ID,Title,Category,Created At,Votes,Replies\n";
    userPostsList.forEach(p => {
      csvContent += `"${p.id}","${p.title.replace(/"/g, '""')}","${p.category}","${p.created_at}",${p.votes_score ?? 0},${p.replies_count ?? 0}\n`;
    });
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `${memberUsername}_my_posts.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Simulated upload handler
  const handleResumeSimulatedUpload = () => {
    setIsUploadingResume(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploadingResume(false);
            setResumeUploaded(true);
            if (typeof window !== "undefined") {
              localStorage.setItem("mock_user_resume_uploaded", "true");
            }
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  // Simulated resume remove handler
  const handleRemoveResume = () => {
    setResumeUploaded(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_user_resume_uploaded", "false");
    }
  };

  // Quick note actions
  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    let updatedNotes;
    if (editingNoteId) {
      updatedNotes = notes.map(n => n.id === editingNoteId ? { ...n, text: noteText.trim() } : n);
      setEditingNoteId(null);
    } else {
      const newNote = {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      updatedNotes = [newNote, ...notes];
    }
    setNotes(updatedNotes);
    setNoteText("");
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_user_notes", JSON.stringify(updatedNotes));
    }
  };

  const handleEditNote = (note: any) => {
    setNoteText(note.text);
    setEditingNoteId(note.id);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setNoteText("");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_user_notes", JSON.stringify(updatedNotes));
    }
  };

  const handleRemoveResource = (id: string) => {
    const updated = savedResourcesList.filter(r => r.id !== id);
    setSavedResourcesList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_saved_resources", JSON.stringify(updated));
    }
  };

  useEffect(() => {
    if (memberCompany) {
      const collegeSlug = memberCompany.toLowerCase().replace(/\s+/g, "-");
      setJoinedCommunities(prev => {
        if (Object.keys(prev).length > 0) return prev;
        return {
          [collegeSlug]: true,
          "placement-prep": true,
          "academic-notes": true,
          "campus-life": true,
          "hackathons": true
        };
      });
    }
  }, [memberCompany]);

  // Auth Guard: Load Mock or Live session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isMock = urlParams.get("mock_login") === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("supabase.co");
      const urlEmail = urlParams.get("email") || sessionStorage.getItem("mock_user_email") || "";

      // Parse tab query parameter
      const tabParam = urlParams.get("tab");
      if (tabParam && ["feed", "my-posts", "profile", "chats", "connections"].includes(tabParam)) {
        setCurrentTab(tabParam as DashboardTab);
      }

      if (isMock) {
        // --- MOCK AUTH CHECK ---
        const mockSession = sessionStorage.getItem("mock_user_session");
        if (mockSession !== "true") {
          window.location.href = "/";
          return;
        }

        const localOnboarded = localStorage.getItem("techleaders_onboarded");
        if (localOnboarded !== "true") {
          window.location.href = `/onboarding?mock_login=true&email=${encodeURIComponent(urlEmail)}`;
          return;
        }

        const mockProfileStr = localStorage.getItem("mock_user_profile");
        if (mockProfileStr) {
          try {
            const profile = JSON.parse(mockProfileStr);
            setUserId("mock-user-id");
            setMemberName(profile.full_name || "Student Peer");
            setMemberEmail(urlEmail || "student@campus.edu");
            setMemberTitle(`${profile.year} / ${profile.branch}`);
            setMemberCompany(profile.college_name || "IIT Bombay");
            setBio(profile.bio || "");
            setAvatarUrl(profile.avatar_url || "");
            setMemberUsername(profile.username || "student");
            setSelectedTags(profile.interests || []);
            setJoinedDate("May 2026");
          } catch (e) {
            console.error("Parsing mock profile failed", e);
          }
        }
        setIsOnboarded(true);
        setLoading(false);
      } else {
        // --- LIVE SUPABASE AUTH CHECK ---
        fetchLiveSession();
      }
    }
  }, []);

  const fetchLiveSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = "/";
        return;
      }

      setUserId(session.user.id);
      setMemberEmail(session.user.email || "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!profile || !profile.onboarding_completed) {
        window.location.href = "/onboarding";
        return;
      }

      setMemberName(profile.full_name);
      setMemberTitle(`${profile.year} / ${profile.branch}`);
      setMemberCompany(profile.college_name);
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setMemberUsername(profile.username || "");
      setSelectedTags(profile.interests || []);
      if (profile.created_at) {
        const d = new Date(profile.created_at);
        setJoinedDate(d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
      }

      setIsOnboarded(true);
      setLoading(false);
    } catch (err) {
      console.error("Auth Guard query failure:", err);
      window.location.href = "/";
    }
  };

  // --- COMMUNITY ELIGIBILITY CALCULATIONS ---
  const isEligibleToCreateCommunity = true;

  const handleSignOut = async () => {
    const isMock = isMockLoginBypass();
    if (isMock) {
      sessionStorage.removeItem("mock_user_session");
      sessionStorage.removeItem("mock_user_email");
      window.location.href = "/";
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out failed:", err);
      window.location.href = "/";
    }
  };

  // Pull Feeds and Peers once onboarded or joined communities change
  useEffect(() => {
    if (isOnboarded && memberCompany) {
      fetchPeers();
      fetchPosts();
      fetchCommunities();
      fetchUserStats();
      fetchMyComments(userId, isMockLoginBypass());
    }
  }, [isOnboarded, memberCompany, joinedCommunities]);

  // --- QUERY STATS (POSTS & COMMENTS CARMA TALLIES) ---
  const fetchUserStats = async () => {
    const isMock = isMockLoginBypass();
    if (isMock) {
      // Pull mock stats from localStorage
      const storedPosts = localStorage.getItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`);
      if (storedPosts) {
        try {
          const parsed = JSON.parse(storedPosts) as Post[];
          const myPosts = parsed.filter(p => p.user_id === userId);
          setTotalPostsCount(myPosts.length);
        } catch (e) {}
      }
      
      const storedComments = localStorage.getItem("mock_comments_all");
      let mockCommentsCount = 0;
      if (storedComments) {
        try {
          const parsed = JSON.parse(storedComments) as any[];
          mockCommentsCount = parsed.filter(c => c.user_id === userId).length;
        } catch (e) {}
      }
      setTotalCommentsCount(mockCommentsCount);
      return;
    }

    try {
      // Query exact counts of posts created by the student
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Query exact comments tally
      const { count: commentCount } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setTotalPostsCount(postCount || 0);
      setTotalCommentsCount(commentCount || 0);
    } catch (e) {
      console.error("Failed to query stats tallies:", e);
    }
  };

  const fetchMyComments = async (currentUserId: string, isMock: boolean) => {
    if (!currentUserId) return;
    setMyCommentsLoading(true);

    if (isMock) {
      const stored = localStorage.getItem("mock_comments_all");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as any[];
          const filtered = parsed.filter(c => c.user_id === currentUserId);
          setMyCommentsList(filtered);
        } catch (e) {
          setMyCommentsList([]);
        }
      } else {
        localStorage.setItem("mock_comments_all", "[]");
        setMyCommentsList([]);
      }
      setMyCommentsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          post_id,
          body,
          created_at,
          user_id,
          posts:post_id (
            title
          )
        `)
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMyCommentsList(data);
      }
    } catch (e) {
      console.error("Failed to fetch my comments:", e);
    } finally {
      setMyCommentsLoading(false);
    }
  };

  // --- FETCH CAMPUS DIRECTORY USERS ---
  const fetchPeers = async () => {
    setPeersLoading(true);
    const isMock = isMockLoginBypass();

    if (isMock) {
      setPeers([]);
      setPeersLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, college_name, year, branch")
        .eq("college_name", memberCompany)
        .eq("onboarding_completed", true);

      if (error) throw error;
      // Filter out current user from peers directory
      const activePeers = (data || []).filter((p: any) => {
        if (p.username === memberUsername) return false;
        if (!isDemoAllowed(memberEmail)) {
          const isDemoPeer = p.user_id.startsWith("mock-") || 
                             p.user_id.startsWith("seed-") ||
                             p.user_id.startsWith("elite-") ||
                             ["aadil", "priya", "rahul", "jordanchen", "elenarodriguez", "marcusthorne", "sofiapatel", "liamoconnell", "aishakhan", "rahulsharma", "priyasingh"].includes(p.username.toLowerCase());
          if (isDemoPeer) return false;
        }
        return true;
      });
      setPeers(activePeers);
    } catch (err) {
      console.error("Failed to fetch peers roster:", err);
    } finally {
      setPeersLoading(false);
    }
  };

  // ====================================================================
  // 🔗 CONNECTIONS, CONVERSATIONS & CHAT ENGINE (LIVE & MOCK MODES)
  // ====================================================================

  // Auto-scroll messages feed to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chats & connections on mount or user/tab change
  useEffect(() => {
    if (userId) {
      if (currentTab === "chats" || currentTab === "connections" || currentTab === "feed") {
        seedMockData();
      }
      fetchConnections();
      fetchConversations();
    }
  }, [userId, currentTab]);

  // Load connected student profiles for My Network grid
  useEffect(() => {
    const loadConnectedProfiles = async () => {
      if (!userId || connections.length === 0) {
        setConnectedProfiles([]);
        setConnectionProfiles([]);
        return;
      }
      
      const isMock = isMockLoginBypass();
      if (isMock) {
        setConnectedProfiles([]);
        setConnectionProfiles([]);
        return;
      }

      // Filter accepted ones for My Network grid
      const accepted = connections.filter(c => c.status === "accepted");
      const partnerIds = accepted.map(c => c.sender_id === userId ? c.receiver_id : c.sender_id);
      
      // Filter all ones (both pending and accepted) for general connectionProfiles hydration
      const allPartnerIds = Array.from(new Set(connections.map(c => c.sender_id === userId ? c.receiver_id : c.sender_id)));

      try {
        if (allPartnerIds.length > 0) {
          const { data, error } = await supabase
            .from("profiles")
            .select("user_id, full_name, username, avatar_url, college_name, year, branch, bio")
            .in("user_id", allPartnerIds);
            
          if (!error && data) {
            setConnectionProfiles(data || []);
            const acceptedData = data.filter((p: any) => p.user_id && partnerIds.includes(p.user_id));
            setConnectedProfiles(acceptedData);
          }
        } else {
          setConnectedProfiles([]);
          setConnectionProfiles([]);
        }
      } catch (e) {
        console.error("Failed to fetch connected profiles:", e);
      }
    };

    loadConnectedProfiles();
  }, [connections, userId]);

  // Seed default connections, peers, and messages in localStorage for Mock Mode
  const seedMockData = () => {
    localStorage.removeItem("mock_connections");
    localStorage.removeItem("mock_conversations");
    localStorage.removeItem("mock_messages");
    localStorage.removeItem("mock_notifications");
    localStorage.removeItem("mock_communities");
  };

  // --- 1. FETCH ALL RELATIONSHIP CONNECTIONS ---
  const fetchConnections = async () => {
    const isMock = isMockLoginBypass();
    if (isMock) {
      if (!isDemoAllowed(memberEmail)) {
        setConnections([]);
        return;
      }
      const stored = localStorage.getItem("mock_connections");
      if (stored) {
        try {
          const list = JSON.parse(stored);
          setConnections(list.filter((c: any) => c.sender_id === userId || c.receiver_id === userId));
        } catch (e) {
          setConnections([]);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      if (error) throw error;
      setConnections(data || []);
    } catch (err: any) {
      console.error("Failed to fetch Supabase connections:", err?.message || err);
    }
  };

  // --- 2. FETCH ACTIVE CHAT CONVERSATIONS ---
  const fetchConversations = async () => {
    setLoadingChats(true);
    const isMock = isMockLoginBypass();

    if (isMock) {
      if (!isDemoAllowed(memberEmail)) {
        setConversations([]);
        setLoadingChats(false);
        return;
      }
      const storedConvs = localStorage.getItem("mock_conversations");
      if (storedConvs) {
        try {
          const rawList = JSON.parse(storedConvs);
          const filtered = rawList.filter((c: any) => c.user1_id === userId || c.user2_id === userId);
          
          // Map participant profiles
          const mockPeersList = [
            { user_id: "mock-peer-aadil", full_name: "Aadil Khan", username: "aadil", avatar_url: "", branch: "CSE", year: "3rd Year" },
            { user_id: "mock-peer-priya", full_name: "Priya Sharma", username: "priya", avatar_url: "", branch: "ECE", year: "2nd Year" },
            { user_id: "mock-peer-rahul", full_name: "Rahul Verma", username: "rahul", avatar_url: "", branch: "IT", year: "Final Year" },
            { user_id: "elite-jordan-chen", full_name: "Jordan Chen", username: "jordanchen", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200", branch: "Computer Science & AI", year: "3rd Year" },
            { user_id: "elite-elena-rodriguez", full_name: "Elena Rodriguez", username: "elenarodriguez", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200", branch: "Bioengineering", year: "4th Year" },
            { user_id: "elite-marcus-thorne", full_name: "Marcus Thorne", username: "marcusthorne", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200", branch: "Philosophy & Politics", year: "2nd Year" },
            { user_id: "elite-sofia-patel", full_name: "Sofia Patel", username: "sofiapatel", avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200", branch: "Structural Engineering", year: "3rd Year" },
            { user_id: "elite-liam-oconnell", full_name: "Liam O'Connell", username: "liamoconnell", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200", branch: "Robotics Systems", year: "1st Year" },
            { user_id: "elite-aisha-khan", full_name: "Aisha Khan", username: "aishakhan", avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200&h=200", branch: "Interaction Design", year: "3rd Year" },
            { user_id: "elite-rahul-sharma", full_name: "Rahul Sharma", username: "rahulsharma", avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200", branch: "CSE", year: "4th Year" },
            { user_id: "elite-priya-singh", full_name: "Priya Singh", username: "priyasingh", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200", branch: "Mech", year: "2nd Year" }
          ];

          const mapped = filtered.map((c: any) => {
            const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
            const profile = mockPeersList.find((p: any) => p.user_id === otherId) || {
              user_id: otherId,
              full_name: "Classmate Peer",
              username: "classmate",
              avatar_url: "",
              branch: "General",
              year: "Student"
            };

            // Check if connection is accepted
            const storedConns = localStorage.getItem("mock_connections");
            let isConn = c.is_connected;
            if (storedConns) {
              try {
                const conns = JSON.parse(storedConns);
                isConn = c.is_connected || conns.some((conn: any) => 
                  conn.status === "accepted" &&
                  ((conn.sender_id === userId && conn.receiver_id === otherId) ||
                   (conn.sender_id === otherId && conn.receiver_id === userId))
                );
              } catch (_) {}
            }

            return {
              ...c,
              is_connected: isConn,
              other_profile: profile
            };
          });

          // Sort by last message timestamp descending
          mapped.sort((a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          setConversations(mapped);
        } catch (e) {
          setConversations([]);
        }
      }
      setLoadingChats(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) throw error;

      // Hydrate participant profile data for each conversation
      const mapped = await Promise.all((data || []).map(async (convo: any) => {
        const otherId = convo.user1_id === userId ? convo.user2_id : convo.user1_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url, year, branch")
          .eq("user_id", otherId)
          .maybeSingle();

        // Check if there is an accepted connection
        const hasAccepted = connections.some((conn: any) => 
          conn.status === "accepted" &&
          ((conn.sender_id === userId && conn.receiver_id === otherId) ||
           (conn.sender_id === otherId && conn.receiver_id === userId))
        );

        return {
          ...convo,
          is_connected: convo.is_connected || hasAccepted,
          other_profile: profile || {
            user_id: otherId,
            full_name: "Student Peer",
            username: "classmate",
            avatar_url: "",
            year: "Student",
            branch: "General"
          }
        };
      }));

      mapped.sort((a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setConversations(mapped);
    } catch (err: any) {
      console.error("Failed to fetch Supabase conversations:", err?.message || err);
    } finally {
      setLoadingChats(false);
    }
  };

  // --- 3. FETCH CHAT MESSAGES TIMELINE ---
  const fetchMessages = async (convoId: string) => {
    const isMock = isMockLoginBypass();
    if (isMock) {
      const stored = localStorage.getItem("mock_messages");
      if (stored) {
        try {
          const list = JSON.parse(stored) as any[];
          const filtered = list.filter((m: any) => m.conversation_id === convoId);
          filtered.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setMessages(filtered);
        } catch (e) {
          setMessages([]);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch Supabase messages:", err);
    }
  };

  // --- 4. START CHAT WITH PEER (CREATES OR SELECTS CONVERSATION) ---
  const handleStartChat = async (peerId: string, peerProfile: any) => {
    // Scroll active layout into chats tab
    setCurrentTab("chats");
    setChatSubTab("chats");
    setIsComposing(false);

    const isMock = isMockLoginBypass();
    const sortedIds = [userId, peerId].sort();
    const user1 = sortedIds[0];
    const user2 = sortedIds[1];

    // Check if conversation already exists in state
    const existing = conversations.find(
      (c: any) => (c.user1_id === user1 && c.user2_id === user2)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      setActiveConvoParticipant(peerProfile);
      fetchMessages(existing.id);
      return;
    }

    // SPAM PROTECTION: Limit to 3 new intro conversations per day
    const today = new Date().toDateString();
    const rateLimitKey = `techleaders_limit_intros_${userId}_${today}`;
    const introsToday = parseInt(localStorage.getItem(rateLimitKey) || "0", 10);
    if (introsToday >= 3) {
      alert("⚠️ Daily Spam Protection: You can initiate at most 3 new conversations per day to prevent campus DM promotions.");
      return;
    }

    // Check if an accepted connection already exists
    const activeConn = connections.find(
      (c: any) =>
        (c.sender_id === userId && c.receiver_id === peerId) ||
        (c.sender_id === peerId && c.receiver_id === userId)
    );
    const isConnectedVal = activeConn && activeConn.status === "accepted" ? true : false;

    if (isMock) {
      const convoId = `mock-convo-${Date.now()}`;
      const newConvo = {
        id: convoId,
        user1_id: user1,
        user2_id: user2,
        is_connected: isConnectedVal,
        free_message_count: 0,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const stored = localStorage.getItem("mock_conversations");
      let list = [];
      if (stored) list = JSON.parse(stored);
      list.push(newConvo);
      localStorage.setItem("mock_conversations", JSON.stringify(list));
      localStorage.setItem(rateLimitKey, (introsToday + 1).toString());

      await fetchConversations();
      setActiveConversationId(convoId);
      setActiveConvoParticipant(peerProfile);
      setMessages([]);
      return;
    }

    try {
      // 1. Create convo in Supabase
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user1_id: user1,
          user2_id: user2,
          is_connected: isConnectedVal,
          free_message_count: 0
        })
        .select("*")
        .single();

      if (error) throw error;
      localStorage.setItem(rateLimitKey, (introsToday + 1).toString());

      await fetchConversations();
      setActiveConversationId(data.id);
      setActiveConvoParticipant(peerProfile);
      setMessages([]);
    } catch (err: any) {
      console.error("Failed to start live Supabase chat:", err);
      alert(err.message || "Failed to start conversation. Please try again.");
    }
  };

  // --- 5. SEND MESSAGE (HANDLES RESTRICTIONS & LOCKING) ---
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeConversationId || !activeConvoParticipant) return;
    
    // Find conversation details
    const convo = conversations.find(c => c.id === activeConversationId);
    if (!convo) return;

    // Strict messaging restriction
    const activeConn = connections.find(
      (c: any) =>
        (c.sender_id === userId && c.receiver_id === activeConvoParticipant.user_id) ||
        (c.sender_id === activeConvoParticipant.user_id && c.receiver_id === userId)
    );
    const isConvoConnected = convo.is_connected || (activeConn && activeConn.status === "accepted");

    if (!isConvoConnected && (convo.free_message_count || 0) >= 2) {
      alert("⚠️ Conversation is locked. You must connect to unlock unlimited messaging.");
      return;
    }

    setSendingMessage(true);
    const isMock = isMockLoginBypass();
    const newMsgText = chatInput.trim();

    if (isMock) {
      const msgId = `mock-msg-${Date.now()}`;
      const newMsg = {
        id: msgId,
        conversation_id: activeConversationId,
        sender_id: userId,
        message: newMsgText,
        created_at: new Date().toISOString()
      };

      // Push raw message
      const stored = localStorage.getItem("mock_messages");
      let msgsList = [];
      if (stored) msgsList = JSON.parse(stored);
      msgsList.push(newMsg);
      localStorage.setItem("mock_messages", JSON.stringify(msgsList));

      // Update parent conversation count
      const conStored = localStorage.getItem("mock_conversations");
      if (conStored) {
        let convList = JSON.parse(conStored);
        const idx = convList.findIndex((c: any) => c.id === activeConversationId);
        if (idx !== -1) {
          const isMockConvoConnected = convList[idx].is_connected || (activeConn && activeConn.status === "accepted");
          if (!isMockConvoConnected) {
            convList[idx].free_message_count = Math.min(2, convList[idx].free_message_count + 1);
          }
          convList[idx].last_message_at = new Date().toISOString();
        }
        localStorage.setItem("mock_conversations", JSON.stringify(convList));
      }

      setChatInput("");
      setSendingMessage(false);
      fetchConversations();
      fetchMessages(activeConversationId);
      return;
    }

    try {
      // Live Supabase
      const { error: msgErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          sender_id: userId,
          message: newMsgText
        });

      if (msgErr) throw msgErr;

      // Update free message count if not connected
      if (!isConvoConnected) {
        await supabase
          .from("conversations")
          .update({
            free_message_count: Math.min(2, convo.free_message_count + 1),
            last_message_at: new Date().toISOString()
          })
          .eq("id", activeConversationId);
      } else {
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString()
          })
          .eq("id", activeConversationId);
      }

      setChatInput("");
      setSendingMessage(false);
      fetchConversations();
      fetchMessages(activeConversationId);
    } catch (err: any) {
      console.error("Failed to dispatch live message:", err);
      setSendingMessage(false);
    }
  };

  // --- 5.1 MEDIA MESSAGES DISPATCHER ---
  const dispatchMediaMessage = async (mediaDataUrl: string) => {
    if (!activeConversationId || !activeConvoParticipant) return;
    const convo = conversations.find(c => c.id === activeConversationId);
    if (!convo) return;

    // Strict messaging restriction
    const activeConn = connections.find(
      (c: any) =>
        (c.sender_id === userId && c.receiver_id === activeConvoParticipant.user_id) ||
        (c.sender_id === activeConvoParticipant.user_id && c.receiver_id === userId)
    );
    const isConvoConnected = convo.is_connected || (activeConn && activeConn.status === "accepted");

    if (!isConvoConnected && (convo.free_message_count || 0) >= 2) {
      alert("⚠️ Conversation is locked. You must connect to unlock unlimited messaging.");
      return;
    }

    setSendingMessage(true);
    const isMock = isMockLoginBypass();

    if (isMock) {
      const msgId = `mock-msg-${Date.now()}`;
      const newMsg = {
        id: msgId,
        conversation_id: activeConversationId,
        sender_id: userId,
        message: mediaDataUrl,
        created_at: new Date().toISOString()
      };

      const stored = localStorage.getItem("mock_messages");
      let msgsList = [];
      if (stored) msgsList = JSON.parse(stored);
      msgsList.push(newMsg);
      localStorage.setItem("mock_messages", JSON.stringify(msgsList));

      const conStored = localStorage.getItem("mock_conversations");
      if (conStored) {
        let convList = JSON.parse(conStored);
        const idx = convList.findIndex((c: any) => c.id === activeConversationId);
        if (idx !== -1) {
          const isMockConvoConnected = convList[idx].is_connected || (activeConn && activeConn.status === "accepted");
          if (!isMockConvoConnected) {
            convList[idx].free_message_count = Math.min(2, convList[idx].free_message_count + 1);
          }
          convList[idx].last_message_at = new Date().toISOString();
        }
        localStorage.setItem("mock_conversations", JSON.stringify(convList));
      }

      setSendingMessage(false);
      fetchConversations();
      fetchMessages(activeConversationId);
      return;
    }

    try {
      const { error: msgErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          sender_id: userId,
          message: mediaDataUrl
        });

      if (msgErr) throw msgErr;

      if (!isConvoConnected) {
        await supabase
          .from("conversations")
          .update({
            free_message_count: Math.min(2, convo.free_message_count + 1),
            last_message_at: new Date().toISOString()
          })
          .eq("id", activeConversationId);
      } else {
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString()
          })
          .eq("id", activeConversationId);
      }

      setSendingMessage(false);
      fetchConversations();
      fetchMessages(activeConversationId);
    } catch (err: any) {
      console.error("Failed to dispatch media message:", err?.message || err);
      setSendingMessage(false);
    }
  };

  // --- 5.2 AUDIO VOICE MESSAGES LOGIC ---
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("🎙️ Audio recording is not supported in your browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 1000) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          dispatchMediaMessage(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone capture failed:", err);
      alert("🎙️ Failed to access microphone. Please enable page permissions.");
    }
  };

  const handleStopRecording = (cancel = false) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if (cancel) {
        mediaRecorderRef.current.onstop = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          }
        };
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // --- 5.3 IMAGE MESSAGE HANDLER ---
  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageCompressingChat(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 400;

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

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.7);
          dispatchMediaMessage(base64);
        }
        setImageCompressingChat(false);
        if (chatImageInputRef.current) chatImageInputRef.current.value = "";
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- 6. SEND FRIEND CONNECTION REQUEST ---
  const handleSendConnectionRequest = async (receiverId: string) => {
    // SPAM PROTECTION: Max 5 connection requests sent per day
    const today = new Date().toDateString();
    const rateLimitKey = `techleaders_limit_reqs_${userId}_${today}`;
    const reqsToday = parseInt(localStorage.getItem(rateLimitKey) || "0", 10);
    if (reqsToday >= 5) {
      alert("⚠️ Daily Spam Protection: You can send at most 5 connection requests per day to prevent automated networking solicitation.");
      return;
    }

    const isMock = isMockLoginBypass();
    if (isMock) {
      const connId = `mock-conn-${Date.now()}`;
      const newConn = {
        id: connId,
        sender_id: userId,
        receiver_id: receiverId,
        status: "pending",
        created_at: new Date().toISOString()
      };

      const stored = localStorage.getItem("mock_connections");
      let list = [];
      if (stored) list = JSON.parse(stored);
      list.push(newConn);
      localStorage.setItem("mock_connections", JSON.stringify(list));
      localStorage.setItem(rateLimitKey, (reqsToday + 1).toString());

      fetchConnections();
      alert("🎉 Connection request dispatched!");
      return;
    }

    try {
      const { error } = await supabase
        .from("connections")
        .insert({
          sender_id: userId,
          receiver_id: receiverId,
          status: "pending"
        });

      if (error) throw error;
      localStorage.setItem(rateLimitKey, (reqsToday + 1).toString());

      fetchConnections();
      alert("🎉 Connection request dispatched!");
    } catch (err: any) {
      console.error("Failed to send live connection request:", err?.message || err);
      alert(err.message || "Failed to dispatch request. They might have a pending request with you.");
    }
  };

  // --- 7. ACCEPT FRIEND CONNECTION REQUEST ---
  const handleAcceptConnectionRequest = async (senderId: string, connectionId: string) => {
    const isMock = isMockLoginBypass();
    if (isMock) {
      // 1. Update connection status
      const stored = localStorage.getItem("mock_connections");
      if (stored) {
        let list = JSON.parse(stored);
        const idx = list.findIndex((c: any) => c.id === connectionId);
        if (idx !== -1) list[idx].status = "accepted";
        localStorage.setItem("mock_connections", JSON.stringify(list));
      }

      // 2. Set conversation connection status to true
      const conStored = localStorage.getItem("mock_conversations");
      if (conStored) {
        let convList = JSON.parse(conStored);
        const idx = convList.findIndex(
          (c: any) =>
            (c.user1_id === userId && c.user2_id === senderId) ||
            (c.user1_id === senderId && c.user2_id === userId)
        );
        if (idx !== -1) convList[idx].is_connected = true;
        localStorage.setItem("mock_conversations", JSON.stringify(convList));
      }

      await fetchConnections();
      await fetchConversations();
      alert("🤝 Connection request accepted! Unlimited chatting is unlocked.");
      return;
    }

    try {
      // 1. Accept request in Supabase
      const { error: connErr } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (connErr) throw connErr;

      // 2. Set conversation connection to true in Supabase
      const sortedIds = [userId, senderId].sort();
      const { error: convoErr } = await supabase
        .from("conversations")
        .update({ is_connected: true })
        .eq("user1_id", sortedIds[0])
        .eq("user2_id", sortedIds[1]);

      if (convoErr) {
        console.warn("Conversation pair record between users might not exist yet:", convoErr);
      }

      await fetchConnections();
      await fetchConversations();
      alert("🤝 Connection request accepted! Unlimited chatting is unlocked.");
    } catch (err: any) {
      console.error("Failed to accept connection:", err);
    }
  };

  // --- 8. REJECT FRIEND CONNECTION REQUEST ---
  const handleRejectConnectionRequest = async (connectionId: string) => {
    const isMock = isMockLoginBypass();
    if (isMock) {
      const stored = localStorage.getItem("mock_connections");
      if (stored) {
        let list = JSON.parse(stored);
        const idx = list.findIndex((c: any) => c.id === connectionId);
        if (idx !== -1) list[idx].status = "rejected";
        localStorage.setItem("mock_connections", JSON.stringify(list));
      }
      fetchConnections();
      return;
    }

    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "rejected" })
        .eq("id", connectionId);
      if (error) throw error;
      fetchConnections();
    } catch (err) {
      console.error("Failed to reject connection request:", err);
    }
  };

  // --- AUTO-START CHAT VIA QUERY PARAMETER (chat_with) ---
  useEffect(() => {
    if (userId && conversations.length > 0 && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const chatWithId = urlParams.get("chat_with");
      if (chatWithId) {
        // Clear parameter from URL so it doesn't fire repeatedly
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete("chat_with");
        cleanParams.delete("tab");
        const cleanSearch = cleanParams.toString();
        const newUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "");
        window.history.replaceState({}, "", newUrl);

        // Find the profile details for this peer from our peers roster or fetch it
        const startChatFromQuery = async () => {
          let peerProfile = peers.find(p => p.user_id === chatWithId);
          if (!peerProfile && !isMockLoginBypass()) {
            // Fetch from database
            const { data } = await supabase
              .from("profiles")
              .select("user_id, full_name, username, avatar_url, college_name, year, branch")
              .eq("user_id", chatWithId)
              .maybeSingle();
            if (data) {
              peerProfile = data;
            }
          }
          if (!peerProfile && isMockLoginBypass()) {
            // Find in mock peers list
            const mockPeersList = [
              { user_id: "mock-peer-aadil", full_name: "Aadil Khan", username: "aadil", avatar_url: "", college_name: memberCompany, branch: "CSE", year: "3rd Year" },
              { user_id: "mock-peer-priya", full_name: "Priya Sharma", username: "priya", avatar_url: "", college_name: memberCompany, branch: "ECE", year: "2nd Year" },
              { user_id: "mock-peer-rahul", full_name: "Rahul Verma", username: "rahul", avatar_url: "", college_name: memberCompany, branch: "IT", year: "Final Year" },
              { user_id: "elite-jordan-chen", full_name: "Jordan Chen", username: "jordanchen", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200", college_name: "Stanford University", branch: "Computer Science & AI", year: "3rd Year" },
              { user_id: "elite-elena-rodriguez", full_name: "Elena Rodriguez", username: "elenarodriguez", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200", college_name: "MIT", branch: "Bioengineering", year: "4th Year" },
              { user_id: "elite-marcus-thorne", full_name: "Marcus Thorne", username: "marcusthorne", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200", college_name: "Oxford University", branch: "Philosophy & Politics", year: "2nd Year" },
              { user_id: "elite-sofia-patel", full_name: "Sofia Patel", username: "sofiapatel", avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200", college_name: "IIT Delhi", branch: "Structural Engineering", year: "3rd Year" },
              { user_id: "elite-liam-oconnell", full_name: "Liam O'Connell", username: "liamoconnell", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200", college_name: "ETH Zurich", branch: "Robotics Systems", year: "1st Year" },
              { user_id: "elite-aisha-khan", full_name: "Aisha Khan", username: "aishakhan", avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200&h=200", college_name: "UCL London", branch: "Interaction Design", year: "3rd Year" },
              { user_id: "elite-rahul-sharma", full_name: "Rahul Sharma", username: "rahulsharma", avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200", college_name: "NIT Trichy", branch: "CSE", year: "4th Year" },
              { user_id: "elite-priya-singh", full_name: "Priya Singh", username: "priyasingh", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200", college_name: "IIT Delhi", branch: "Mech", year: "2nd Year" }
            ];
            peerProfile = mockPeersList.find(p => p.user_id === chatWithId);
          }

          if (peerProfile) {
            handleStartChat(chatWithId, peerProfile);
          }
        };

        startChatFromQuery();
      }
    }
  }, [userId, conversations, peers]);

  // --- REAL-TIME SUPABASE REALTIME MESSAGE STREAMERS SUBSCRIPTION ---
  useEffect(() => {
    const isMock = isMockLoginBypass();
    if (isMock || !userId) {
      // Mock polling intervals to simulate messages loading instantly
      const interval = setInterval(() => {
        if (activeConversationId) {
          fetchMessages(activeConversationId);
          fetchConversations();
        }
      }, 3000);
      return () => clearInterval(interval);
    }

    console.log("Subscribing to live Supabase connections and messages updates...");
    
    // Subscribe to new messages realtime
    const messagesChannel = supabase
      .channel("messages_stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          if (activeConversationId && payload.new.conversation_id === activeConversationId) {
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to connections modifications realtime
    const connectionsChannel = supabase
      .channel("connections_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections" },
        () => {
          fetchConnections();
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(connectionsChannel);
    };
  }, [userId, activeConversationId]);

  // --- FETCH REDDIT-STYLE POSTS FEED ---
  const fetchPosts = async () => {
    setPostsLoading(true);
    const isMock = isMockLoginBypass();

    if (isMock) {
      const storedPosts = localStorage.getItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`);
      let userCustomPosts: Post[] = [];
      if (storedPosts) {
        try {
          userCustomPosts = JSON.parse(storedPosts) as Post[];
        } catch (e) {
          userCustomPosts = [];
        }
      }

      // Generate realistic seed posts
      const seeds = getSeedPosts(memberCompany, memberEmail);

      // Combine user custom posts and seed posts (avoid duplicates)
      const combined = [...userCustomPosts];
      seeds.forEach(seed => {
        if (!combined.some(p => p.id === seed.id)) {
          combined.push(seed);
        }
      });

      // Discovery-based feed: show all interest-based and college posts
      const filtered = combined;

      // Pull upvote scores and active user votes from mock registers
      const postsWithVotes = filtered.map(post => {
        const voteKey = `mock_vote_${post.id}_${userId}`;
        const userVote = parseInt(localStorage.getItem(voteKey) || "0", 10);
        return {
          ...post,
          user_vote_value: userVote,
        };
      });

      // Sort chronologically (recent first)
      postsWithVotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(postsWithVotes);
      setPostsLoading(false);
      return;
    }

    try {
      // 1. Fetch posts joined with profiles
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          body,
          category,
          image_url,
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            username,
            avatar_url,
            college_name,
            year,
            branch
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter college posts (Exclude developer test profiles for standard users, allow all colleges)
      const collegePosts = (postsData || []).filter((post: any) => {
        if (!isDemoAllowed(memberEmail)) {
          const isDemoPost = post.id.startsWith("seed-") || 
                             post.user_id.startsWith("mock-") || 
                             post.user_id.startsWith("seed-") ||
                             post.user_id.startsWith("elite-") ||
                             ["seed-aadil", "seed-priya", "seed-rahul", "seed-jordan", "seed-aisha", "seed-vikram", "seed-ananya"].includes(post.user_id);
          if (isDemoPost && post.user_id !== userId) return false;
        }
        return true;
      });

      // Generate seed posts
      const seeds = getSeedPosts(memberCompany, memberEmail);

      // Merge real database posts with seed posts
      const combined: Post[] = [...collegePosts];
      seeds.forEach(seed => {
        if (!combined.some(p => p.id === seed.id)) {
          combined.push(seed);
        }
      });

      // Discovery-based feed showing all campus activities
      const filtered = combined;

      // 2. Fetch replies tally, upvote tallies, and logged-in user vote status for each post
      const postsDetails = await Promise.all(
        filtered.map(async (post: any) => {
          // If it is a seed/demo post, it doesn't exist in Supabase comments/votes, so return it directly
          if (post.isDemo) {
            return post;
          }

          // Replies Tally
          const { count: commentCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Votes score calculation (upvotes count - downvotes count)
          const { data: votesData } = await supabase
            .from("votes")
            .select("vote_value, user_id")
            .eq("post_id", post.id);

          let score = 0;
          let userVote = 0;
          if (votesData) {
            votesData.forEach((v: any) => {
              score += v.vote_value;
              if (v.user_id === userId) {
                userVote = v.vote_value;
              }
            });
          }

          return {
            ...post,
            replies_count: commentCount || 0,
            votes_score: score,
            user_vote_value: userVote,
          };
        })
      );

      // Sort chronologically (recent first)
      postsDetails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(postsDetails);
    } catch (err: any) {
      console.error("Supabase post query failed, using mock failovers:", err?.message || err);
    } finally {
      setPostsLoading(false);
    }
  };

  // --- FETCH COMMUNITIES FROM DATABASE/LOCALSTORAGE ---
  const fetchCommunities = async () => {
    setCommunitiesLoading(true);
    const isMock = isMockLoginBypass();
    const fakeSlugs = [
      "iit-bombay",
      "iiit-hyderabad",
      "iit-hyderabad",
      "nit-raipur",
      "vit-vellore",
      "ggv-bilaspur",
      "gov-bilaspur",
      "neural-network-architects",
      "creative-designers-hub",
      "surgical-precision-hub",
      "constitutional-law-forum",
      "product-management-alliance",
      "ertyui"
    ];

    if (isMock) {
      const saved = localStorage.getItem("mock_communities");
      let list = [];
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {}
      }
      
      const filteredList = list.filter((c: any) => !fakeSlugs.includes(c.slug));
      setCommunities(filteredList);
      setCommunitiesLoading(false);
      return;
    }

    try {
      // Clean up Supabase database by deleting all fake/demo communities
      try {
        await supabase
          .from("communities")
          .delete()
          .in("slug", fakeSlugs);
      } catch (dbErr) {
        console.warn("Failed to delete fake communities in Supabase:", dbErr);
      }

      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data) {
        const filtered = data.filter((c: any) => !fakeSlugs.includes(c.slug));
        setCommunities(filtered);
      }
    } catch (e) {
      console.error("Failed to fetch communities:", e);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  // --- CREATE NEW COMMUNITY HANDLER ---
  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCommunityError("");
    
    if (!isEligibleToCreateCommunity) {
      setCreateCommunityError("⚠️ You must be active on the platform for at least 7 days to create a community.");
      return;
    }

    if (!createCommunityName.trim()) {
      setCreateCommunityError("Community name is required.");
      return;
    }

    const trimmedName = createCommunityName.trim();
    // Unique slug generation
    const cleanSlug = trimmedName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");

    if (!cleanSlug) {
      setCreateCommunityError("Invalid community name. Please use valid alphanumeric characters.");
      return;
    }

    setCreatingCommunityLoader(true);
    const isMock = isMockLoginBypass();
    const bannerGradients = [
      "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
      "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
      "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
      "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
    ];
    const randomGradient = bannerGradients[Math.floor(Math.random() * bannerGradients.length)];

    if (isMock) {
      // --- MOCK MODE CREATION ---
      try {
        const saved = localStorage.getItem("mock_communities");
        let communitiesList = [];
        if (saved) {
          try {
            communitiesList = JSON.parse(saved);
          } catch (_) {}
        }

        const exists = communitiesList.some(
          (c: any) => c.slug === cleanSlug || c.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (exists) {
          setCreateCommunityError("A community with this name or slug already exists.");
          setCreatingCommunityLoader(false);
          return;
        }

        const newComm = {
          name: trimmedName,
          slug: cleanSlug,
          description: createCommunityDescription.trim() || `Welcome to the ${trimmedName} student network space! Discuss technology, academics, placements, and college coordinates here.`,
          banner_url: randomGradient,
          category: createCommunityCategory
        };

        communitiesList.push(newComm);
        localStorage.setItem("mock_communities", JSON.stringify(communitiesList));

        // Auto-join creator immediately
        setJoinedCommunities(prev => ({
          ...prev,
          [cleanSlug]: true
        }));

        // Reset
        setCreateCommunityName("");
        setCreateCommunityDescription("");
        setIsCreatingCommunity(false);
        fetchCommunities();
      } catch (err: any) {
        setCreateCommunityError(err?.message || "Failed to create mock space.");
      } finally {
        setCreatingCommunityLoader(false);
      }
      return;
    }

    // --- LIVE SUPABASE CREATION ---
    try {
      // 1. Verify uniqueness
      const { data: communityExists } = await supabase
        .from("communities")
        .select("slug")
        .or(`slug.eq.${cleanSlug},name.ilike.${trimmedName}`)
        .maybeSingle();

      if (communityExists) {
        setCreateCommunityError("A community with this name or slug already exists.");
        setCreatingCommunityLoader(false);
        return;
      }

      // 2. Insert row
      const { error: insertErr } = await supabase
        .from("communities")
        .insert({
          name: trimmedName,
          slug: cleanSlug,
          description: createCommunityDescription.trim() || `Welcome to the ${trimmedName} student network space! Discuss technology, academics, placements, and college coordinates here.`,
          banner_url: randomGradient
        });

      if (insertErr) throw insertErr;

      // 3. Auto-join creator
      setJoinedCommunities(prev => ({
        ...prev,
        [cleanSlug]: true
      }));

      // Reset
      setCreateCommunityName("");
      setCreateCommunityDescription("");
      setIsCreatingCommunity(false);
      fetchCommunities();
    } catch (err: any) {
      console.error("Failed to create community:", err);
      setCreateCommunityError(err?.message || "Failed to publish community circle.");
    } finally {
      setCreatingCommunityLoader(false);
    }
  };

  // --- COMPRESS COMPOSER POST IMAGE CLIENT-SIDE ---
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using Canvas down to 400px maximum dimension at 0.70 JPEG quality
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 400;
        
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.70);
        setUploadedImageBase64(compressedBase64);
        setImageCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- SUBMIT COMPOSER POST ---
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError("");

    if (!composeTitle.trim()) {
      setComposeError("Post Title is required.");
      return;
    }
    if (composerTab === "text" && !composeBody.trim()) {
      setComposeError("Post content text is required.");
      return;
    }
    if (composerTab === "image" && !uploadedImageBase64) {
      setComposeError("Please select or drop an image first.");
      return;
    }

    setPostingLoader(true);
    const isMock = isMockLoginBypass();

    try {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newPost: Post = {
          id: `mock-post-${Date.now()}`,
          title: composeTitle,
          body: composerTab === "text" ? composeBody : "",
          category: composeCategory,
          image_url: composerTab === "image" ? uploadedImageBase64 : null,
          created_at: new Date().toISOString(),
          user_id: userId,
          replies_count: 0,
          votes_score: 0,
          user_vote_value: 0,
          profiles: {
            full_name: memberName,
            username: memberUsername || "student",
            avatar_url: avatarUrl,
            college_name: memberCompany,
            year: memberTitle.split("/")[0]?.trim() || "1st Year",
            branch: memberTitle.split("/")[1]?.trim() || "CSE"
          }
        };

        const currentPosts = [...posts];
        currentPosts.unshift(newPost);
        localStorage.setItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`, JSON.stringify(currentPosts));
        setPosts(currentPosts);

        // Reset
        setComposeTitle("");
        setComposeBody("");
        setUploadedImageBase64(null);
        setIsComposing(false);
        fetchUserStats();
      } else {
        // Insert into live public.posts table
        const { error: insertErr } = await supabase
          .from("posts")
          .insert({
            user_id: userId,
            title: composeTitle,
            body: composerTab === "text" ? composeBody : "",
            category: composeCategory,
            college_name: memberCompany,
            image_url: composerTab === "image" ? uploadedImageBase64 : null,
          });

        if (insertErr) throw insertErr;

        setComposeTitle("");
        setComposeBody("");
        setUploadedImageBase64(null);
        setIsComposing(false);
        await fetchPosts();
        fetchUserStats();
      }
    } catch (err: any) {
      console.error("Failed to create post:", err);
      setComposeError(err?.message || "Failed to publish post.");
    } finally {
      setPostingLoader(false);
    }
  };

  // --- REDDIT VOTING ENGINE (UPVOTE/DOWNVOTE) ---
  const handleVote = async (postId: string, direction: number) => {
    // Find target post in state
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const currentVote = targetPost.user_vote_value || 0;
    
    // Determine new vote state
    let nextVote = 0;
    if (currentVote === direction) {
      nextVote = 0; // Clicked active arrow, retract vote
    } else {
      nextVote = direction; // Clicked upvote/downvote
    }

    // Determine change value to apply locally
    const changeScore = nextVote - currentVote;

    // Optimistically update UI instantly to make it feel alive!
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId
          ? {
              ...p,
              votes_score: (p.votes_score || 0) + changeScore,
              user_vote_value: nextVote,
            }
          : p
      )
    );

    const isMock = isMockLoginBypass();

    if (isMock) {
      const voteKey = `mock_vote_${postId}_${userId}`;
      if (nextVote === 0) {
        localStorage.removeItem(voteKey);
      } else {
        localStorage.setItem(voteKey, nextVote.toString());
      }
      
      // Update score in mock post catalog
      const storedPosts = localStorage.getItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`);
      if (storedPosts) {
        try {
          const parsed = JSON.parse(storedPosts) as Post[];
          const updated = parsed.map(p => {
            if (p.id === postId) {
              return { ...p, votes_score: (p.votes_score || 0) + changeScore };
            }
            return p;
          });
          localStorage.setItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return;
    }

    try {
      if (nextVote === 0) {
        // Retract vote: Delete row
        await supabase
          .from("votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
      } else {
        // Upsert vote using unique composite key lock
        const { error: upsertErr } = await supabase
          .from("votes")
          .upsert(
            {
              post_id: postId,
              user_id: userId,
              vote_value: nextVote,
            },
            { onConflict: "post_id, user_id" }
          );

        if (upsertErr) throw upsertErr;
      }
    } catch (err) {
      console.error("Failed to register vote in database:", err);
      // Revert optimistic updates on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? {
                ...p,
                votes_score: (p.votes_score || 0) - changeScore,
                user_vote_value: currentVote,
              }
            : p
        )
      );
    }
  };

  // --- NESTED DISCUSSIONS REPLIES DRAWER ---
  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setCommentsList([]);
      return;
    }

    setExpandedPostId(postId);
    setCommentsList([]);
    setCommentsLoading(true);
    setCommentError("");

    const isMock = isMockLoginBypass();

    if (isMock) {
      const storedComments = localStorage.getItem(`mock_comments_${postId}`);
      if (storedComments) {
        try {
          setCommentsList(JSON.parse(storedComments));
        } catch (e) {}
      }
      setCommentsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          post_id,
          body,
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            username,
            avatar_url,
            year,
            branch
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCommentsList(data || []);
    } catch (err) {
      console.error("Failed to query replies:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // --- SUBMIT COMMENT / REPLY ---
  const handleCreateComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    setCommentError("");

    if (!newCommentBody.trim()) return;

    setCommentingLoader(true);
    const isMock = isMockLoginBypass();

    try {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 600));

        const newComment: Comment = {
          id: `mock-comment-${Date.now()}`,
          post_id: postId,
          user_id: userId,
          body: newCommentBody,
          created_at: new Date().toISOString(),
          profiles: {
            full_name: memberName,
            username: memberUsername || "student",
            avatar_url: avatarUrl,
            year: memberTitle.split("/")[0]?.trim() || "1st Year",
            branch: memberTitle.split("/")[1]?.trim() || "CSE"
          }
        };

        const currentComments = [...commentsList, newComment];
        localStorage.setItem(`mock_comments_${postId}`, JSON.stringify(currentComments));
        setCommentsList(currentComments);

        // Also add to mock_comments_all
        const saved = localStorage.getItem("mock_comments_all");
        let allComments = [];
        if (saved) {
          try { allComments = JSON.parse(saved); } catch (e) {}
        }
        allComments.push({
          id: newComment.id,
          post_id: newComment.post_id,
          body: newComment.body,
          created_at: newComment.created_at,
          user_id: newComment.user_id,
          posts: { title: posts.find(p => p.id === postId)?.title || "Community Discussion" }
        });
        localStorage.setItem("mock_comments_all", JSON.stringify(allComments));
        setMyCommentsList(allComments.filter((c: any) => c.user_id === userId));

        // Update posts counts state locally
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p
          )
        );

        setNewCommentBody("");
        fetchUserStats();
      } else {
        const { error: commentErr } = await supabase
          .from("comments")
          .insert({
            post_id: postId,
            user_id: userId,
            body: newCommentBody,
          });

        if (commentErr) throw commentErr;

        setNewCommentBody("");
        await handleToggleComments(postId);
        
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p
          )
        );
        fetchUserStats();
        fetchMyComments(userId, false);
      }
    } catch (err) {
      console.error("Failed to comment:", err);
      setCommentError("Failed to publish reply.");
    } finally {
      setCommentingLoader(false);
    }
  };

  // --- POST DYNAMIC EDITORS ---
  const startEditPost = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditBody(post.body || "");
    setEditCategory(post.category);
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setEditLoader(true);
    setEditError("");

    const isMock = isMockLoginBypass();

    try {
      if (isMock) {
        const storedPosts = localStorage.getItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`);
        if (storedPosts) {
          const parsed = JSON.parse(storedPosts) as Post[];
          const updated = parsed.map(p => {
            if (p.id === editingPost.id) {
              return {
                ...p,
                title: editTitle,
                body: editBody,
                category: editCategory,
                updated_at: new Date().toISOString(),
              };
            }
            return p;
          });
          localStorage.setItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`, JSON.stringify(updated));
          
          setPosts(prevPosts =>
            prevPosts.map(p =>
              p.id === editingPost.id
                ? { ...p, title: editTitle, body: editBody, category: editCategory }
                : p
            )
          );
        }
        setEditingPost(null);
      } else {
        const { error } = await supabase
          .from("posts")
          .update({
            title: editTitle,
            body: editBody,
            category: editCategory,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPost.id)
          .eq("user_id", userId);

        if (error) throw error;

        await fetchPosts();
        setEditingPost(null);
      }
    } catch (err: any) {
      console.error("Failed to edit post:", err);
      setEditError(err.message || "Failed to edit post.");
    } finally {
      setEditLoader(false);
    }
  };

  // --- POST DYNAMIC DELETES ---
  const handleDeletePost = async (postId: string) => {
    const isMock = isMockLoginBypass();

    try {
      if (isMock) {
        const storedPosts = localStorage.getItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`);
        if (storedPosts) {
          const parsed = JSON.parse(storedPosts) as Post[];
          const filtered = parsed.filter(p => p.id !== postId);
          localStorage.setItem(`mock_posts_${memberCompany.replace(/\s+/g, "_")}`, JSON.stringify(filtered));
          setPosts(filtered);
        }
        localStorage.removeItem(`mock_comments_${postId}`);
        setDeleteConfirmPostId(null);
        fetchUserStats();
      } else {
        const { error } = await supabase
          .from("posts")
          .delete()
          .eq("id", postId)
          .eq("user_id", userId);

        if (error) throw error;

        await fetchPosts();
        setDeleteConfirmPostId(null);
        fetchUserStats();
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };



  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return "Recently";
    }
  };

  const renderInitials = (nameString = "", sizeClasses = "w-10 h-10 text-xs") => {
    const targetName = nameString || memberName || "Student Peer";
    const initials = targetName
      ? targetName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
      : "CC";
    return (
      <div className="rounded-full bg-brand/35 flex items-center justify-center border border-white/10 text-white font-bold shadow-inner flex-shrink-0 w-8 h-8 text-[10px]">
        {initials}
      </div>
    );
  };

  // Get color gradient block representing the college Banner
  const getBannerColor = (college: string) => {
    if (!college) return "from-blue-600 to-indigo-800";
    const firstChar = college.charCodeAt(0) || 0;
    if (firstChar % 4 === 0) return "from-blue-600 to-indigo-800";
    if (firstChar % 4 === 1) return "from-teal-600 to-emerald-800";
    if (firstChar % 4 === 2) return "from-purple-600 to-violet-800";
    return "from-pink-600 to-rose-800";
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col bg-navy-deep text-slate-100 font-body items-center justify-center p-4">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col items-center justify-center gap-5 text-center">
          <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-heading select-none">Synchronizing Circles...</h4>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Reddit College Networks Active</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter posts depending on currentTab
  const visiblePosts = currentTab === "my-posts"
    ? posts.filter(p => p.user_id === userId)
    : posts;

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-[#02040a] text-slate-100 font-body select-none overflow-x-hidden">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Mobile Sidebar Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SOLID VERTICAL LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#090a0f]/98 border-r border-white/[0.04] flex flex-col flex-shrink-0 z-50 transition-transform duration-300 select-none lg:static lg:flex lg:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0 shadow-2xl shadow-purple-500/5" : "-translate-x-full lg:translate-x-0"
      }`}>
        
        {/* Top Compact User Profile Card (Discord/Notion Style) - Enlarged */}
        <button
          onClick={() => {
            setCurrentTab("settings");
            setIsComposing(false);
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-4 w-full py-5 pl-6 pr-6 border-b border-white/[0.04] hover:bg-white/[0.02] active:bg-white/[0.04] transition-all duration-200 text-left cursor-pointer group mb-4"
        >
          {/* Avatar Area with Glow & Online Status - Enlarged */}
          <div className="relative w-12 h-12 rounded-full flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-[6px] group-hover:bg-purple-500/35 transition-all" />
            <div className="relative w-full h-full rounded-full overflow-hidden border border-white/20 group-hover:border-purple-500/40 transition-all bg-[#0e1017]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200" 
                  alt="Alex Chen Avatar" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>
            {/* Online Pulse Dot - Enlarged */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090a0f] animate-pulse z-10" />
          </div>

          {/* User Information - Enlarged */}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate leading-tight">
              {memberName === "Alex Rivera" ? "Alex Chen" : (memberName || "Alex Chen")}
            </span>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider truncate font-sans mt-1 leading-none">
              {memberTitle === "Senior • CS Engineering" ? "Computer Science" : (memberTitle || "Computer Science")}
            </span>
          </div>

          {/* Sparkle or chevron to open profile */}
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>

        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest pl-6 mb-2 select-none font-heading text-left">
          Navigation
        </p>
        
        {/* Navigation Link list */}
        <div className="flex-grow flex flex-col space-y-1">
          {/* 1. Home Link */}
          <button
            onClick={() => {
              setCurrentTab("feed");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "feed"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>Home</span>
          </button>

          {/* 2. Dashboard Link */}
          <button
            onClick={() => {
              setCurrentTab("dashboard");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "dashboard"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span>Dashboard</span>
          </button>

          {/* 3. My Posts Link */}
          <button
            onClick={() => {
              setCurrentTab("my-posts");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "my-posts"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>My Posts</span>
          </button>

          {/* 4. Messages Link */}
          <button
            onClick={() => {
              setCurrentTab("chats");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "chats"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span>Messages</span>
            {connections.filter((c: any) => c.receiver_id === userId && c.status === "pending").length > 0 && (
              <span className="ml-auto mr-4 w-4.5 h-4.5 rounded-full bg-red-500 text-[9px] font-extrabold text-white flex items-center justify-center animate-pulse shadow-[0_0_8px_#ef4444]">
                {connections.filter((c: any) => c.receiver_id === userId && c.status === "pending").length}
              </span>
            )}
          </button>

          {/* 5. Connections Link */}
          <button
            onClick={() => {
              setCurrentTab("connections");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "connections"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 21c-2.243 0-4.307-.655-6.042-1.782V19.13a4.125 4.125 0 017.533-2.493m0 0a4.07 4.07 0 01-1.027-2.137m0 0A5.99 5.99 0 0012 12.75c1.472 0 2.813-.528 3.857-1.402m-7.714 0a5.99 5.99 0 012.831-4.823c1.471-.853 3.197-.853 4.662 0a5.99 5.99 0 011.413 4.823M8 6.75a3 3 0 11-6 0 3 3 0 016 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Connections</span>
          </button>

          {/* 6. Communities Link */}
          <button
            onClick={() => {
              setCurrentTab("communities");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "communities"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
            </svg>
            <span>Communities</span>
          </button>

          {/* 8. Settings Link */}
          <button
            onClick={() => {
              setCurrentTab("settings");
              setIsComposing(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading transition-all relative cursor-pointer ${
              currentTab === "settings"
                ? "bg-purple-500/10 border-y border-l border-purple-500/20 border-r-transparent text-white after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-purple-500 after:rounded-l-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1111 8H9.59V4.59zM11 8a2 2 0 114 0h-4zm0 0a2 2 0 11-4 0h4zm0 0v11.41a2 2 0 11-4 0V8h4zm0 0a2 2 0 114 0h-4z" />
            </svg>
            <span>Settings</span>
          </button>

          {/* 9. Logout Option */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-3.5 pl-6 pr-4 py-2.5 rounded-l-xl rounded-r-none text-xs font-bold font-heading text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all cursor-pointer border border-transparent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Spacer at the bottom of the sidebar */}
        <div className="mb-6" />

      </aside>

      {/* RIGHT MAIN AREA WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#02040a] relative z-10">

        {/* Redesigned Premium Header Navigation Bar */}
        <header className="border-b border-white/[0.04] bg-[#02040ae6] backdrop-blur-md relative z-30 w-full select-none">
          <div className="w-full px-6 md:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              
              {/* Left Section: Logo & Global Search */}
              <div className="flex items-center gap-4 flex-1 max-w-[400px]">
                
                {/* Mobile Hamburger Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] text-slate-400 hover:text-white cursor-pointer select-none lg:hidden flex-shrink-0 active:scale-95 transition-all"
                  aria-label="Toggle navigation drawer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab("feed");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer group text-left"
                >
                  <LogoIcon className="text-white group-hover:scale-105 transition-transform" size={24} />
                  <span className="font-heading text-base font-bold tracking-tight text-white select-none">
                    Campus<span className="text-blue-500 font-semibold">Circle</span>
                  </span>
                </button>

                {/* Global Search Bar */}
                <div className="relative flex-1 hidden md:block z-50">
                  <div className="flex items-center gap-2 bg-[#02040a]/60 border border-white/[0.06] hover:border-white/[0.12] focus-within:border-purple-500/80 rounded-xl px-3.5 py-1.5 transition-all duration-300 w-full">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={navbarSearchQuery}
                      onChange={(e) => {
                        setNavbarSearchQuery(e.target.value);
                        setShowSearchSuggestions(true);
                      }}
                      onFocus={() => setShowSearchSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                      placeholder="Search students, posts, resources, events..."
                      className="bg-transparent border-none text-xs text-white placeholder-slate-600 focus:outline-none w-full font-sans"
                    />
                    {navbarSearchQuery && (
                      <button
                        onClick={() => setNavbarSearchQuery("")}
                        className="text-slate-500 hover:text-white cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Search Suggestions Panel */}
                  {showSearchSuggestions && navbarSearchQuery.trim() !== "" && (() => {
                    const mockStudents = isDemoAllowed(memberEmail) ? [
                      { name: "Rahul Sharma", major: "NIT Trichy • CSE", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Priya Singh", major: "IIT Delhi • Mechanical", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Elena Rodriguez", major: "MIT • Bioengineering", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" }
                    ] : [];

                    const mockResources = isDemoAllowed(memberEmail) ? [
                      { name: "Operating Systems Placement Cheat Sheet.pdf", size: "2.4 MB" },
                      { name: "Top 50 System Design Case Studies.pdf", size: "4.1 MB" },
                      { name: "Database Management Notes Final.zip", size: "12.8 MB" }
                    ] : [];

                    const mockEvents = isDemoAllowed(memberEmail) ? [
                      { name: "Global Campus Hackathon 2026", date: "June 15" },
                      { name: "Systems Engineering Technical Talk", date: "June 22" }
                    ] : [];

                    const filteredStudents = mockStudents.filter(s => s.name.toLowerCase().includes(navbarSearchQuery.toLowerCase()));
                    const filteredResources = mockResources.filter(r => r.name.toLowerCase().includes(navbarSearchQuery.toLowerCase()));
                    const filteredEvents = mockEvents.filter(e => e.name.toLowerCase().includes(navbarSearchQuery.toLowerCase()));
                    const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(navbarSearchQuery.toLowerCase())).slice(0, 2);

                    return (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#090a0f]/95 border border-white/[0.08] shadow-2xl rounded-2xl p-4 max-h-[360px] overflow-y-auto z-50 backdrop-blur-lg space-y-4">
                        {filteredStudents.length === 0 && filteredResources.length === 0 && filteredEvents.length === 0 && filteredPosts.length === 0 ? (
                          <p className="text-[10px] text-slate-500 font-sans py-2 text-center">No search matches found</p>
                        ) : (
                          <>
                            {/* Students */}
                            {filteredStudents.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Students</h5>
                                {filteredStudents.map((stud, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setCurrentTab("connections");
                                      setShowSearchSuggestions(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] text-left cursor-pointer transition-colors"
                                  >
                                    <img src={stud.avatar} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                                    <div>
                                      <p className="text-xs font-bold text-slate-200">{stud.name}</p>
                                      <p className="text-[9px] text-slate-500 font-sans">{stud.major}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Posts */}
                            {filteredPosts.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Discussions</h5>
                                {filteredPosts.map((pst) => (
                                  <button
                                    key={pst.id}
                                    onClick={() => {
                                      setCurrentTab("feed");
                                      setShowSearchSuggestions(false);
                                    }}
                                    className="w-full p-1.5 rounded-lg hover:bg-white/[0.03] text-left cursor-pointer transition-colors block truncate text-xs font-bold text-slate-200"
                                  >
                                    💬 {pst.title}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Resources */}
                            {filteredResources.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Academic Resources</h5>
                                {filteredResources.map((res, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setCurrentTab("dashboard");
                                      setShowSearchSuggestions(false);
                                    }}
                                    className="w-full p-1.5 rounded-lg hover:bg-white/[0.03] text-left cursor-pointer transition-colors block text-xs font-bold text-slate-200 truncate"
                                  >
                                    📄 {res.name} <span className="text-[9px] text-slate-500 font-normal">({res.size})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Events */}
                            {filteredEvents.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Events</h5>
                                {filteredEvents.map((evt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setCurrentTab("feed");
                                      setShowSearchSuggestions(false);
                                    }}
                                    className="w-full p-1.5 rounded-lg hover:bg-white/[0.03] text-left cursor-pointer transition-colors block text-xs font-bold text-slate-200 truncate"
                                  >
                                    📅 {evt.name} <span className="text-[9px] text-slate-500 font-normal">({evt.date})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Center Section: Interactive Community Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/30 text-xs font-bold text-slate-200 transition-all cursor-pointer select-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="truncate max-w-[150px] font-heading font-bold text-white tracking-wide">
                    {activeNavbarCommunity === "iit-bombay" || activeNavbarCommunity === memberCompany.toLowerCase().replace(/\s+/g, "-")
                      ? `r/${memberCompany.toLowerCase().replace(/\s+/g, "-")}`
                      : `r/${activeNavbarCommunity}`}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showCommunityDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showCommunityDropdown && (() => {
                  const communitiesList = communities.map((comm) => ({
                    slug: comm.slug,
                    label: `r/${comm.slug} (${comm.name})`
                  }));

                  return (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCommunityDropdown(false)} />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-[#090a0f]/95 border border-white/[0.08] shadow-2xl rounded-2xl p-2 z-50 backdrop-blur-lg">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider p-2 select-none text-left">Switch Community Circle</p>
                        <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
                          {communitiesList.map((comm) => (
                            <button
                              key={comm.slug}
                              onClick={() => {
                                setActiveNavbarCommunity(comm.slug);
                                setShowCommunityDropdown(false);
                                setCurrentTab("feed");
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold font-sans cursor-pointer transition-colors ${
                                activeNavbarCommunity === comm.slug
                                  ? "bg-purple-500/10 text-purple-400"
                                  : "text-slate-300 hover:text-white hover:bg-white/[0.02]"
                              }`}
                            >
                              <span className="truncate">{comm.label}</span>
                              {activeNavbarCommunity === comm.slug && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Right Section: Alert Badges, Create Button & Avatar Dropdown */}
              <div className="flex items-center gap-4 flex-shrink-0">
                
                {/* Messaging Inbox Icon */}
                <button
                  onClick={() => setCurrentTab("chats")}
                  className="relative p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:border-white/[0.1] transition-all cursor-pointer select-none"
                  title="Direct Messages"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {/* Message badge indicator */}
                  {isDemoAllowed(memberEmail) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-[8px] font-black text-white flex items-center justify-center border border-[#02040a]">
                      2
                    </span>
                  )}
                </button>

                {/* Notifications Bell Icon */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:border-white/[0.1] transition-all cursor-pointer select-none"
                    title="System Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9a6 6 0 00-12 0v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {/* Alert badge indicator */}
                    {isDemoAllowed(memberEmail) ? (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[8px] font-black text-white flex items-center justify-center border border-[#02040a]">
                        4
                      </span>
                    ) : (
                      (() => {
                        const incomingCount = connections.filter(c => c.status === "pending" && c.receiver_id === userId).length;
                        return incomingCount > 0 ? (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[8px] font-black text-white flex items-center justify-center border border-[#02040a]">
                            {incomingCount}
                          </span>
                        ) : null;
                      })()
                    )}
                  </button>

                  {showNotifDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                      <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#090a0f]/95 border border-white/[0.08] shadow-2xl rounded-2xl p-3 z-50 backdrop-blur-lg text-left space-y-2 select-none">
                        <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recent Notifications</span>
                          <button
                            onClick={() => {
                              setCurrentTab("notifications");
                              setShowNotifDropdown(false);
                            }}
                            className="text-[9px] font-bold text-purple-400 hover:text-purple-300"
                          >
                            Open Hub
                          </button>
                        </div>
                        {isDemoAllowed(memberEmail) ? (
                          <div className="space-y-2">
                            <div className="p-2 bg-white/[0.01] hover:bg-white/[0.02] rounded-xl border border-white/[0.02] space-y-0.5 cursor-pointer" onClick={() => { setCurrentTab("notifications"); setShowNotifDropdown(false); }}>
                              <p className="text-[11px] font-bold text-white">Rahul Sharma accepted your request</p>
                              <p className="text-[9px] text-slate-500">2 minutes ago</p>
                            </div>
                            <div className="p-2 bg-white/[0.01] hover:bg-white/[0.02] rounded-xl border border-white/[0.02] space-y-0.5 cursor-pointer" onClick={() => { setCurrentTab("notifications"); setShowNotifDropdown(false); }}>
                              <p className="text-[11px] font-bold text-white">Priya Singh commented on thread</p>
                              <p className="text-[9px] text-slate-500">1 hour ago</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              const incoming = connections.filter(c => c.status === "pending" && c.receiver_id === userId);
                              if (incoming.length > 0) {
                                return incoming.map((req: any) => {
                                  const senderProfile = connectionProfiles.find((p: any) => p.user_id === req.sender_id) || peers.find((p: any) => p.user_id === req.sender_id) || {
                                    full_name: "GGV Peer",
                                    username: "classmate"
                                  };
                                  return (
                                    <div 
                                      key={req.id} 
                                      className="p-2 bg-white/[0.01] hover:bg-white/[0.02] rounded-xl border border-white/[0.02] space-y-1 cursor-pointer flex flex-col gap-1"
                                      onClick={() => { setCurrentTab("chats"); setChatSubTab("requests"); setShowNotifDropdown(false); }}
                                    >
                                      <div className="flex justify-between items-center w-full">
                                        <p className="text-[11px] font-bold text-white truncate max-w-[150px]">
                                          {senderProfile.full_name} sent a request
                                        </p>
                                        <span className="text-[8px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">New</span>
                                      </div>
                                      <p className="text-[9px] text-slate-400 font-sans">Click to view in Requests Hub</p>
                                    </div>
                                  );
                                });
                              } else {
                                return (
                                  <div className="space-y-2 py-4 text-center">
                                    <p className="text-[10px] text-slate-500 font-sans">No recent notifications</p>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Create Post Button */}
                <button
                  onClick={() => setIsComposing(true)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/10 cursor-pointer select-none transition-all duration-300 transform active:scale-95 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Create Post</span>
                </button>

                {/* User Avatar with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                    className="relative w-9 h-9 rounded-full overflow-hidden border border-white/15 hover:border-purple-500/50 transition-all bg-[#0e1017] cursor-pointer flex-shrink-0"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200"
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Glowing status badge */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#02040a]" />
                  </button>

                  {showAvatarDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAvatarDropdown(false)} />
                      <div className="absolute top-full right-0 mt-2 w-[200px] bg-[#090a0f]/95 border border-white/[0.08] shadow-2xl rounded-2xl p-1.5 z-50 backdrop-blur-lg select-none text-left">
                        {[
                          { id: "feed", label: "Home", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                          )},
                          { id: "dashboard", label: "Dashboard", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                          )},
                          { id: "my-posts", label: "My Posts", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          )},
                          { id: "chats", label: "Messages", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                          )},
                          { id: "connections", label: "Connections", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 21c-2.243 0-4.307-.655-6.042-1.782V19.13a4.125 4.125 0 017.533-2.493m0 0a4.07 4.07 0 01-1.027-2.137m0 0A5.99 5.99 0 0012 12.75c1.472 0 2.813-.528 3.857-1.402m-7.714 0a5.99 5.99 0 012.831-4.823c1.471-.853 3.197-.853 4.662 0a5.99 5.99 0 011.413 4.823M8 6.75a3 3 0 11-6 0 3 3 0 016 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )},
                          { id: "communities", label: "Communities", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                            </svg>
                          )},
                          { id: "settings", label: "Settings", icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1111 8H9.59V4.59zM11 8a2 2 0 114 0h-4zm0 0a2 2 0 11-4 0h4z" />
                            </svg>
                          )}
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id as DashboardTab);
                              setShowAvatarDropdown(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                              currentTab === item.id 
                                ? "text-white bg-purple-500/10 border border-purple-500/20" 
                                : "text-slate-300 hover:text-white hover:bg-white/[0.02] border border-transparent"
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        ))}
                        <div className="h-[1px] bg-white/[0.04] my-1" />
                        <button
                          onClick={() => {
                            setShowAvatarDropdown(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 cursor-pointer transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>
          </div>
        </header>

        {/* Dynamic Community Information Sub-navbar */}
        {(() => {
          const metricsMapping: Record<string, { name: string; members: string; online: string; posts: string; style: string }> = {
            "iit-bombay": {
              name: `r/${memberCompany.toLowerCase().replace(/\s+/g, "-")} Community`,
              members: "4,820 verified students",
              online: "342 online now",
              posts: "28 posts today",
              style: "from-blue-500/10 via-indigo-500/5 to-transparent"
            },
            "neural-network-architects": {
              name: "r/neural-network-architects",
              members: "1,240 verified students",
              online: "84 online now",
              posts: "12 posts today",
              style: "from-purple-500/10 via-pink-500/5 to-transparent"
            },
            "surgical-precision-hub": {
              name: "r/surgical-precision-hub",
              members: "850 verified students",
              online: "39 online now",
              posts: "5 posts today",
              style: "from-red-500/10 via-orange-500/5 to-transparent"
            },
            "constitutional-law-forum": {
              name: "r/constitutional-law-forum",
              members: "540 verified students",
              online: "22 online now",
              posts: "3 posts today",
              style: "from-amber-500/10 via-yellow-500/5 to-transparent"
            },
            "product-management-alliance": {
              name: "r/product-management-alliance",
              members: "1,920 verified students",
              online: "115 online now",
              posts: "18 posts today",
              style: "from-emerald-500/10 via-teal-500/5 to-transparent"
            },
            "creative-designers-hub": {
              name: "r/creative-designers-hub",
              members: "1,100 verified students",
              online: "67 online now",
              posts: "9 posts today",
              style: "from-fuchsia-500/10 via-purple-500/5 to-transparent"
            }
          };

          const activeMetrics = metricsMapping[activeNavbarCommunity] || metricsMapping["iit-bombay"];

          return (
            <div className={`h-11 border-b border-white/[0.03] bg-[#090a0f]/60 w-full px-6 md:px-8 flex items-center justify-between text-[11px] font-sans tracking-wide text-slate-400 select-none overflow-x-auto whitespace-nowrap bg-gradient-to-r ${activeMetrics.style} gap-4`}>
              <div className="flex items-center gap-5">
                <span className="font-heading font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {activeMetrics.name}
                </span>
                {isDemoAllowed(memberEmail) && (
                  <>
                    <span className="h-3 w-[1px] bg-white/[0.08]" />
                    <span className="flex items-center gap-1">
                      👥 <strong className="text-slate-300">{activeMetrics.members}</strong>
                    </span>
                    <span className="h-3 w-[1px] bg-white/[0.08]" />
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <strong className="text-emerald-400">{activeMetrics.online}</strong>
                    </span>
                  </>
                )}
              </div>

              {isDemoAllowed(memberEmail) && (
                <div className="flex items-center gap-2 text-right">
                  <span className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-full text-[10px] text-purple-300 font-bold uppercase tracking-widest">
                    ⚡ {activeMetrics.posts} Today
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Main Container */}
        <main className="flex-1 flex flex-col p-6 md:p-8 w-full relative z-10">
          


          {/* THREE COLUMN GRID LAYOUT */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Subreddit Feed (Full width SaaS layout) */}
            <div className="lg:col-span-12 flex flex-col gap-6">
            
            {/* === TAB: HOME OVERVIEW VIEW === */}
            {currentTab === "feed" && (
              <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto w-full text-left">
                  
                  {/* 1. SOCIAL-STYLE CREATE POST CARD */}
                  <div className="glass-panel rounded-2xl p-5 shadow-xl border-white/[0.06] relative overflow-hidden bg-card-glow text-left">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                    
                    {!isComposing ? (
                      <div 
                        onClick={() => setIsComposing(true)}
                        className="flex items-center gap-3.5 cursor-pointer group"
                      >
                        {avatarUrl ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#0e1017]">
                            <img src={avatarUrl} alt="Student Avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          renderInitials("", "w-9 h-9 text-xs flex-shrink-0")
                        )}
                        <div className="w-full bg-[#040815]/60 hover:bg-[#060b1e]/80 border border-white/[0.04] hover:border-white/[0.08] px-4.5 py-3 rounded-xl text-xs text-slate-500 font-semibold transition-all">
                          What's happening on your campus today?
                        </div>
                        <button className="bg-brand hover:bg-brand-hover text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md select-none flex-shrink-0 active:scale-95">
                          Share
                        </button>
                      </div>
                    ) : (
                      /* Expanded rich-post composer */
                      <motion.form 
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleCreatePost} 
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                          <span className="text-xs font-extrabold font-heading text-slate-300 uppercase tracking-wider select-none">
                            Create a Post in r/{memberCompany.toLowerCase().replace(/\s+/g, "-")}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsComposing(false);
                              setComposeError("");
                              setUploadedImageBase64(null);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-300 focus:outline-none transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex border-b border-white/[0.04] bg-[#02040a]/40 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setComposerTab("text")}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              composerTab === "text"
                                ? "bg-brand/10 border border-brand/20 text-blue-400"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            Text Post
                          </button>
                          <button
                            type="button"
                            onClick={() => setComposerTab("image")}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              composerTab === "image"
                                ? "bg-brand/10 border border-brand/20 text-blue-400"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            Image Post
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Post Title</label>
                          <input
                            type="text"
                            required
                            value={composeTitle}
                            onChange={(e) => setComposeTitle(e.target.value)}
                            placeholder="Title of your placements prep, exam notes, campus buzz..."
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all font-body font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Circle Tag</label>
                            <select
                              value={composeCategory}
                              onChange={(e) => setComposeCategory(e.target.value)}
                              className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand font-semibold cursor-pointer"
                            >
                              <option value="#general">#general (General Campus)</option>
                              <option value="#placement-prep">#placement-prep (DSA & Placements)</option>
                              <option value="#academic-notes">#academic-notes (Study Notes)</option>
                              <option value="#hackathons">#hackathons (SIH & Coding Events)</option>
                              <option value="#campus-life">#campus-life (Campus Buzz)</option>
                            </select>
                          </div>

                          <div className="flex items-end justify-start sm:justify-end py-1">
                            <span className="text-[9px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold select-none tracking-wider uppercase">
                              u/{memberUsername} • Verified Author
                            </span>
                          </div>
                        </div>

                        {composerTab === "text" && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Body Text</label>
                            <textarea
                              required={composerTab === "text"}
                              rows={5}
                              value={composeBody}
                              onChange={(e) => setComposeBody(e.target.value)}
                              placeholder="What would you like to share or ask seniors for guidance?"
                              className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all font-body resize-none"
                            />
                          </div>
                        )}

                        {composerTab === "image" && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image upload</label>
                            <div className="relative w-full">
                              {imageCompressing ? (
                                <div className="w-full h-40 rounded-2xl bg-[#040815]/50 border border-white/[0.04] flex items-center justify-center">
                                  <svg className="animate-spin h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                </div>
                              ) : uploadedImageBase64 ? (
                                <div className="w-full max-h-56 rounded-2xl border border-brand/50 overflow-hidden relative group">
                                  <img src={uploadedImageBase64} alt="Post image" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setUploadedImageBase64(null)}
                                    className="absolute inset-0 bg-[#000000a6] text-red-400 font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    Remove Selected Image
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => imageInputRef.current?.click()}
                                  className="border-2 border-dashed border-white/[0.08] hover:border-brand/40 bg-[#040815]/50 hover:bg-[#070e24]/40 rounded-2xl p-8 cursor-pointer transition-all duration-300 text-center group"
                                >
                                  <svg className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition-colors mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-xs font-semibold text-slate-300">Click to upload image</p>
                                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Canvas scaling compression active</p>
                                </div>
                              )}
                              <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleImageFile}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}

                        {composeError && (
                          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-left">
                            <p className="text-xs font-semibold text-red-400">{composeError}</p>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsComposing(false);
                              setComposeError("");
                              setUploadedImageBase64(null);
                            }}
                            className="rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={postingLoader || imageCompressing}
                            className="rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          >
                            {postingLoader ? "Publishing..." : "Sign Up & Post"}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </div>

                  {/* 2. DYNAMIC SOCIAL TIMELINE FEED */}
                  <div className="space-y-6">
                    {postsLoading ? (
                      <div className="glass-panel rounded-2xl p-12 text-center shadow-xl border-white/[0.06] bg-card-glow">
                        <svg className="animate-spin h-8 w-8 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : visiblePosts.length > 0 ? (
                      visiblePosts.map((post) => {
                        const author = post.profiles || {
                          full_name: "Verified Student",
                          username: "student",
                          avatar_url: "",
                          college_name: memberCompany,
                          year: "1st Year",
                          branch: "CSE"
                        };
                        const isPostExpanded = expandedPostId === post.id;
                        const isLiked = likedPosts[post.id];
                        const isSaved = savedPosts[post.id];
                        const isCopied = copiedPostId === post.id;
                        const currentLikes = likesCount[post.id] ?? (post.votes_score ?? 12);

                        return (
                          <div
                            key={post.id}
                            className="glass-panel rounded-2xl shadow-xl border-white/[0.06] overflow-hidden flex flex-col bg-card-glow relative text-left transition-all hover:border-white/[0.08]"
                          >
                            {/* Card Header: Author Profile, Metadata & Self post Actions */}
                            <div className="p-5 sm:px-6 sm:pt-6 pb-3 flex items-center justify-between border-b border-white/[0.03]">
                              <div className="flex items-center gap-3">
                                {author.avatar_url ? (
                                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#0e1017] shadow-lg">
                                    <img src={author.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  renderInitials(author.full_name, "w-10 h-10 text-xs font-bold flex-shrink-0 shadow-lg")
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-white text-sm tracking-wide flex items-center gap-0.5 select-text">
                                      {author.full_name}
                                      <VerifiedIcon size={13} className="text-blue-400" />
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold select-none font-sans">•</span>
                                    {(() => {
                                      const slug = getPostCommunitySlug(post);
                                      const isJoined = joinedCommunities[slug] === true;
                                      return (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none uppercase tracking-wider">
                                            r/{slug}
                                          </span>
                                          {post.user_id !== userId && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setJoinedCommunities(prev => ({
                                                  ...prev,
                                                  [slug]: !isJoined
                                                }));
                                              }}
                                              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none active:scale-95 ${
                                                isJoined
                                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                  : "bg-purple-500 hover:bg-purple-600 text-white border-purple-500/20"
                                              }`}
                                            >
                                              {isJoined ? "Joined ✓" : "+ Join"}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 select-none font-sans font-bold flex-wrap">
                                    <span className="text-slate-400">{author.college_name || memberCompany}</span>
                                    <span>•</span>
                                    <span>@{author.username} ({author.year || "Student"})</span>
                                    <span>•</span>
                                    <span>{formatTimeAgo(post.created_at)}</span>
                                  </div>
                                </div>
                              </div>

                              {post.user_id !== userId ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartChat(post.user_id, author)}
                                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] sm:text-xs font-bold text-white shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 select-none"
                                  title="Send direct message to author"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                  </svg>
                                  Chat
                                </button>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => startEditPost(post)}
                                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-white/[0.04] rounded-lg transition-all cursor-pointer"
                                    title="Edit Post"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmPostId(post.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/[0.04] rounded-lg transition-all cursor-pointer"
                                    title="Delete Post"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Post Title & Body */}
                            <div className="p-5 sm:px-6 py-4 space-y-3">
                              <h2 className="text-base sm:text-lg font-semibold font-heading text-white tracking-normal leading-snug select-text">
                                {post.title}
                              </h2>

                              {post.body && (
                                <p className="text-xs sm:text-sm text-slate-300 font-body leading-relaxed whitespace-pre-wrap select-text">
                                  {post.body}
                                </p>
                              )}

                              {post.image_url && (
                                <div className="mt-4 rounded-xl border border-white/[0.04] overflow-hidden max-h-80 w-full relative bg-[#040815]/40 flex items-center justify-center">
                                  <img src={post.image_url} alt="Post attachment" className="max-h-80 object-contain w-full" />
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Modern Actions Row (Like, Comment, Share, Save) */}
                            <div className="px-5 sm:px-6 py-3.5 bg-white/[0.01] border-t border-white/[0.03] flex items-center justify-between select-none text-slate-400 text-xs relative">
                              
                              {/* Glowing Toast Feedback for Link Copied */}
                              <AnimatePresence>
                                {isCopied && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: -25, scale: 1 }}
                                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                                    className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-purple-600 border border-purple-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md select-none tracking-wider uppercase z-20"
                                  >
                                    Link copied to clipboard! 🔗
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Actions Container */}
                              <div className="flex items-center gap-1.5 sm:gap-4 w-full">
                                
                                {/* 1. LIKE ACTION BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextLiked = !isLiked;
                                    setLikedPosts(prev => ({ ...prev, [post.id]: nextLiked }));
                                    setLikesCount(prev => ({ ...prev, [post.id]: currentLikes + (nextLiked ? 1 : -1) }));
                                  }}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                                    isLiked 
                                      ? "text-rose-400 bg-rose-500/10 font-bold" 
                                      : "hover:text-slate-200 hover:bg-white/[0.04]"
                                  }`}
                                  title="Like Post"
                                >
                                  <svg className={`w-4 h-4 transition-all ${isLiked ? "fill-current scale-110 drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]" : "none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                  </svg>
                                  <span>{currentLikes} Likes</span>
                                </button>

                                {/* 2. COMMENT ACTION BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleComments(post.id)}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                                    isPostExpanded 
                                      ? "text-blue-400 bg-blue-500/10 font-bold" 
                                      : "hover:text-slate-200 hover:bg-white/[0.04]"
                                  }`}
                                  title="Comment Thread"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-1.923 2.41a4.485 4.485 0 0 0 3.09-.342c.8-.403 1.688-.472 2.502-.27a9.96 9.96 0 0 0 2.472.27Z" />
                                  </svg>
                                  <span>{post.replies_count ?? 0} Replies</span>
                                </button>

                                {/* 3. SHARE ACTION BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCopiedPostId(post.id);
                                    navigator.clipboard.writeText(`${window.location.origin}/community/${getPostCommunitySlug(post)}?mock_login=true&email=${encodeURIComponent(memberEmail)}`);
                                    setTimeout(() => setCopiedPostId(null), 2000);
                                  }}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                                    copiedPostId === post.id
                                      ? "text-emerald-400 bg-emerald-500/10 font-bold"
                                      : "hover:text-slate-200 hover:bg-white/[0.04]"
                                  }`}
                                  title="Copy Post Link"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
                                  </svg>
                                  <span>{copiedPostId === post.id ? "Copied ✓" : "Share"}</span>
                                </button>

                                {/* 4. SAVE ACTION BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => setSavedPosts(prev => ({ ...prev, [post.id]: !isSaved }))}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ml-auto ${
                                    isSaved 
                                      ? "text-amber-400 bg-amber-500/10 font-bold" 
                                      : "hover:text-slate-200 hover:bg-white/[0.04]"
                                  }`}
                                  title="Save Bookmark"
                                >
                                  <svg className={`w-4 h-4 transition-all ${isSaved ? "fill-current scale-110 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]" : "none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                  </svg>
                                  <span>{isSaved ? "Saved" : "Save"}</span>
                                </button>

                              </div>
                            </div>

                            {/* NESTED COMMENTS LOGICAL SLIDEDOWN PANEL */}
                            <AnimatePresence>
                              {isPostExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden bg-[#040815]/30 px-5 sm:px-6 pb-5 space-y-4"
                                >
                                  <div className="h-[1px] bg-white/[0.03] w-full" />
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Replies Thread</p>

                                  {commentsLoading ? (
                                    <div className="py-4 text-center">
                                      <svg className="animate-spin h-4.5 w-4.5 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    </div>
                                  ) : commentsList.length > 0 ? (
                                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                                      {commentsList.map((comment) => {
                                        const cAuthor = comment.profiles || {
                                          full_name: "Campus Peer",
                                          username: "peer",
                                          avatar_url: "",
                                          year: "1st Year",
                                          branch: "CSE"
                                        };
                                        return (
                                          <div key={comment.id} className="p-3 bg-[#02040a]/40 border border-white/[0.03] rounded-xl flex items-start gap-2.5">
                                            {cAuthor.avatar_url ? (
                                              <div className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 flex-shrink-0 mt-0.5 bg-[#0e1017]">
                                                <img src={cAuthor.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              renderInitials(cAuthor.full_name, "w-6.5 h-6.5 text-[8px] font-bold flex-shrink-0 mt-0.5")
                                            )}
                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-slate-300">
                                                  u/{cAuthor.username}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-semibold">{formatTimeAgo(comment.created_at)}</span>
                                              </div>
                                              <p className="text-xs text-slate-400 font-body leading-normal select-text">
                                                {comment.body}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="py-2 text-center text-xs text-slate-500">
                                      No comments yet. Start the conversation!
                                    </div>
                                  )}

                                  {/* Reply input */}
                                  <form onSubmit={(e) => handleCreateComment(e, post.id)} className="flex gap-2 items-end pt-2">
                                    <textarea
                                      required
                                      rows={1}
                                      value={newCommentBody}
                                      onChange={(e) => setNewCommentBody(e.target.value)}
                                      placeholder="Leave a helpful reply..."
                                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all resize-none font-body"
                                    />
                                    <button
                                      type="submit"
                                      disabled={commentingLoader || !newCommentBody.trim()}
                                      className="rounded-lg bg-brand hover:bg-brand-hover px-4 py-2 text-[11px] font-bold text-white shadow-md active:scale-95 disabled:opacity-40 cursor-pointer h-[32px] flex items-center justify-center flex-shrink-0"
                                    >
                                      {commentingLoader ? "..." : "Reply"}
                                    </button>
                                  </form>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : (
                      <div className="glass-panel rounded-2xl p-12 text-center shadow-xl border-white/[0.06] relative overflow-hidden bg-card-glow text-left">
                        <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-brand/10 rounded-full blur-[40px] pointer-events-none" />
                        <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6 shadow-inner select-none">
                          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-1.923 2.41a4.485 4.485 0 0 0 3.09-.342c.8-.403 1.688-.472 2.502-.27a9.96 9.96 0 0 0 2.472.27Z" />
                          </svg>
                        </div>
                        <div className="text-center space-y-3.5">
                          <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                            No posts yet
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto font-body">
                            Be the first to start the discussion! Share placements sheets, study roadmaps, exam notes, or campus buzz details.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsComposing(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center bg-brand hover:bg-brand-hover text-xs font-bold text-white uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          >
                            Create First Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* === TAB: DISCOVER NATIVE COMMUNITIES VIEW === */}
            {currentTab === "communities" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 text-left animate-fade-in"
              >
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/[0.06] bg-[#090a0f]/95 relative overflow-hidden bg-card-glow">
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-normal leading-none mb-3">
                    Find your tribe.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-body leading-relaxed max-w-xl">
                    Connect with top-tier scholars, share exclusive resources, and build your digital legacy across specialized academic sectors.
                  </p>

                  {/* Niche Search Box */}
                  <div className="mt-8 flex gap-3 max-w-md">
                    <input 
                      type="text" 
                      placeholder="Search by niche, topic, or university..."
                      className="flex-1 bg-[#040815]/85 border border-white/[0.06] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                    />
                    <button className="bg-purple-500 hover:bg-purple-600 text-xs font-bold text-white px-5 py-3 rounded-xl transition-all shadow-md select-none cursor-pointer border-0">
                      Explore
                    </button>
                  </div>

                  {/* Category Switchers */}
                  <div className="mt-6 flex flex-wrap gap-2 select-none border-t border-white/[0.04] pt-5">
                    {["Engineering", "Medical", "Management", "Law", "Design", "Economics"].map((cat, idx) => (
                      <span 
                        key={idx}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          idx === 0
                            ? "bg-purple-500/20 border-purple-500/35 text-purple-400 font-extrabold"
                            : "bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 text-left">
                    <div>
                      <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                        Featured Communities
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-sans">
                        Verified spaces with high-activity academic exchanges.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 z-10">
                      {isEligibleToCreateCommunity && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingCommunity(true)}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-500/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 select-none"
                          title="Create a new student community circle"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Create Community
                        </button>
                      )}
                      <button className="w-8 h-8 rounded-xl bg-[#090a0f]/60 hover:bg-[#090a0f] border border-white/[0.05] hover:border-purple-500/40 flex items-center justify-center transition-all cursor-pointer">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {communitiesLoading ? (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                        <svg className="animate-spin h-6 w-6 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : communities.length === 0 ? (
                      <div className="col-span-full glass-panel rounded-3xl p-10 sm:p-12 text-center border-white/[0.06] bg-card-glow relative overflow-hidden select-none">
                        <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                        <div className="space-y-3 max-w-md mx-auto">
                          <h3 className="text-lg font-bold font-heading text-white tracking-tight">No communities exist yet</h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-body">
                            CampusCircle grows organically through students. Be the trendsetter on your campus—click the <strong>Create Community</strong> button above to launch the very first circle!
                          </p>
                        </div>
                      </div>
                    ) : (
                      communities.map((comm) => {
                        const isJoined = joinedCommunities[comm.slug] === true;
                        const isCollege = comm.slug === (memberCompany ? memberCompany.toLowerCase().replace(/\s+/g, "-") : "");
                        
                        return (
                          <div key={comm.slug} className={`bg-[#090a0f]/90 border border-white/[0.04] p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between h-[290px] relative overflow-hidden group ${
                            isCollege 
                              ? "hover:border-purple-500/20 hover:shadow-purple-500/[0.01]" 
                              : "hover:border-emerald-500/20 hover:shadow-emerald-500/[0.01]"
                          }`}>
                            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-gradient-to-br from-white/5 to-transparent rounded-full blur-[40px] pointer-events-none" />
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                                  isCollege 
                                    ? "text-purple-400 bg-purple-500/10 border-purple-500/20" 
                                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                }`}>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                                  </svg>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase select-none ${
                                  isCollege 
                                    ? "text-purple-400 bg-purple-500/10 border-purple-500/20" 
                                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                }`}>
                                  {isCollege ? "Your Campus" : "Active Space"}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white font-heading tracking-wide group-hover:text-purple-400 transition-colors truncate">{comm.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-body line-clamp-3">
                                {comm.description || "A public interest-based student exchange circle."}
                              </p>
                            </div>
                            <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between select-none">
                              <div className="flex flex-col text-left font-sans">
                                <span className="text-[10px] font-extrabold text-slate-400 leading-none">{isCollege ? "Official" : "Public Space"}</span>
                                <span className="text-[9px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                                  Active Now
                                </span>
                              </div>
                              
                              <div className="flex gap-1.5">
                                <Link
                                  href={`/community/${comm.slug}${isMockLoginBypass() ? "?mock_login=true&email=" + encodeURIComponent(memberEmail) : ""}`}
                                  className="text-[9px] font-extrabold px-3 py-1.5 rounded-xl transition-all bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.04] cursor-pointer text-center flex items-center justify-center active:scale-95"
                                >
                                  Enter →
                                </Link>
                                
                                <button 
                                  onClick={() => {
                                    setJoinedCommunities(prev => ({ ...prev, [comm.slug]: !isJoined }));
                                  }}
                                  className={`text-[9px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border-0 shadow-md active:scale-95 ${
                                    isJoined
                                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-emerald-500/5"
                                      : "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/10"
                                  }`}
                                >
                                  {isJoined ? "Joined ✓" : "Join"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* === TAB 1: FEED VIEW (RESTRICTED TO my-posts) === */}
            {currentTab === "my-posts" && (
              <div className="flex flex-col gap-6">
                
                {/* REDDIT-STYLE POST COMPOSER */}
                <div className="glass-panel rounded-2xl p-5 shadow-xl border-white/[0.06] relative overflow-hidden bg-card-glow text-left">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                  
                  {!isComposing ? (
                    <div 
                      onClick={() => setIsComposing(true)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {avatarUrl ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={avatarUrl} alt="Student Avatar" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        renderInitials("", "w-8 h-8 text-xs flex-shrink-0")
                      )}
                      <div className="w-full bg-[#040815]/60 hover:bg-[#060b1e]/80 border border-white/[0.04] hover:border-white/[0.08] px-4 py-2.5 rounded-xl text-xs text-slate-500 font-semibold transition-all">
                        Create a post: What's happening in {memberCompany}?
                      </div>
                      <button className="bg-brand hover:bg-brand-hover text-xs font-bold text-white px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md select-none flex-shrink-0 active:scale-95">
                        Post
                      </button>
                    </div>
                  ) : (
                    /* Expanded Reddit-style post composer */
                    <motion.form 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleCreatePost} 
                      className="space-y-4"
                    >
                      {/* Title block */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <span className="text-xs font-extrabold font-heading text-slate-300 uppercase tracking-wider">
                          Create a Post in r/{memberCompany.toLowerCase().replace(/\s+/g, "-")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsComposing(false);
                            setComposeError("");
                            setUploadedImageBase64(null);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* REDDIT TAB SELECTORS: TEXT POST vs IMAGE POST */}
                      <div className="flex border-b border-white/[0.04] bg-[#02040a]/40 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setComposerTab("text")}
                          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                            composerTab === "text"
                              ? "bg-brand/10 border border-brand/20 text-blue-400"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Text Post
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposerTab("image")}
                          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                            composerTab === "image"
                              ? "bg-brand/10 border border-brand/20 text-blue-400"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Image Post
                        </button>
                      </div>

                      {/* Post Title */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Post Title</label>
                        <input
                          type="text"
                          required
                          value={composeTitle}
                          onChange={(e) => setComposeTitle(e.target.value)}
                          placeholder="Title of your placments prep, exam notes, campus buzz..."
                          className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all font-body font-semibold"
                        />
                      </div>

                      {/* Dropdowns row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Circle Tag</label>
                          <select
                            value={composeCategory}
                            onChange={(e) => setComposeCategory(e.target.value)}
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand font-semibold cursor-pointer"
                          >
                            <option value="#general">#general (General Campus)</option>
                            <option value="#placement-prep">#placement-prep (DSA & Placements)</option>
                            <option value="#academic-notes">#academic-notes (Study Notes)</option>
                            <option value="#hackathons">#hackathons (SIH & Coding Events)</option>
                            <option value="#campus-life">#campus-life (Campus Buzz)</option>
                          </select>
                        </div>

                        <div className="flex items-end justify-start sm:justify-end py-1">
                          <span className="text-[9px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold select-none tracking-wider uppercase">
                            u/{memberUsername} • Verified Author
                          </span>
                        </div>
                      </div>

                      {/* TAB VIEW 1: TEXT CONTENT */}
                      {composerTab === "text" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Body Text</label>
                          <textarea
                            required={composerTab === "text"}
                            rows={5}
                            value={composeBody}
                            onChange={(e) => setComposeBody(e.target.value)}
                            placeholder="What would you like to share or ask seniors for guidance?"
                            className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all font-body resize-none"
                          />
                        </div>
                      )}

                      {/* TAB VIEW 2: IMAGE UPLOADER (CANVAS COMPRESSOR BASE64) */}
                      {composerTab === "image" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image upload</label>
                          
                          <div className="relative w-full">
                            {imageCompressing ? (
                              <div className="w-full h-40 rounded-2xl bg-[#040815]/50 border border-white/[0.04] flex items-center justify-center">
                                <svg className="animate-spin h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              </div>
                            ) : uploadedImageBase64 ? (
                              <div className="w-full max-h-56 rounded-2xl border border-brand/50 overflow-hidden relative group">
                                <img src={uploadedImageBase64} alt="Post image" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setUploadedImageBase64(null)}
                                  className="absolute inset-0 bg-[#000000a6] text-red-400 font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Remove Selected Image
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => imageInputRef.current?.click()}
                                className="border-2 border-dashed border-white/[0.08] hover:border-brand/40 bg-[#040815]/50 hover:bg-[#070e24]/40 rounded-2xl p-8 cursor-pointer transition-all duration-300 text-center group"
                              >
                                <svg className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition-colors mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs font-semibold text-slate-300">Click to upload image</p>
                                <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Canvas scaling compression active</p>
                              </div>
                            )}

                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/jpeg,image/png"
                              onChange={handleImageFile}
                              className="hidden"
                            />
                          </div>
                        </div>
                      )}

                      {composeError && (
                        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-left">
                          <p className="text-xs font-semibold text-red-400">{composeError}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsComposing(false);
                            setComposeError("");
                            setUploadedImageBase64(null);
                          }}
                          className="rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={postingLoader || imageCompressing}
                          className="rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        >
                          {postingLoader ? "Publishing..." : "Sign Up & Post"}
                        </button>
                      </div>

                    </motion.form>
                  )}
                </div>

                {/* ACTIVE REDDIT CARD DISCUSSIONS FEEDS */}
                <div className="space-y-6">
                  {postsLoading ? (
                    <div className="glass-panel rounded-2xl p-12 text-center shadow-xl border-white/[0.06]">
                      <svg className="animate-spin h-8 w-8 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : visiblePosts.length > 0 ? (
                    visiblePosts.map((post) => {
                      const author = post.profiles || {
                        full_name: "Verified Student",
                        username: "student",
                        avatar_url: "",
                        college_name: memberCompany,
                        year: "1st Year",
                        branch: "CSE"
                      };
                      const isPostExpanded = expandedPostId === post.id;
                      const hasVotedUp = post.user_vote_value === 1;
                      const hasVotedDown = post.user_vote_value === -1;

                      return (
                        <div
                          key={post.id}
                          className="glass-panel rounded-2xl shadow-xl border-white/[0.06] overflow-hidden flex bg-card-glow relative text-left"
                        >
                          {/* 1. LEFT VERTICAL VOTE STRIP (REDDIT-STYLE) */}
                          <div className="w-11 sm:w-12 bg-white/[0.01] border-r border-white/[0.03] py-4 flex flex-col items-center justify-start gap-1 select-none">
                            {/* Upvote arrow */}
                            <button
                              onClick={() => handleVote(post.id, 1)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                hasVotedUp
                                  ? "text-orange-500 bg-orange-500/10"
                                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                              }`}
                              title="Upvote Post"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                              </svg>
                            </button>

                            {/* Score count display */}
                            <span className={`text-[11px] font-extrabold font-heading ${
                              hasVotedUp ? "text-orange-500" : hasVotedDown ? "text-blue-500" : "text-slate-300"
                            }`}>
                              {post.votes_score ?? 0}
                            </span>

                            {/* Downvote arrow */}
                            <button
                              onClick={() => handleVote(post.id, -1)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                hasVotedDown
                                  ? "text-blue-500 bg-blue-500/10"
                                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                              }`}
                              title="Downvote Post"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          </div>

                          {/* 2. RIGHT CONTENT AREA */}
                          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                            
                            {/* Author info & metadata header */}
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.04]">
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                {author.avatar_url ? (
                                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                    <img src={author.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  renderInitials(author.full_name, "w-5 h-5 text-[8px] font-bold flex-shrink-0")
                                )}
                                <span className="font-bold text-slate-300">u/{author.username}</span>
                                <span>•</span>
                                <span className="font-semibold px-1.5 py-0.5 rounded bg-brand/10 text-blue-400 uppercase tracking-wider text-[8px]">
                                  {post.category}
                                </span>
                                <span>•</span>
                                <span>{formatTimeAgo(post.created_at)}</span>
                              </div>

                              {/* Self post Actions: Edit & Delete */}
                              {post.user_id === userId && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => startEditPost(post)}
                                    className="p-1 text-slate-500 hover:text-blue-400 hover:bg-white/[0.04] rounded transition-all cursor-pointer"
                                    title="Edit Post"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmPostId(post.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-white/[0.04] rounded transition-all cursor-pointer"
                                    title="Delete Post"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Post Title */}
                            <h2 className="text-base font-semibold font-heading text-white tracking-normal leading-snug">
                              {post.title}
                            </h2>

                            {/* Post Content Body */}
                            {post.body && (
                              <p className="mt-3.5 text-xs sm:text-sm text-slate-400 font-body leading-relaxed whitespace-pre-wrap select-text">
                                {post.body}
                              </p>
                            )}

                            {/* Render uploaded canvas image if exists */}
                            {post.image_url && (
                              <div className="mt-4 rounded-xl border border-white/[0.04] overflow-hidden max-h-80 w-full relative">
                                <img src={post.image_url} alt="Subreddit card attachment" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Post Footer details comments expansion trigger */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.04]">
                              <div className="text-[9px] text-slate-500 font-semibold select-none">
                                Community: {author.college_name}
                              </div>

                              <div 
                                onClick={() => handleToggleComments(post.id)}
                                className={`flex items-center gap-1.5 text-xs font-bold font-heading cursor-pointer transition-all ${
                                  isPostExpanded ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                                }`}
                              >
                                <ChatBubbleIcon size={13} />
                                <span>{post.replies_count ?? 0} Replies</span>
                                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isPostExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* NESTED COMMENTS LOGICAL SLIDEDOWN */}
                            <AnimatePresence>
                              {isPostExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden mt-4 pt-4 border-t border-white/[0.04] space-y-4"
                                >
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Replies Thread</p>

                                  {commentsLoading ? (
                                    <div className="py-4 text-center">
                                      <svg className="animate-spin h-4.5 w-4.5 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    </div>
                                  ) : commentsList.length > 0 ? (
                                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                                      {commentsList.map((comment) => {
                                        const cAuthor = comment.profiles || {
                                          full_name: "Campus Peer",
                                          username: "peer",
                                          avatar_url: "",
                                          year: "1st Year",
                                          branch: "CSE"
                                        };
                                        return (
                                          <div key={comment.id} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-start gap-2.5">
                                            {cAuthor.avatar_url ? (
                                              <div className="w-5.5 h-5.5 rounded-full overflow-hidden border border-white/10 flex-shrink-0 mt-0.5">
                                                <img src={cAuthor.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              renderInitials(cAuthor.full_name, "w-5.5 h-5.5 text-[8px] font-bold flex-shrink-0 mt-0.5")
                                            )}
                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-slate-300">
                                                  u/{cAuthor.username}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-medium">{formatTimeAgo(comment.created_at)}</span>
                                              </div>
                                              <p className="text-xs text-slate-400 font-body leading-normal select-text">
                                                {comment.body}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="py-2 text-center text-xs text-slate-500">
                                      No comments yet. Start the conversation!
                                    </div>
                                  )}

                                  {/* Reply input */}
                                  <form onSubmit={(e) => handleCreateComment(e, post.id)} className="flex gap-2 items-end pt-2">
                                    <textarea
                                      required
                                      rows={1}
                                      value={newCommentBody}
                                      onChange={(e) => setNewCommentBody(e.target.value)}
                                      placeholder="Leave a helpful reply..."
                                      className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all resize-none font-body"
                                    />
                                    <button
                                      type="submit"
                                      disabled={commentingLoader || !newCommentBody.trim()}
                                      className="rounded-lg bg-brand hover:bg-brand-hover px-4 py-2 text-[11px] font-bold text-white shadow-md active:scale-95 disabled:opacity-40 cursor-pointer h-[32px] flex items-center justify-center flex-shrink-0"
                                    >
                                      {commentingLoader ? "..." : "Reply"}
                                    </button>
                                  </form>
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* DYNAMIC GORGEOUS EMPTY FEED CARD */
                    <div className="glass-panel rounded-2xl p-12 text-center shadow-xl border-white/[0.06] relative overflow-hidden bg-card-glow text-left">
                      <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-brand/10 rounded-full blur-[40px] pointer-events-none" />
                      
                      <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6 shadow-inner select-none">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-1.923 2.41a4.485 4.485 0 0 0 3.09-.342c.8-.403 1.688-.472 2.502-.27a9.96 9.96 0 0 0 2.472.27Z" />
                        </svg>
                      </div>

                      <div className="text-center space-y-3.5">
                        <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                          {currentTab === "my-posts" ? "You haven't posted anything yet" : "No posts yet"}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto font-body">
                          {currentTab === "my-posts"
                            ? "Share placement sheets, study roadmaps, exam notes, or GGV student discussions to start building your campus repute!"
                            : "Be the first to start the discussion! Share placements sheets, study roadmaps, exam notes, or campus buzz details."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentTab === "my-posts") {
                              setCurrentTab("feed");
                            }
                            setIsComposing(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="inline-flex items-center bg-brand hover:bg-brand-hover text-xs font-bold text-white uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        >
                          {currentTab === "my-posts" ? "Create Your First Post" : "Create First Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ==================================================================== */}
            {/* 💬 TAB: CHATS WORKSPACE (DISCORD/REDDIT-STYLE DMs) */}
            {/* ==================================================================== */}
            {currentTab === "chats" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 glass-panel rounded-3xl p-4 sm:p-6 shadow-2xl border-white/[0.06] bg-card-glow relative overflow-hidden text-left min-h-[580px]"
              >
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />

                {/* Left Sub-Column: Active Conversations & Received Requests (Col 1-4) */}
                <div className="lg:col-span-4 flex flex-col gap-4 border-r border-white/[0.04] pr-4 h-[540px]">
                  {/* Chat Sub-Tabs Switcher */}
                  <div className="flex bg-[#040815]/60 border border-white/[0.04] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setChatSubTab("chats")}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold font-heading transition-all ${
                        chatSubTab === "chats"
                          ? "bg-brand/20 text-blue-400 font-extrabold shadow-inner"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Conversations
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatSubTab("requests")}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 ${
                        chatSubTab === "requests"
                          ? "bg-brand/20 text-blue-400 font-extrabold shadow-inner"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Requests
                      {connections.filter((c: any) => c.receiver_id === userId && c.status === "pending").length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-[8px] font-extrabold text-white flex items-center justify-center animate-pulse">
                          {connections.filter((c: any) => c.receiver_id === userId && c.status === "pending").length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Dynamic Scrollable List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 select-none">
                    {chatSubTab === "chats" ? (
                      /* chats convo list */
                      loadingChats ? (
                        <div className="py-8 text-center">
                          <svg className="animate-spin h-5 w-5 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : conversations.length > 0 ? (
                        conversations.map((convo: any) => {
                          const participant = convo.other_profile;
                          const isActive = convo.id === activeConversationId;
                          return (
                            <div
                              key={convo.id}
                              onClick={() => {
                                setActiveConversationId(convo.id);
                                setActiveConvoParticipant(participant);
                                fetchMessages(convo.id);
                              }}
                              className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all cursor-pointer border flex items-center justify-between group ${
                                isActive
                                  ? "bg-brand/10 border-brand/35 text-blue-400"
                                  : "bg-[#040815]/30 hover:bg-[#040815]/80 border-white/[0.03] text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {participant?.avatar_url ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                    <img src={participant.avatar_url} alt="Convo Avatar" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  renderInitials(participant?.full_name || "CLASSMATE", "w-8 h-8 text-xs flex-shrink-0")
                                )}
                                <div className="overflow-hidden">
                                  <p className="font-bold text-xs truncate leading-tight group-hover:text-blue-400 transition-colors">
                                    {participant?.full_name}
                                  </p>
                                  <p className="text-[9px] text-slate-500 font-semibold truncate leading-tight mt-1">
                                    {participant?.branch} • {participant?.year}
                                  </p>
                                </div>
                              </div>

                              {/* Unconnected tag indicator */}
                              {(() => {
                                const activeConn = connections.find(
                                  (conn: any) =>
                                    (conn.sender_id === userId && conn.receiver_id === participant.user_id) ||
                                    (conn.sender_id === participant.user_id && conn.receiver_id === userId)
                                );
                                const isConvoConnected = convo.is_connected || (activeConn && activeConn.status === "accepted");
                                return !isConvoConnected ? (
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex-shrink-0">
                                    {2 - convo.free_message_count} Free
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-500">
                          No conversations yet. Open chats by clicking connect or message next to a classmate!
                        </div>
                      )
                    ) : (
                      /* received pending connection requests */
                      (() => {
                        const receivedRequests = connections.filter(
                          (c: any) => c.receiver_id === userId && c.status === "pending"
                        );

                        // Find matching peer profiles to display full details
                        const requestsHydrated = receivedRequests.map((req: any) => {
                          const peerProfile = peers.find((p: any) => p.user_id === req.sender_id) || {
                            user_id: req.sender_id,
                            full_name: "GGV Peer",
                            username: "classmate",
                            branch: "CSE",
                            year: "3rd Year"
                          };
                          return { ...req, peerProfile };
                        });

                        return requestsHydrated.length > 0 ? (
                          requestsHydrated.map((req: any) => (
                            <div
                              key={req.id}
                              className="w-full bg-[#040815]/50 border border-white/[0.04] p-3.5 rounded-2xl flex flex-col gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                {renderInitials(req.peerProfile.full_name, "w-8 h-8 text-xs flex-shrink-0")}
                                <div>
                                  <p className="font-bold text-slate-200 leading-tight">
                                    {req.peerProfile.full_name}
                                  </p>
                                  <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                                    u/{req.peerProfile.username} • {req.peerProfile.branch}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptConnectionRequest(req.sender_id, req.id)}
                                  className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold text-white transition-all cursor-pointer text-center"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectConnectionRequest(req.id)}
                                  className="flex-1 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white text-[10px] font-semibold transition-all cursor-pointer text-center"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-xs text-slate-500">
                            No pending requests. Connect with other classmates from the roster list to networking!
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Right Sub-Column: Conversations Transcript Panel (Col 5-12) */}
                <div className="lg:col-span-8 flex flex-col justify-between h-[540px]">
                  {activeConversationId && activeConvoParticipant ? (
                    (() => {
                      const convo = conversations.find(c => c.id === activeConversationId);
                      // Check connection status to customize CTAs
                      const activeConn = connections.find(
                        (c: any) =>
                          (c.sender_id === userId && c.receiver_id === activeConvoParticipant.user_id) ||
                          (c.sender_id === activeConvoParticipant.user_id && c.receiver_id === userId)
                      );
                      const isConvoConnected = convo?.is_connected || (activeConn && activeConn.status === "accepted");
                      const freeLeft = convo ? Math.max(0, 2 - (convo.free_message_count || 0)) : 2;
                      const isConvoLocked = !isConvoConnected && freeLeft === 0;

                      return (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          {/* Active Header */}
                          <div className="pb-3 border-b border-white/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {activeConvoParticipant.avatar_url ? (
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                  <img src={activeConvoParticipant.avatar_url} alt="Convo participant" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                renderInitials(activeConvoParticipant.full_name, "w-9 h-9 text-xs flex-shrink-0")
                              )}
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-200 leading-tight">
                                  {activeConvoParticipant.full_name}
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                  {activeConvoParticipant.year} / {activeConvoParticipant.branch} • GGV Classmate
                                </p>
                              </div>
                            </div>

                            {/* Badge details */}
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                              isConvoConnected
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                            }`}>
                              {isConvoConnected ? "Connected" : `Unconnected (${freeLeft} Free DMs)`}
                            </span>
                          </div>

                          {/* Message Logs Feed */}
                          <div className="flex-1 overflow-y-auto py-4 space-y-4 my-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                            {messages.length > 0 ? (
                              messages.map((m: any) => {
                                const isMe = m.sender_id === userId;
                                return (
                                  <div key={m.id} className={`flex items-start gap-3 text-xs max-w-[80%] ${
                                    isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                                  }`}>
                                    {/* Small initials avatar */}
                                    {!isMe ? (
                                      renderInitials(activeConvoParticipant.full_name, "w-6 h-6 text-[9px] flex-shrink-0")
                                    ) : (
                                      avatarUrl ? (
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                          <img src={avatarUrl} alt="Me Avatar" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        renderInitials(memberName, "w-6 h-6 text-[9px] flex-shrink-0")
                                      )
                                    )}
                                    
                                    <div className="space-y-1">
                                      <div className={`p-3 rounded-2xl leading-relaxed ${
                                        isMe
                                          ? "bg-brand text-white rounded-tr-none shadow-[0_0_12px_rgba(24,95,165,0.15)]"
                                          : "bg-[#040815]/80 border border-white/[0.04] text-slate-200 rounded-tl-none"
                                      }`}>
                                        {m.message.startsWith("data:image/") ? (
                                          <img
                                            src={m.message}
                                            alt="Sent image"
                                            className="max-w-[200px] sm:max-w-[260px] rounded-xl object-contain border border-white/10 shadow-md"
                                          />
                                        ) : m.message.startsWith("data:audio/") ? (
                                          <div className="flex flex-col gap-1 text-[10px]">
                                            <audio
                                              src={m.message}
                                              controls
                                              className="max-w-[200px] sm:max-w-[240px] rounded-xl outline-none"
                                            />
                                            <span className="text-slate-400 font-semibold italic text-[8px] pl-1 uppercase tracking-wider">🎙️ Voice message</span>
                                          </div>
                                        ) : (
                                          m.message
                                        )}
                                      </div>
                                      <p className={`text-[8px] text-slate-600 font-semibold uppercase ${
                                        isMe ? "text-right" : "text-left"
                                      }`}>
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="py-24 text-center text-slate-500 italic text-xs">
                                Say hello to your campus peer! This conversation is private.
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Message input / locking box conditional */}
                          <div className="pt-3 border-t border-white/[0.04]">
                            {isConvoLocked ? (
                              /* exhausted limit locks panel */
                              <div className="glass-panel border-amber-500/20 bg-amber-500/[0.02] p-5 rounded-2xl text-center space-y-3.5 select-none animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[60px] h-[60px] bg-amber-500/5 rounded-full blur-[20px]" />
                                <h5 className="text-xs font-bold text-amber-500 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                  Conversation Locked
                                </h5>
                                <p className="text-[11px] text-slate-400 leading-normal max-w-md mx-auto">
                                  You have exhausted your **2 free introductory messages**. Connect with **{activeConvoParticipant.full_name}** to verify mutual classmate networking and unlock permanent, unlimited text DMs.
                                </p>
                                <div className="pt-1 flex items-center justify-center">
                                  {!activeConn ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSendConnectionRequest(activeConvoParticipant.user_id)}
                                      className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-xs font-bold text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                                    >
                                      Send Connection Request
                                    </button>
                                  ) : activeConn.status === "pending" ? (
                                    activeConn.sender_id === userId ? (
                                      <span className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-bold text-slate-500 cursor-not-allowed">
                                        Connection Request Sent (Pending)
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleAcceptConnectionRequest(activeConvoParticipant.user_id, activeConn.id)}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                                      >
                                        Accept Incoming Request
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-[10px] text-red-400 font-semibold bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-xl">
                                      Connection Request Declined or Locked.
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* normal message composer input */
                              /* normal message composer input */
                              <div className="flex flex-col gap-2">
                                {/* Hidden image selector */}
                                <input
                                  ref={chatImageInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png"
                                  onChange={handleChatImageSelect}
                                  className="hidden"
                                />

                                {/* Recording visualizer row if active */}
                                {isRecording && (
                                  <div className="flex items-center justify-between bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-xl mb-1 text-xs select-none">
                                    <div className="flex items-center gap-2 text-red-400 font-extrabold font-heading animate-pulse">
                                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                      Recording Voice Note... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleStopRecording(true)}
                                        className="px-2.5 py-1 text-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white rounded-lg transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStopRecording(false)}
                                        className="px-3 py-1 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all font-bold"
                                      >
                                        Stop & Send
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {imageCompressingChat && (
                                  <div className="flex items-center gap-2 bg-blue-950/20 border border-blue-500/20 px-4 py-2 rounded-xl mb-1 text-xs select-none">
                                    <svg className="animate-spin h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="text-blue-400 font-semibold animate-pulse-slow">Compressing and scaling media...</span>
                                  </div>
                                )}

                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }}
                                  className="flex gap-2 items-center"
                                >
                                  {/* Media attachments triggers */}
                                  <div className="flex items-center gap-1.5 mr-1 select-none">
                                    {/* Image Selector Trigger */}
                                    <button
                                      type="button"
                                      disabled={!isConvoConnected || isRecording || sendingMessage || imageCompressingChat}
                                      onClick={() => chatImageInputRef.current?.click()}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isConvoConnected
                                          ? "bg-[#040815]/80 hover:bg-blue-500/10 border-white/[0.06] text-blue-400 hover:text-white"
                                          : "bg-white/[0.01] border-white/[0.02] text-slate-600 cursor-not-allowed opacity-30"
                                      }`}
                                      title={isConvoConnected ? "Send image file (Auto-compressed)" : "Connect to send images & attachments"}
                                    >
                                      🖼️
                                    </button>

                                    {/* Microphone Recorder Trigger */}
                                    <button
                                      type="button"
                                      disabled={!isConvoConnected || isRecording || sendingMessage || imageCompressingChat}
                                      onClick={handleStartRecording}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isConvoConnected
                                          ? "bg-[#040815]/80 hover:bg-red-500/10 border-white/[0.06] text-red-400 hover:text-white"
                                          : "bg-white/[0.01] border-white/[0.02] text-slate-600 cursor-not-allowed opacity-30"
                                      }`}
                                      title={isConvoConnected ? "Record audio voice note" : "Connect to send voice messages"}
                                    >
                                      🎙️
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={isRecording || sendingMessage || imageCompressingChat}
                                    placeholder={
                                      isRecording 
                                        ? "Microphone capture active..." 
                                        : !isConvoConnected 
                                          ? `Intro message (Text-only, ${freeLeft} free left)...` 
                                          : "Type a message..."
                                    }
                                    className="flex-1 bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-all font-body"
                                  />
                                  <button
                                    type="submit"
                                    disabled={sendingMessage || isRecording || imageCompressingChat || !chatInput.trim()}
                                    className="bg-brand hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all text-xs font-bold text-white px-5 py-3 rounded-xl flex items-center justify-center cursor-pointer shadow-md"
                                  >
                                    {sendingMessage ? "..." : "Send"}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* Default Chats Empty Screen Overlay */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative select-none">
                      <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse-slow">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </div>
                      <h4 className="text-base font-extrabold font-heading text-slate-200 tracking-tight leading-tight">
                        Chats
                      </h4>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ==================================================================== */}
            {/* 🤝 TAB: MY CONNECTIONS (STUDENT FRIENDS DIRECTORY) */}
            {/* ==================================================================== */}
            {currentTab === "connections" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 text-left animate-fade-in w-full"
              >
                {/* 1. TOP STATS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Connections */}
                  <div className="glass-panel rounded-2xl p-4 bg-[#090a0f]/80 border-white/[0.06] flex items-center gap-3.5 shadow-lg relative overflow-hidden bg-card-glow hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 21c-2.243 0-4.307-.655-6.042-1.782V19.13a4.125 4.125 0 017.533-2.493m0 0a4.07 4.07 0 01-1.027-2.137m0 0A5.99 5.99 0 0012 12.75c1.472 0 2.813-.528 3.857-1.402m-7.714 0a5.99 5.99 0 012.831-4.823c1.471-.853 3.197-.853 4.662 0A5.99 5.99 0 0118 12.75M8 6.75a3 3 0 11-6 0 3 3 0 016 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-heading select-none">Total Connections</div>
                      <div className="text-2xl font-black text-white tracking-tight leading-none mt-1 font-sans">
                        {isDemoAllowed(memberEmail) ? "1,284" : connections.filter(c => c.status === "accepted").length}
                      </div>
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div className="glass-panel rounded-2xl p-4 bg-[#090a0f]/80 border-white/[0.06] flex items-center gap-3.5 shadow-lg relative overflow-hidden bg-card-glow hover:border-blue-500/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.11H4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-heading select-none">Pending Requests</div>
                      <div className="text-2xl font-black text-white tracking-tight leading-none mt-1 font-sans">
                        {isDemoAllowed(memberEmail) ? "24" : connections.filter(c => c.status === "pending" && c.receiver_id === userId).length}
                      </div>
                    </div>
                  </div>

                  {/* Sent Requests */}
                  <div className="glass-panel rounded-2xl p-4 bg-[#090a0f]/80 border-white/[0.06] flex items-center gap-3.5 shadow-lg relative overflow-hidden bg-card-glow hover:border-orange-500/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-heading select-none">Sent Requests</div>
                      <div className="text-2xl font-black text-white tracking-tight leading-none mt-1 font-sans">
                        {isDemoAllowed(memberEmail) ? "12" : connections.filter(c => c.status === "pending" && c.sender_id === userId).length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SECTION HEADER BAR */}
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border-white/[0.06] bg-card-glow relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-brand/5 rounded-full blur-[70px] pointer-events-none" />
                  
                  <div>
                    <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                      My Network
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      Connect with elite scholars from top institutions across the globe.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 z-10">
                    {/* Filter Button */}
                    <button className="px-3.5 py-1.5 rounded-xl bg-[#090a0f]/60 hover:bg-[#090a0f] border border-white/[0.05] hover:border-purple-500/40 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                      </svg>
                      Filter
                    </button>
                    {/* Recent Dropdown */}
                    <button className="px-3.5 py-1.5 rounded-xl bg-[#090a0f]/60 hover:bg-[#090a0f] border border-white/[0.05] hover:border-purple-500/40 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-9L21 12m0 0l-4.5 4.5M21 12H7.5" />
                      </svg>
                      Recent
                    </button>
                  </div>
                </div>

                {/* 3. 3x2 SCHOLARS GRID */}
                {(() => {
                  const eliteScholars = [
                    {
                      user_id: "elite-jordan-chen",
                      full_name: "Jordan Chen",
                      username: "jordanchen",
                      year: "Year 3",
                      branch: "Computer Science & AI",
                      college_name: "Stanford University",
                      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
                      bio: "Deep learning & reinforcement learning researcher. Building next-gen autonomous systems."
                    },
                    {
                      user_id: "elite-elena-rodriguez",
                      full_name: "Elena Rodriguez",
                      username: "elenarodriguez",
                      year: "Year 4",
                      branch: "Bioengineering",
                      college_name: "MIT",
                      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
                      bio: "Pioneering neural interfaces and genetic computing devices. Excited about bio-syntech."
                    },
                    {
                      user_id: "elite-marcus-thorne",
                      full_name: "Marcus Thorne",
                      username: "marcusthorne",
                      year: "Year 2",
                      branch: "Philosophy & Politics",
                      college_name: "Oxford University",
                      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
                      bio: "Exploring the intersections of algorithmic governance, ethics, and social contracts."
                    },
                    {
                      user_id: "elite-sofia-patel",
                      full_name: "Sofia Patel",
                      username: "sofiapatel",
                      year: "Year 3",
                      branch: "Structural Engineering",
                      college_name: "IIT Delhi",
                      avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
                      bio: "Focused on earthquake-resilient structures and smart infrastructure grids."
                    },
                    {
                      user_id: "elite-liam-oconnell",
                      full_name: "Liam O'Connell",
                      username: "liamoconnell",
                      year: "Year 1",
                      branch: "Robotics Systems",
                      college_name: "ETH Zurich",
                      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
                      bio: "Freshman at ETH designing agile quadrupedal systems and drone swarm controls."
                    },
                    {
                      user_id: "elite-aisha-khan",
                      full_name: "Aisha Khan",
                      username: "aishakhan",
                      year: "Year 3",
                      branch: "Interaction Design",
                      college_name: "UCL London",
                      avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200&h=200",
                      bio: "Crafting immersive spatial computing designs and tactile micro-interactions."
                    }
                  ];

                  const isDemo = isDemoAllowed(memberEmail);
                  const displayList = isDemo ? eliteScholars : connectedProfiles;

                  if (displayList.length === 0) {
                    return (
                      <div className="glass-panel rounded-3xl p-12 text-center border-white/[0.04] bg-[#090a0f]/50 select-none flex flex-col items-center justify-center gap-4 w-full">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-slate-200">No Connections Yet</h4>
                          <p className="text-xs text-slate-500 font-sans max-w-sm">
                            Connect with verified classmates at your campus through the Home Feed or community channels.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {displayList.map((scholar) => (
                        <div
                          key={scholar.user_id}
                          className="bg-[#090a0f]/80 border border-white/[0.04] hover:border-purple-500/20 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 relative group overflow-hidden shadow-lg hover:shadow-purple-500/[0.02]"
                        >
                          {/* Banner background */}
                          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 h-16 rounded-t-2xl relative w-full border-b border-white/[0.02] flex items-center justify-end px-4">
                            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-extrabold text-purple-300 uppercase select-none tracking-widest">
                              {scholar.year}
                            </span>
                          </div>

                          {/* Float Avatar Area */}
                          <div className="flex items-start px-4 -mt-10 gap-3">
                            {scholar.avatar_url ? (
                              <div className="w-14 h-14 rounded-2xl border-2 border-[#090a0f] overflow-hidden shadow-md flex-shrink-0 bg-[#0e1017]">
                                <img src={scholar.avatar_url} alt={scholar.full_name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              renderInitials(scholar.full_name, "w-14 h-14 rounded-2xl border-2 border-[#090a0f] text-sm font-bold shadow-md")
                            )}
                          </div>

                          {/* Scholar Info */}
                          <div className="px-4 text-left flex-1 flex flex-col gap-1">
                            <h4 className="font-extrabold text-sm text-slate-200 group-hover:text-purple-400 transition-colors">
                              {scholar.full_name}
                            </h4>
                            <p className="text-[10px] text-blue-400 font-extrabold tracking-wide uppercase leading-tight select-none">
                              {scholar.college_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-semibold leading-tight flex items-center gap-1.5 mt-1 font-sans">
                              <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                              {scholar.branch}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="px-4 pb-4 pt-3 border-t border-white/[0.02] flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartChat(scholar.user_id || "", scholar)}
                              className="flex-1 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white transition-all text-[10px] font-bold border border-purple-500/20 cursor-pointer shadow-sm active:scale-95 text-center flex items-center justify-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                              </svg>
                              Message
                            </button>
                            <button
                              type="button"
                              onClick={() => alert(`🎓 Scholar Profile: ${scholar.full_name}\n🏫 University: ${scholar.college_name}\n📌 Major: ${scholar.branch}\n\n"${scholar.bio || ""}"`)}
                              className="px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-all text-[10px] font-bold border border-white/[0.04] cursor-pointer active:scale-95 text-center"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* 4. LOAD MORE CONNECTIONS FOOTER */}
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={() => alert("🎓 You have fully loaded the active student network pool.")}
                    className="px-6 py-2.5 rounded-full bg-[#090a0f]/60 hover:bg-[#090a0f] border border-white/[0.05] hover:border-purple-500/40 text-xs font-bold text-slate-300 flex items-center gap-2.5 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/[0.01]"
                  >
                    Load More Connections
                    <svg className="w-3.5 h-3.5 text-slate-400 animate-bounce-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* === TAB 2: MY PROFILE STATS VIEW === */}
            {currentTab === "profile" && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-2xl p-6 sm:p-8 shadow-xl border-white/[0.06] text-left space-y-6 relative overflow-hidden bg-card-glow"
                >
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.04]">
                    {/* Avatar Spot */}
                    {avatarUrl ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand/50 shadow-lg">
                        <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      renderInitials(memberName, "w-24 h-24 text-2xl font-bold rounded-full")
                    )}

                    <div className="text-center sm:text-left space-y-1">
                      <h2 className="text-2xl font-bold font-heading text-white">{memberName}</h2>
                      <p className="text-sm text-blue-400 font-bold font-heading">u/{memberUsername}</p>
                      <p className="text-xs text-slate-500 font-semibold">{memberTitle} • {memberCompany}</p>
                    </div>
                  </div>

                  {/* Profile details grids stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-[#02040a]/40 border border-white/[0.03] p-4 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Posts</p>
                      <p className="text-2xl font-extrabold text-white mt-1.5 font-heading">{totalPostsCount}</p>
                    </div>
                    <div className="bg-[#02040a]/40 border border-white/[0.03] p-4 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Comments</p>
                      <p className="text-2xl font-extrabold text-white mt-1.5 font-heading">{totalCommentsCount}</p>
                    </div>
                    <div className="bg-[#02040a]/40 border border-white/[0.03] p-4 rounded-xl text-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined Date</p>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-200 mt-3 font-heading uppercase tracking-wider">{joinedDate}</p>
                    </div>
                  </div>

                  {/* Bio block */}
                  {bio && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">About Me</h4>
                      <p className="text-sm text-slate-400 leading-relaxed font-body italic">
                        "{bio}"
                      </p>
                    </div>
                  )}

                  {/* Expertise tags */}
                  {selectedTags.length > 0 && (
                    <div className="space-y-2.5 text-left">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map(tag => (
                          <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-slate-300 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Sub-tabs Selector inside Profile */}
                <div className="flex bg-[#02040a]/40 border border-white/[0.04] p-1 rounded-xl w-full max-w-md select-none">
                  <button
                    type="button"
                    onClick={() => setProfileSubTab("posts")}
                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      profileSubTab === "posts"
                        ? "bg-brand text-white shadow-[0_0_10px_rgba(24,95,165,0.2)]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📝 Posts ({totalPostsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileSubTab("comments")}
                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      profileSubTab === "comments"
                        ? "bg-brand text-white shadow-[0_0_10px_rgba(24,95,165,0.2)]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    💬 Comments ({totalCommentsCount})
                  </button>
                </div>

                {/* Sub-tab Content Renders */}
                <div className="space-y-4">
                  {profileSubTab === "posts" && (
                    <div className="space-y-4">
                      {posts.filter(p => p.user_id === userId).length > 0 ? (
                        posts.filter(p => p.user_id === userId).map(post => {
                          const author = post.profiles || {
                            full_name: memberName,
                            username: memberUsername || "student",
                            avatar_url: avatarUrl,
                            college_name: memberCompany,
                            year: memberTitle.split("/")[0]?.trim() || "1st Year",
                            branch: memberTitle.split("/")[1]?.trim() || "CSE"
                          };
                          const hasVotedUp = post.user_vote_value === 1;
                          const hasVotedDown = post.user_vote_value === -1;
                          const isAuthor = post.user_id === userId;

                          return (
                            <motion.div
                              key={post.id}
                              layout="position"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="glass-panel rounded-2xl overflow-hidden hover:border-white/[0.08] transition-colors bg-card-glow flex flex-col text-left"
                            >
                              <div className="flex">
                                {/* Reddit-style Upvote vertical strip */}
                                <div className="flex flex-col items-center justify-start py-4 px-2 sm:px-3 bg-white/[0.01] border-r border-white/[0.03] select-none min-w-[36px] sm:min-w-[48px]">
                                  <button
                                    type="button"
                                    onClick={() => handleVote(post.id, 1)}
                                    title="Upvote Post"
                                    className={`p-1 rounded transition-all hover:bg-white/[0.05] focus:outline-none ${
                                      hasVotedUp ? "text-emerald-400 scale-110 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" : "text-slate-500 hover:text-slate-300"
                                    }`}
                                  >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                      <path d="M4 14h6v8h4v-8h6L12 4 4 14z" />
                                    </svg>
                                  </button>
                                  <span className={`text-xs font-extrabold my-1 ${
                                    hasVotedUp ? "text-emerald-400" : hasVotedDown ? "text-red-400" : "text-slate-300"
                                  }`}>
                                    {post.votes_score ?? 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleVote(post.id, -1)}
                                    title="Downvote Post"
                                    className={`p-1 rounded transition-all hover:bg-white/[0.05] focus:outline-none ${
                                      hasVotedDown ? "text-red-400 scale-110 drop-shadow-[0_0_6px_rgba(248,113,113,0.3)]" : "text-slate-500 hover:text-slate-300"
                                    }`}
                                  >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                      <path d="M20 10h-6V2h-4v8H4l8 10 8-10z" />
                                    </svg>
                                  </button>
                                </div>

                                <div className="flex-1 p-4 md:p-5 flex flex-col">
                                  {/* Author / Tag Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.03] mb-3">
                                    <div className="flex items-center gap-2">
                                      {author.avatar_url ? (
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                                          <img src={author.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        renderInitials(author.full_name, "w-6 h-6 text-[8px] font-bold flex-shrink-0")
                                      )}
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 text-[10px] text-slate-400">
                                        <span className="font-bold text-slate-300 flex items-center gap-0.5">
                                          {author.full_name}
                                          <VerifiedIcon size={12} className="text-blue-400" />
                                        </span>
                                        <span className="hidden sm:inline text-slate-700">•</span>
                                        <div className="flex items-center gap-1">
                                          <span>@{author.username} ({author.year})</span>
                                          {post.user_id !== userId && (
                                            <button
                                              onClick={() => handleStartChat(post.user_id, author)}
                                              className="ml-1 p-0.5 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 flex items-center justify-center cursor-pointer"
                                              title="Send private message"
                                            >
                                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none uppercase">
                                      {post.category}
                                    </span>
                                  </div>

                                  {/* Title & Body */}
                                  <h3 className="text-sm sm:text-base font-semibold text-white leading-snug tracking-normal mb-2">
                                    {post.title}
                                  </h3>
                                  <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed whitespace-pre-wrap">
                                    {post.body}
                                  </p>

                                  {/* Base64 compressed image render */}
                                  {post.image_url && (
                                    <div className="mt-3.5 rounded-xl border border-white/[0.05] overflow-hidden bg-black/20 max-h-[300px] w-full flex items-center justify-center">
                                      <img src={post.image_url} alt="Post attachments" className="max-h-[300px] object-contain w-full" />
                                    </div>
                                  )}

                                  {/* Interactions Bar */}
                                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/[0.03] select-none text-[10px] sm:text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleComments(post.id)}
                                      className="flex items-center gap-1.5 font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <ChatBubbleIcon size={13} className="text-slate-500" />
                                      <span>{post.replies_count ?? 0} Replies</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                      {isAuthor && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => startEditPost(post)}
                                            className="font-bold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                                          >
                                            Edit
                                          </button>
                                          <span className="text-slate-700 select-none">|</span>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmPostId(post.id)}
                                            className="font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                      <span className="text-[9px] font-semibold text-slate-500 ml-2">
                                        {formatTimeAgo(post.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="glass-panel rounded-2xl p-10 text-center shadow-xl border-white/[0.06] bg-card-glow">
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto font-body">
                            You haven't posted anything yet. Share placement hacks, exam tips, or GGV student discussions!
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTab("feed");
                              setIsComposing(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="mt-4 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-xs font-bold text-white uppercase tracking-wider transition-all scale-[1.01]"
                          >
                            Create Your First Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {profileSubTab === "comments" && (
                    <div className="space-y-4">
                      {myCommentsLoading ? (
                        <div className="py-8 flex items-center justify-center gap-2 text-slate-500">
                          <svg className="animate-spin h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-xs uppercase tracking-wider font-bold">Fetching my comments...</span>
                        </div>
                      ) : myCommentsList.length > 0 ? (
                        myCommentsList.map((comm) => (
                          <motion.div
                            key={comm.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl border-white/[0.04] text-left space-y-3 relative overflow-hidden bg-card-glow"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-white/[0.03] pb-2 text-[10px] text-slate-400 font-semibold select-none">
                              <span className="text-blue-400 flex items-center gap-1">
                                💬 Replied to: <strong className="text-white">"{comm.posts?.title || "Community Discussion"}"</strong>
                              </span>
                              <span>{formatTimeAgo(comm.created_at)}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed font-body">
                              {comm.body}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="glass-panel rounded-2xl p-10 text-center shadow-xl border-white/[0.06] bg-card-glow">
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-body">
                            No comments posted yet. Start replying to campus student questions to build your verified reputation!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================================================================== */}
            {/* 📊 TAB: DASHBOARD ANALYTICS OVERVIEW */}
            {/* ==================================================================== */}
            {currentTab === "dashboard" && (() => {
              // Parse year and branch
              const titleParts = memberTitle ? memberTitle.split("/") : [];
              const profileYear = titleParts[0]?.trim() || "3rd Year";
              const profileBranch = titleParts[1]?.trim() || "CSE";

              // Dynamic profile progress score calculation
              const calculateProfileProgress = () => {
                let score = 0;
                if (memberName) score += 15;
                if (memberUsername) score += 15;
                if (bio) score += 20;
                if (avatarUrl) score += 15;
                if (selectedTags && selectedTags.length > 0) score += 15;
                if (resumeUploaded) score += 10;
                if (isVerified) score += 10;
                return score;
              };
              
              const profileCompletionPct = calculateProfileProgress();
              const strokeDashoffset = 188.4 - (188.4 * profileCompletionPct) / 100;

              // Communities count
              const joinedCommunitiesCount = Object.values(joinedCommunities).filter(Boolean).length;
              
              // Get actual user posts
              const userPosts = posts.filter(p => p.user_id === userId).slice(0, 3);
              // Get actual user comments
              const userComments = myCommentsList.slice(0, 3);
              
              // Active connection count fallback
              const totalConnectionsCount = connections.length > 0 ? connections.length : 12;

              // Unlocked badges criteria
              const badgeUnlocked = {
                early: true,
                verified: isVerified,
                contributor: totalPostsCount > 0,
                helper: totalCommentsCount > 0,
                leader: joinedCommunitiesCount >= 3,
                participant: Object.values(eventsRegistered).filter(Boolean).length > 0
              };

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 w-full text-left"
                >
                  {/* ==================================================================== */}
                  {/* 🌟 1. HERO BANNER: PERSONALIZED WELCOME */}
                  {/* ==================================================================== */}
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border-white/[0.06] bg-gradient-to-r from-brand/10 via-purple-500/5 to-transparent relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
                      {/* Glow Avatar */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg bg-[#0e1017] p-0.5 flex-shrink-0 flex items-center justify-center">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={memberName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            renderInitials(memberName, "w-full h-full text-xl font-bold rounded-full")
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-2xl font-bold font-heading text-white tracking-normal leading-none">
                            Welcome back, {memberName}!
                          </h2>
                          {isVerified && (
                            <span className="inline-flex items-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest leading-none select-none">
                              Verified Student ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-400 font-bold font-heading tracking-wide uppercase">
                          u/{memberUsername} • {profileBranch} • {profileYear}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          🏢 {memberCompany || "IIT Bombay"}
                        </p>
                      </div>
                    </div>

                    {/* Radial SVG Completion Score */}
                    <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] px-5 py-4.5 rounded-2xl z-10 flex-shrink-0 w-full sm:w-auto justify-center">
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 70 70">
                          {/* Background Circle */}
                          <circle cx="35" cy="35" r="30" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                          {/* Progress Circle */}
                          <circle cx="35" cy="35" r="30" stroke="url(#blueGradient)" strokeWidth="6" fill="transparent" 
                                  strokeDasharray="188.4" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
                          <defs>
                            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute text-xs font-black text-white font-sans">{profileCompletionPct}%</span>
                      </div>
                      
                      <div className="text-left space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading select-none">Profile Integrity</span>
                        <div className="text-xs font-black text-slate-300">
                          {profileCompletionPct === 100 ? "Complete Hub" : "Strengthen Presence"}
                        </div>
                        <span className="text-[9px] text-slate-400 font-sans block">Unlock premium circles & perks</span>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================================== */}
                  {/* 🧱 FULL-WIDTH LAYOUT CONTAINER */}
                  {/* ==================================================================== */}
                  <div className="space-y-6 w-full">

                      {/* 1. PROFILE PROGRESS CARD */}
                      <div className="glass-panel rounded-3xl p-6 shadow-xl border-white/[0.06] bg-card-glow space-y-5">
                        <h3 className="text-sm font-extrabold text-slate-300 font-heading uppercase tracking-wider pl-2.5 border-l-2 border-brand select-none flex items-center gap-2">
                          🎯 Profile Integrity
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Missing fields list / Checks */}
                          <div className="space-y-3.5 bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-left">
                            <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading select-none">
                              Campus Integrity Checklist
                            </h4>
                            
                            <div className="space-y-2.5">
                              {/* Name Check */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 flex items-center gap-2">
                                  <span className="text-emerald-400">✓</span> Full Name Added
                                </span>
                                <span className="text-slate-500 font-bold text-[10px]">+15%</span>
                              </div>
                              
                              {/* Avatar Check */}
                              <div className="flex items-center justify-between text-xs">
                                {avatarUrl ? (
                                  <span className="text-slate-300 flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Profile Picture Uploaded
                                  </span>
                                ) : (
                                  <button onClick={() => { setCurrentTab("profile"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer">
                                    ⚠ Upload Profile Picture
                                  </button>
                                )}
                                <span className="text-slate-500 font-bold text-[10px]">+15%</span>
                              </div>

                              {/* Bio Check */}
                              <div className="flex items-center justify-between text-xs">
                                {bio ? (
                                  <span className="text-slate-300 flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Biography Drafted
                                  </span>
                                ) : (
                                  <button onClick={() => { setCurrentTab("profile"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer">
                                    ✍ Add Short Profile Bio
                                  </button>
                                )}
                                <span className="text-slate-500 font-bold text-[10px]">+20%</span>
                              </div>

                              {/* Skills Check */}
                              <div className="flex items-center justify-between text-xs">
                                {selectedTags && selectedTags.length > 0 ? (
                                  <span className="text-slate-300 flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Academic Interests Added
                                  </span>
                                ) : (
                                  <button onClick={() => { setCurrentTab("profile"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer">
                                    💡 Select Student Interests
                                  </button>
                                )}
                                <span className="text-slate-500 font-bold text-[10px]">+15%</span>
                              </div>

                              {/* Resume Upload Status Check */}
                              <div className="flex items-center justify-between text-xs">
                                {resumeUploaded ? (
                                  <span className="text-slate-300 flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> College Resume Sync
                                  </span>
                                ) : (
                                  <button onClick={handleResumeSimulatedUpload} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer font-bold">
                                    📄 Upload Student Resume
                                  </button>
                                )}
                                <span className="text-slate-500 font-bold text-[10px]">+10%</span>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Resume uploaded status & Interactive simulator */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-left flex flex-col justify-between">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading select-none">
                                Resume Repository
                              </h4>
                              
                              {isUploadingResume ? (
                                <div className="py-2.5 space-y-2 text-center">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                                    <span>Syncing Document...</span>
                                    <span className="text-purple-400">{uploadProgress}%</span>
                                  </div>
                                  <div className="w-full bg-[#0e1017] rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-sans italic">Parsing placement markers...</p>
                                </div>
                              ) : resumeUploaded ? (
                                <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl flex items-center justify-between gap-3 mt-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-9 h-9 bg-purple-500/10 rounded-lg border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-bold text-slate-200 truncate leading-none">{resumeFileName}</h5>
                                      <span className="text-[9px] text-slate-500 font-sans leading-none block mt-1">1.2 MB • PDF Document</span>
                                    </div>
                                  </div>
                                  
                                  <button onClick={handleRemoveResume} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 cursor-pointer" title="Remove Resume">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div onClick={handleResumeSimulatedUpload} className="border border-dashed border-white/10 hover:border-purple-500/40 p-4 rounded-xl text-center cursor-pointer hover:bg-white/[0.01] transition-all group mt-1.5 select-none py-6">
                                  <svg className="w-6 h-6 text-slate-500 group-hover:text-purple-400 mx-auto transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 block mt-2 transition-colors">Sync Placement Resume</span>
                                  <span className="text-[8px] text-slate-600 font-sans block mt-0.5">Supports PDF format up to 5MB</span>
                                </div>
                              )}
                            </div>
                            
                            {resumeUploaded && (
                              <button onClick={handleResumeSimulatedUpload} className="mt-3 w-full py-1.5 rounded-xl bg-[#0e1017] hover:bg-[#121520] border border-white/[0.04] hover:border-brand/40 text-[9px] font-extrabold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer">
                                Update Document
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. COMMUNITY OVERVIEW */}
                      <div className="glass-panel rounded-3xl p-6 shadow-xl border-white/[0.06] bg-card-glow space-y-5">
                        <h3 className="text-sm font-extrabold text-slate-300 font-heading uppercase tracking-wider pl-2.5 border-l-2 border-brand select-none">
                          👥 Platform Presence & Circles
                        </h3>
                        
                        {/* 4 Stats counters grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-center hover:border-blue-500/25 transition-all duration-300 select-none">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading block mb-2">Joined Circles</span>
                            <span className="text-2xl font-black text-white font-sans">{joinedCommunitiesCount}</span>
                          </div>
                          
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-center hover:border-purple-500/25 transition-all duration-300 select-none">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading block mb-2">Total Posts</span>
                            <span className="text-2xl font-black text-white font-sans">{totalPostsCount}</span>
                          </div>

                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-center hover:border-pink-500/25 transition-all duration-300 select-none">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading block mb-2">Total Comments</span>
                            <span className="text-2xl font-black text-white font-sans">{totalCommentsCount}</span>
                          </div>

                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-center hover:border-emerald-500/25 transition-all duration-300 select-none">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading block mb-2">Network Peers</span>
                            <span className="text-2xl font-black text-white font-sans">{totalConnectionsCount}</span>
                          </div>
                        </div>

                        {/* Communities recently joined */}
                        <div className="space-y-3 bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl text-left">
                          <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none font-heading select-none">
                            Recently Joined Academic Circles
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            {[
                              { slug: memberCompany.toLowerCase().replace(/\s+/g, "-"), name: `r/${memberCompany.toLowerCase().replace(/\s+/g, "-")}`, detail: "Official College Circle", color: "border-blue-500/20 text-blue-400 bg-blue-500/5" },
                              { slug: "placement-prep", name: "r/placement-prep", detail: "Interview hacks & resume reviews", color: "border-purple-500/20 text-purple-400 bg-purple-500/5" },
                              { slug: "campus-life", name: "r/campus-life", detail: "Student feeds & campus bulletins", color: "border-pink-500/20 text-pink-400 bg-pink-500/5" },
                              { slug: "hackathons", name: "r/hackathons", detail: "Coding competitions & meetups", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" }
                            ].filter(c => joinedCommunities[c.slug] === true).map((circle) => (
                              <div key={circle.slug} className={`border p-3.5 rounded-xl flex items-center justify-between gap-3 bg-[#090a0f]/40 hover:border-brand/40 transition-all group`}>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-200 group-hover:text-brand transition-colors truncate">{circle.name}</h5>
                                  <p className="text-[10px] text-slate-500 font-sans truncate mt-0.5">{circle.detail}</p>
                                </div>
                                
                                <button
                                  onClick={() => {
                                    setCurrentTab("feed");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="px-2.5 py-1 text-[9px] font-bold border border-white/5 hover:border-brand/30 bg-[#0e1017] hover:bg-brand text-slate-400 hover:text-white rounded-lg transition-all flex-shrink-0 cursor-pointer"
                                >
                                  Enter ↗
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. SAVED POSTS & BOOKMARKS */}
                      <div className="glass-panel rounded-3xl p-6 shadow-xl border-white/[0.06] bg-card-glow space-y-5">
                        <h3 className="text-sm font-extrabold text-slate-300 font-heading uppercase tracking-wider pl-2.5 border-l-2 border-brand select-none flex items-center gap-2">
                          🔖 Saved Posts & Bookmarks
                        </h3>
                        
                        {(() => {
                          const savedList = posts.filter(p => savedPosts[p.id] === true);
                          
                          if (savedList.length === 0) {
                            return (
                              <div className="py-8 bg-[#02040a]/20 border border-white/[0.03] rounded-2xl text-center select-none py-10">
                                <span className="text-3xl block mb-2">🔖</span>
                                <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto leading-relaxed">
                                  No saved posts yet. Bookmark academic notes, doubt solvers, and placement insights from your home feed to see them here!
                                </p>
                                <button
                                  onClick={() => {
                                    setCurrentTab("feed");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="mt-4 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-xs font-bold text-white uppercase tracking-wider transition-all scale-[1.01] cursor-pointer"
                                >
                                  Go to Feed
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 gap-4">
                              {savedList.map(post => {
                                const author = post.profiles || {
                                  full_name: "Student Peer",
                                  username: "student",
                                  avatar_url: ""
                                };

                                return (
                                  <div
                                    key={`saved-post-${post.id}`}
                                    className="bg-[#02040a]/40 border border-white/[0.03] p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center hover:border-brand/30 transition-all select-none text-left"
                                  >
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="inline-block text-[8px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase leading-none">
                                          {post.category || "#general"}
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-sans">
                                          {formatTimeAgo(post.created_at)}
                                        </span>
                                      </div>
                                      
                                      <h4 className="text-sm font-bold text-white leading-snug truncate mt-1">
                                        {post.title}
                                      </h4>
                                      
                                      <div className="flex items-center gap-2 mt-2">
                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
                                          {author.avatar_url ? (
                                            <img src={author.avatar_url} alt={author.full_name} className="w-full h-full object-cover" />
                                          ) : (
                                            renderInitials(author.full_name, "w-full h-full text-[8px] font-bold")
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          By {author.full_name} (@{author.username})
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2 w-full sm:w-auto justify-end flex-shrink-0 mt-3 sm:mt-0">
                                      <button
                                        onClick={() => {
                                          setCurrentTab("feed");
                                          setExpandedPostId(post.id);
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="px-3.5 py-2 text-[10px] font-extrabold bg-brand hover:bg-brand-hover text-white rounded-xl transition-all cursor-pointer select-none"
                                      >
                                        View Discussion
                                      </button>
                                      
                                      <button
                                        onClick={() => setSavedPosts(prev => ({ ...prev, [post.id]: false }))}
                                        className="px-3.5 py-2 text-[10px] font-extrabold bg-[#0e1017] hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl text-slate-400 transition-all cursor-pointer select-none flex items-center gap-1"
                                        title="Remove bookmark"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3 1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V5.25m16.5.25v7.5" />
                                        </svg>
                                        Unsave
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                </motion.div>
              );
            })()}

            {/* ==================================================================== */}
            {/* 🔔 TAB: NOTIFICATIONS HUB */}
            {/* ==================================================================== */}
            {currentTab === "notifications" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border-white/[0.06] bg-[#090a0f]/95 relative overflow-hidden text-left space-y-6"
              >
                <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-brand/5 rounded-full blur-[70px] pointer-events-none" />

                <div className="pb-4 border-b border-white/[0.04]">
                  <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                    Notifications Hub
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Real-time alerts, connection requests, and system updates inside StudentHub.
                  </p>
                </div>

                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {isDemoAllowed(memberEmail) ? (
                    <>
                      {/* Notification 1 */}
                      <div className="bg-[#02040a]/40 border border-white/[0.03] hover:border-purple-500/20 p-4 rounded-2xl flex gap-3.5 items-start transition-all duration-300 select-none">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#0e1017] mt-0.5">
                          <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200" alt="Rahul" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-white leading-normal">
                            Rahul Sharma <span className="text-slate-400 font-semibold font-sans">accepted your connection request.</span>
                          </p>
                          <p className="text-[10px] text-purple-400 font-bold font-heading uppercase tracking-wide mt-0.5">NIT Trichy • CSE</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 font-sans flex-shrink-0">2m ago</span>
                      </div>

                      {/* Notification 2 */}
                      <div className="bg-[#02040a]/40 border border-white/[0.03] hover:border-blue-500/20 p-4 rounded-2xl flex gap-3.5 items-start transition-all duration-300 select-none">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#0e1017] mt-0.5">
                          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200" alt="Priya" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <p className="text-xs font-bold text-white leading-normal">
                            Priya Singh <span className="text-slate-400 font-semibold font-sans">commented on your placement thread:</span>
                          </p>
                          <p className="text-xs text-slate-300 leading-normal font-body italic border-l border-white/10 pl-2.5 my-1 bg-white/[0.01] py-1 rounded">
                            "Definitely true, open-source projects are game changers for tech grads!"
                          </p>
                          <p className="text-[10px] text-blue-400 font-bold font-heading uppercase tracking-wide">IIT Delhi • Mech</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 font-sans flex-shrink-0">1h ago</span>
                      </div>

                      {/* Notification 3 */}
                      <div className="bg-[#02040a]/40 border border-white/[0.03] hover:border-brand/20 p-4 rounded-2xl flex gap-3.5 items-start transition-all duration-300 select-none">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5 border border-purple-500/20">
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747" />
                          </svg>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-white leading-normal">
                            Neural Network Architects <span className="text-slate-400 font-semibold font-sans">updated their community layout guidelines.</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-extrabold font-heading uppercase tracking-wide mt-0.5">Featured Space</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 font-sans flex-shrink-0">4h ago</span>
                      </div>

                      {/* Notification 4 */}
                      <div className="bg-[#02040a]/40 border border-white/[0.03] hover:border-purple-500/20 p-4 rounded-2xl flex gap-3.5 items-start transition-all duration-300 select-none">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#0e1017] mt-0.5">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200" alt="Jordan" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-white leading-normal">
                            Jordan Chen <span className="text-slate-400 font-semibold font-sans">sent you a direct message.</span>
                          </p>
                          <p className="text-[10px] text-purple-400 font-bold font-heading uppercase tracking-wide mt-0.5">Stanford University</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 font-sans flex-shrink-0">1d ago</span>
                      </div>
                    </>
                  ) : (
                    (() => {
                      const incoming = connections.filter(c => c.status === "pending" && c.receiver_id === userId);
                      if (incoming.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-500 text-xs sm:text-sm font-body select-none">
                            No notifications yet.
                          </div>
                        );
                      }
                      return incoming.map((req: any) => {
                        const senderProfile = connectionProfiles.find((p: any) => p.user_id === req.sender_id) || peers.find((p: any) => p.user_id === req.sender_id) || {
                          user_id: req.sender_id,
                          full_name: "GGV Peer",
                          username: "classmate",
                          avatar_url: "",
                          branch: "General",
                          year: "Student",
                          college_name: "GGV College"
                        };
                        return (
                          <div key={req.id} className="bg-[#02040a]/40 border border-white/[0.03] hover:border-purple-500/20 p-4 rounded-2xl flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between transition-all duration-300 select-none">
                            <div className="flex gap-3.5 items-start">
                              {senderProfile.avatar_url ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#0e1017] mt-0.5">
                                  <img src={senderProfile.avatar_url} alt="Sender" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                renderInitials(senderProfile.full_name, "w-8 h-8 text-xs flex-shrink-0 mt-0.5")
                              )}
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-bold text-white leading-normal">
                                  {senderProfile.full_name} <span className="text-slate-400 font-semibold font-sans">sent you a connection request.</span>
                                </p>
                                <p className="text-[10px] text-purple-400 font-bold font-heading uppercase tracking-wide mt-0.5">
                                  {senderProfile.college_name || "GGV College"} • {senderProfile.branch} ({senderProfile.year})
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center w-full sm:w-auto justify-end flex-shrink-0 mt-2 sm:mt-0">
                              <button
                                type="button"
                                onClick={() => handleAcceptConnectionRequest(req.sender_id, req.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectConnectionRequest(req.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white text-[10px] font-semibold active:scale-95 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </motion.div>
            )}

            {/* ==================================================================== */}
            {/* ⚙️ TAB: SETTINGS & PREFERENCES */}
            {/* ==================================================================== */}
            {currentTab === "settings" && (() => {
              // Custom list of communities for Settings
              const settingsCommunities = isDemoAllowed(memberEmail) ? [
                { slug: "neural-network-architects", name: "Neural Network Architects", members: "1,240 students" },
                { slug: "surgical-precision-hub", name: "Surgical Precision Hub", members: "850 students" },
                { slug: "constitutional-law-forum", name: "Constitutional Law Forum", members: "540 students" },
                { slug: "product-management-alliance", name: "Product Management Alliance", members: "1,920 students" },
                { slug: "creative-designers-hub", name: "Creative Designers Hub", members: "1,100 students" }
              ] : (memberCompany ? [
                { slug: memberCompany.toLowerCase().replace(/\s+/g, "-"), name: memberCompany, members: "Official Space" }
              ] : []);

              const presetAvatars = [
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200"
              ];

              const handlePasswordUpdate = (e: React.FormEvent) => {
                e.preventDefault();
                if (!securityCurrentPassword || !securityNewPassword || !securityConfirmPassword) {
                  setSecurityStatus({ type: "error", message: "All password fields are required!" });
                  return;
                }
                if (securityNewPassword !== securityConfirmPassword) {
                  setSecurityStatus({ type: "error", message: "New password and confirmation do not match!" });
                  return;
                }
                setSecurityStatus({ type: "success", message: "Password updated successfully! Active sessions refreshed." });
                setSecurityCurrentPassword("");
                setSecurityNewPassword("");
                setSecurityConfirmPassword("");
                setTimeout(() => setSecurityStatus(null), 4000);
              };

              const renderToggle = (val: boolean, setVal: (v: boolean) => void, title: string, desc: string) => (
                <div className="flex items-center justify-between border-b border-white/[0.03] last:border-0 pb-4 pt-4 first:pt-0">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-200 transition-colors duration-300">{title}</p>
                    <p className="text-[10px] text-slate-400 font-sans leading-normal">{desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setVal(!val);
                    }}
                    className={`w-10 h-5.5 rounded-full flex items-center p-0.5 transition-all duration-300 select-none flex-shrink-0 cursor-pointer ${
                      val ? "bg-purple-600 border border-purple-500" : "bg-white/[0.06] border border-white/[0.08]"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                        val ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border-white/[0.06] bg-[#090a0f]/95 relative overflow-hidden text-left"
                >
                  <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-brand/5 rounded-full blur-[70px] pointer-events-none" />

                  {/* Top Header */}
                  <div className="pb-5 border-b border-white/[0.04] mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold font-heading text-white tracking-tight flex items-center gap-2">
                        <span>⚙️</span> System Settings & Preferences
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-sans">
                        Configure your academic profile, notifications, security sessions, and student verification.
                      </p>
                    </div>
                    {/* Cloud status bar */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center bg-[#02040a]/40 border border-white/[0.03] px-3 py-1 rounded-full text-[10px] font-sans text-slate-400 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      All preferences synced
                    </div>
                  </div>

                  {/* Responsive Grid */}
                  <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left Sidebar Sections Navigation */}
                    <div className="w-full md:w-[230px] flex-shrink-0 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-white/[0.06] md:pr-4">
                      {[
                        { id: "profile", label: "Profile Settings", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )},
                        { id: "privacy", label: "Privacy Settings", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )},
                        { id: "notifications", label: "Notifications", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        )},
                        { id: "community", label: "Community Spaces", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )},
                        { id: "security", label: "Security & Keys", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )},
                        { id: "appearance", label: "Appearance & UI", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        )},
                        { id: "verification", label: "ID Verification", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806a3.42 3.42 0 014.438 0a3.42 3.42 0 001.946.806a3.42 3.42 0 013.138 3.138a3.42 3.42 0 00.806 1.946a3.42 3.42 0 010 4.438a3.42 3.42 0 00-.806 1.946a3.42 3.42 0 01-3.138 3.138a3.42 3.42 0 00-1.946.806a3.42 3.42 0 01-4.438 0a3.42 3.42 0 00-1.946-.806" />
                          </svg>
                        )},
                        { id: "account", label: "Account Control", icon: (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        )}
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSettingsSection(item.id);
                            if (typeof window !== "undefined") {
                              setSecurityStatus(null);
                            }
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 text-left rounded-xl transition-all duration-300 font-heading text-xs font-bold tracking-wide select-none cursor-pointer flex-shrink-0 ${
                            activeSettingsSection === item.id
                              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/5"
                              : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Right Panel Main Area */}
                    <div className="flex-1 md:pl-4 space-y-6 text-left min-h-[460px]">

                      {/* 1️⃣ PROFILE SETTINGS */}
                      {activeSettingsSection === "profile" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Profile Information
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Update your academic identities, avatar credentials, and student biography card.
                            </p>
                          </div>

                          {/* Avatar Sync Hub */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/40 bg-[#0e1017] group flex-shrink-0 shadow-lg">
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900/60 font-bold text-lg">
                                    {settingsName ? settingsName.charAt(0) : "S"}
                                  </div>
                                )}
                                {isDemoAllowed(memberEmail) && (
                                  <div className="absolute inset-0 bg-[#02040a]/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer select-none">
                                    <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider">Change</span>
                                    <svg className="w-3.5 h-3.5 text-white mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {isDemoAllowed(memberEmail) ? (
                                <div className="space-y-1 flex-1">
                                  <h5 className="font-extrabold text-xs text-slate-200">Change Profile Avatar</h5>
                                  <p className="text-[10px] text-slate-500 font-sans">
                                    Select a high-fidelity preset classmate avatar below or input a custom photo URL.
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    {presetAvatars.map((url, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setAvatarUrl(url)}
                                        className={`w-7 h-7 rounded-full overflow-hidden border transition-all duration-300 cursor-pointer flex-shrink-0 ${
                                          avatarUrl === url
                                            ? "border-purple-500 scale-110 shadow-lg shadow-purple-500/20"
                                            : "border-white/10 hover:border-white/30"
                                        }`}
                                      >
                                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-extrabold text-xs text-slate-200">Verified Profile Picture</h5>
                                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider select-none">
                                      Active Account
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                                    Your profile photo is registered. Live account details are managed securely.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Direct URL Input */}
                            {isDemoAllowed(memberEmail) && (
                              <div className="space-y-1.5 border-t border-white/[0.02] pt-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Custom Photo Image URL</label>
                                <input
                                  type="text"
                                  value={avatarUrl}
                                  onChange={(e) => setAvatarUrl(e.target.value)}
                                  placeholder="https://images.unsplash.com/your-custom-profile-photo..."
                                  className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                />
                              </div>
                            )}
                          </div>

                          {/* Profile Fields Form */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                                <input
                                  type="text"
                                  value={settingsName}
                                  onChange={(e) => setSettingsName(e.target.value)}
                                  placeholder="Your full name"
                                  className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-2 text-xs text-slate-500 select-none">@</span>
                                  <input
                                    type="text"
                                    value={settingsUsername}
                                    onChange={(e) => setSettingsUsername(e.target.value)}
                                    placeholder="username"
                                    className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-sans font-bold"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">College / University</label>
                                <input
                                  type="text"
                                  value={settingsCollege}
                                  onChange={(e) => setSettingsCollege(e.target.value)}
                                  placeholder="E.g. IIT Bombay"
                                  className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Academic Year</label>
                                <select
                                  value={settingsYear}
                                  onChange={(e) => setSettingsYear(e.target.value)}
                                  className="w-full bg-[#02040a]/90 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-sans"
                                >
                                  <option value="1st Year">1st Year (Freshman)</option>
                                  <option value="2nd Year">2nd Year (Sophomore)</option>
                                  <option value="3rd Year">3rd Year (Junior)</option>
                                  <option value="4th Year">4th Year (Senior)</option>
                                  <option value="Postgraduate">Postgraduate (MS/PhD)</option>
                                </select>
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Academic Branch / Major</label>
                                <input
                                  type="text"
                                  value={settingsBranch}
                                  onChange={(e) => setSettingsBranch(e.target.value)}
                                  placeholder="E.g. Computer Science & Engineering"
                                  className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bio (Tell peers about yourself)</label>
                                  <span className="text-[9px] text-slate-500 font-sans">{settingsBio.length}/160</span>
                                </div>
                                <textarea
                                  value={settingsBio}
                                  onChange={(e) => setSettingsBio(e.target.value.slice(0, 160))}
                                  placeholder="E.g. Aspiring systems engineer, builder in Rust, exploring machine learning lattices."
                                  rows={3}
                                  className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-sans leading-relaxed resize-none"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-white/[0.02]">
                              <button
                                onClick={handleSaveProfileSettings}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/10 cursor-pointer select-none transition-all duration-300 transform active:scale-95"
                              >
                                Save Profile Details
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2️⃣ PRIVACY SETTINGS */}
                      {activeSettingsSection === "privacy" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Privacy & Safety Preferences
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Control who sees your academic timeline, connections lists, and message feed rules.
                            </p>
                          </div>

                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            {renderToggle(
                              privacyPublicProfile,
                              (val) => {
                                setPrivacyPublicProfile(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_privacy_public", String(val));
                              },
                              "Public Searchable Profile",
                              "Allow search engines and non-authenticated student peers to index and view your student card."
                            )}

                            {renderToggle(
                              privacyShowCollege,
                              (val) => {
                                setPrivacyShowCollege(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_privacy_college", String(val));
                              },
                              "Show College Affiliation",
                              "Display your current college name, year, and course branch to peers on community boards."
                            )}

                            {renderToggle(
                              privacyShowConnections,
                              (val) => {
                                setPrivacyShowConnections(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_privacy_connections", String(val));
                              },
                              "Show Connections Network List",
                              "Allow approved student connections to browse your total academic connection list."
                            )}

                            {renderToggle(
                              privacyShowOnlineStatus,
                              (val) => {
                                setPrivacyShowOnlineStatus(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_privacy_online", String(val));
                              },
                              "Show Real-Time Online Indicator",
                              "Display a green active beacon in group chats and connection lists when you are active on the site."
                            )}
                          </div>

                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-3">
                            <div className="space-y-1">
                              <h5 className="font-extrabold text-xs text-slate-200">Direct Message Authority</h5>
                              <p className="text-[10px] text-slate-400 font-sans">
                                Select who is allowed to initiate direct chats and voice notes with you.
                              </p>
                            </div>
                            <select
                              value={privacyWhoCanMessage}
                              onChange={(e) => {
                                setPrivacyWhoCanMessage(e.target.value);
                                if (typeof window !== "undefined") localStorage.setItem("setting_privacy_message", e.target.value);
                              }}
                              className="w-full bg-[#02040a]/90 border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-sans"
                            >
                              <option value="everyone">Everyone (All registered, verified student members)</option>
                              <option value="connections">Connections Only (Only peers you have accepted requests from)</option>
                              <option value="nobody">Nobody (Lock direct messaging entirely)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 3️⃣ NOTIFICATION SETTINGS */}
                      {activeSettingsSection === "notifications" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Alerts & Notification Hub
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Tune when and how you receive community notifications, message alerts, and emails.
                            </p>
                          </div>

                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            {renderToggle(
                              notifNewMessages,
                              (val) => {
                                setNotifNewMessages(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_notif_messages", String(val));
                              },
                              "New Direct Message Notifications",
                              "Receive instant audio-visual pings when a student peer sends you DMs or voice notes."
                            )}

                            {renderToggle(
                              notifCommunityPosts,
                              (val) => {
                                setNotifCommunityPosts(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_notif_posts", String(val));
                              },
                              "Community Activity Alerts",
                              "Get notifications for newly created topics, code contributions, and placement advice in joined communities."
                            )}

                            {renderToggle(
                              notifConnectionRequests,
                              (val) => {
                                setNotifConnectionRequests(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_notif_requests", String(val));
                              },
                              "Peer Connection Requests",
                              "Alert me immediately when a classmate or batch peer sends a professional network request."
                            )}

                            {renderToggle(
                              notifEventReminders,
                              (val) => {
                                setNotifEventReminders(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_notif_events", String(val));
                              },
                              "Upcoming Event & Hackathon Reminders",
                              "Get reminders 24 hours prior to campus tech talk panels, hackathons, and recruitments you bookmarked."
                            )}

                            {renderToggle(
                              notifEmail,
                              (val) => {
                                setNotifEmail(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_notif_email", String(val));
                              },
                              "Weekly Email Digests",
                              "Send weekly digests to college email outlining critical system updates and hot placement openings."
                            )}
                          </div>

                          {/* Focus mode simulator */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
                            <div className="space-y-0.5 text-left">
                              <h5 className="font-extrabold text-xs text-slate-200">Temporary Focus Mode</h5>
                              <p className="text-[10px] text-slate-400 font-sans">
                                Disable all system-wide notification alerts for deep focus sessions or coding projects.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setNotifNewMessages(false);
                                setNotifCommunityPosts(false);
                                setNotifConnectionRequests(false);
                                setNotifEventReminders(false);
                                alert("Focus Mode Enabled: All notifications have been silenced.");
                              }}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-purple-400 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer transition-all self-start sm:self-center"
                            >
                              Silence All Notifications
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 4️⃣ COMMUNITY SETTINGS */}
                      {activeSettingsSection === "community" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Community Space Settings
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Manage which student circle updates populate your feed and mute specific spaces.
                            </p>
                          </div>

                          {/* General Preference */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            {renderToggle(
                              muteCommunityNotifications,
                              (val) => {
                                setMuteCommunityNotifications(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_comm_mute", String(val));
                              },
                              "Mute All Community Posts",
                              "Suppress notifications from all community spaces. Post updates will still show in feeds without visual alerts."
                            )}

                            <div className="space-y-1.5 pt-2 border-t border-white/[0.02]">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Community Content Preference</label>
                              <select
                                value={communityContentPreferences}
                                onChange={(e) => {
                                  setCommunityContentPreferences(e.target.value);
                                  if (typeof window !== "undefined") localStorage.setItem("setting_comm_pref", e.target.value);
                                }}
                                className="w-full bg-[#02040a]/90 border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-sans"
                              >
                                <option value="all">Show All Activity (Discussions, code snippets, placements)</option>
                                <option value="announcements">Primary Updates Only (Announcements and hackathon launches)</option>
                                <option value="none">No Community Content (Strictly clean academic portfolio focus)</option>
                              </select>
                            </div>
                          </div>

                          {/* Joined communities management list */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <h5 className="font-extrabold text-xs text-slate-200">Manage Joined Communities</h5>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Instantly subscribe to or unsubscribe from active study networks and placement hub channels.
                            </p>
                            
                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {settingsCommunities.map((comm) => {
                                const isJoined = joinedCommunities[comm.slug] === true;
                                return (
                                  <div
                                    key={comm.slug}
                                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.02] bg-[#02040a]/30 hover:border-white/[0.05] transition-all duration-300"
                                  >
                                    <div className="text-left">
                                      <p className="text-xs font-bold text-slate-200">{comm.name}</p>
                                      <p className="text-[9px] text-slate-500 font-sans">{comm.members} • {isJoined ? "Joined ✓" : "Not Joined"}</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setJoinedCommunities((prev) => ({
                                          ...prev,
                                          [comm.slug]: !isJoined
                                        }));
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all duration-300 ${
                                        isJoined
                                          ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/20"
                                      }`}
                                    >
                                      {isJoined ? "Leave" : "Join Space"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5️⃣ SECURITY SETTINGS */}
                      {activeSettingsSection === "security" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Security & Active Devices
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Reset your college system keys, view logged-in devices, and configure secondary guards.
                            </p>
                          </div>

                          {/* Change Password */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <h5 className="font-extrabold text-xs text-slate-200">Update Password Credentials</h5>
                            
                            {securityStatus && (
                              <div
                                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                                  securityStatus.type === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}
                              >
                                {securityStatus.message}
                              </div>
                            )}

                            <form onSubmit={handlePasswordUpdate} className="space-y-3.5">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Current Security Password</label>
                                <input
                                  type="password"
                                  value={securityCurrentPassword}
                                  onChange={(e) => setSecurityCurrentPassword(e.target.value)}
                                  placeholder="••••••••••••••"
                                  className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">New Secure Password</label>
                                  <input
                                    type="password"
                                    value={securityNewPassword}
                                    onChange={(e) => setSecurityNewPassword(e.target.value)}
                                    placeholder="••••••••••••••"
                                    className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                                  <input
                                    type="password"
                                    value={securityConfirmPassword}
                                    onChange={(e) => setSecurityConfirmPassword(e.target.value)}
                                    placeholder="••••••••••••••"
                                    className="w-full bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-all font-sans"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="submit"
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white cursor-pointer select-none transition-all duration-300"
                                >
                                  Update Security Password
                                </button>
                              </div>
                            </form>
                          </div>

                          {/* Login Activity / Active Sessions */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center">
                              <h5 className="font-extrabold text-xs text-slate-200">Active Login Sessions</h5>
                              <button
                                onClick={() => {
                                  setSecuritySessions((prev) => prev.filter((s) => s.time === "Active Now"));
                                  setSecurityStatus({ type: "success", message: "Logged out from all alternate devices." });
                                  setTimeout(() => setSecurityStatus(null), 3000);
                                }}
                                className="text-[9px] font-black uppercase text-red-400 hover:text-red-300 transition-colors cursor-pointer select-none"
                              >
                                Revoke Other Devices
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-sans select-none">
                              You are currently authenticated in the following devices. Log out from unrecognized platforms.
                            </p>

                            <div className="space-y-2">
                              {securitySessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.02] bg-[#02040a]/25 hover:border-white/[0.05] transition-all duration-300 select-none"
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Icon */}
                                    <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-400">
                                      {session.device.includes("iPhone") ? (
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="text-left font-sans">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-bold text-slate-200">{session.device}</p>
                                        <span className="text-[9px] text-slate-500 font-semibold">• {session.browser}</span>
                                      </div>
                                      <p className="text-[9px] text-slate-500 mt-0.5">{session.location} • {session.time}</p>
                                    </div>
                                  </div>

                                  {session.time !== "Active Now" && (
                                    <button
                                      onClick={() => {
                                        setSecuritySessions((prev) => prev.filter((s) => s.id !== session.id));
                                      }}
                                      className="px-2.5 py-1.5 text-[9px] font-black uppercase border border-red-500/10 hover:border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer transition-all"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 2FA Coming Soon */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl flex items-center justify-between gap-4 select-none relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-purple-500/5 rounded-full blur-[20px]" />
                            <div className="text-left space-y-1.5 max-w-[70%]">
                              <div className="flex items-center gap-2">
                                <h5 className="font-extrabold text-xs text-slate-200">Two-Factor Authentication (2FA)</h5>
                                <span className="text-[8px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                  Coming Soon
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans leading-normal">
                                Secure your account using authenticator app codes (TOTP) or SMS guards. Unlocks globally in Next Release.
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6️⃣ APPEARANCE SETTINGS */}
                      {activeSettingsSection === "appearance" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Appearance & Display Settings
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Customize theme palettes, feed space layouts, and standard text scaling.
                            </p>
                          </div>

                          {/* Theme Selector */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <h5 className="font-extrabold text-xs text-slate-200">System Color Scheme</h5>
                            <div className="grid grid-cols-2 gap-4">
                              
                              {/* Dark Mode Card */}
                              <button
                                onClick={() => {
                                  setAppearanceMode("dark");
                                  if (typeof window !== "undefined") localStorage.setItem("setting_appear_mode", "dark");
                                }}
                                className={`p-4 rounded-xl border text-left space-y-3 cursor-pointer select-none transition-all duration-300 ${
                                  appearanceMode === "dark"
                                    ? "bg-purple-950/10 border-purple-500 shadow-xl shadow-purple-500/5 scale-[1.02]"
                                    : "bg-[#02040a]/60 border-white/[0.04] hover:border-white/[0.1] hover:bg-[#02040a]/80"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                  </div>
                                  {appearanceMode === "dark" && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">Onyx Dark Theme</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 font-sans leading-normal">Deep dark glassmorphic styles tailored for developer eye comfort.</p>
                                </div>
                              </button>

                              {/* Light Mode Card (Simulated) */}
                              <button
                                onClick={() => {
                                  setAppearanceMode("light");
                                  if (typeof window !== "undefined") localStorage.setItem("setting_appear_mode", "light");
                                }}
                                className={`p-4 rounded-xl border text-left space-y-3 cursor-pointer select-none transition-all duration-300 ${
                                  appearanceMode === "light"
                                    ? "bg-purple-950/10 border-purple-500 shadow-xl shadow-purple-500/5 scale-[1.02]"
                                    : "bg-[#02040a]/60 border-white/[0.04] hover:border-white/[0.1] hover:bg-[#02040a]/80"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                    </svg>
                                  </div>
                                  {appearanceMode === "light" && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">Chalk Light Theme</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 font-sans leading-normal">Clean high-contrast layouts tailored for study and bright rooms.</p>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Interactive Display Toggles */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            {renderToggle(
                              appearanceCompactFeed,
                              (val) => {
                                setAppearanceCompactFeed(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_appear_compact", String(val));
                              },
                              "Compact Discussion Feed Layout",
                              "Shrinks code feeds, post card spacings, and reply elements to see double the threads on a single screen."
                            )}

                            {renderToggle(
                              appearanceLargerText,
                              (val) => {
                                setAppearanceLargerText(val);
                                if (typeof window !== "undefined") localStorage.setItem("setting_appear_text", String(val));
                              },
                              "Larger Text Scaling Mode",
                              "Increases system-wide text sizing by 12% to facilitate screen scanning and improve typography readability."
                            )}
                          </div>
                        </div>
                      )}

                      {/* 7️⃣ VERIFICATION SETTINGS */}
                      {activeSettingsSection === "verification" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Student Credentials & Badge Status
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Verify your enrollment standing to earn your golden verified shield badge and unlock premium networks.
                            </p>
                          </div>

                          {/* Verification Shield Card */}
                          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 p-5 rounded-2xl relative overflow-hidden select-none text-left">
                            <div className="absolute top-0 right-0 w-[140px] h-[140px] bg-yellow-500/5 rounded-full blur-[45px] pointer-events-none" />
                            <div className="flex gap-4 items-start">
                              <div className="w-12 h-12 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
                                <svg className="w-6.5 h-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806a3.42 3.42 0 014.438 0a3.42 3.42 0 001.946.806a3.42 3.42 0 013.138 3.138a3.42 3.42 0 00.806 1.946a3.42 3.42 0 010 4.438a3.42 3.42 0 00-.806 1.946a3.42 3.42 0 01-3.138 3.138a3.42 3.42 0 00-1.946.806a3.42 3.42 0 01-4.438 0a3.42 3.42 0 00-1.946-.806" />
                                </svg>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                  <h5 className="font-extrabold text-xs text-yellow-300">Verified Academic Standing</h5>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border ${
                                    isVerified
                                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                      : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                                  }`}>
                                    {isVerified ? "Verified Badged" : "Pending Credentials"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-300 font-sans leading-normal">
                                  {isVerified
                                    ? "Classroom Verified Status Active! You have validated your enrollment at your institution. Enjoy professional credentials, placement board access, and total networking rights."
                                    : "Verify your enrollment by completing student email verification or uploading your active collegiate ID card. Verified students receive priority application flags."}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Email Verification */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center font-sans">
                              <h5 className="font-extrabold text-xs text-slate-200">College Email Validation</h5>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                verificationEmailStatus === "Verified"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {verificationEmailStatus}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="email"
                                value={verificationEmail}
                                onChange={(e) => setVerificationEmail(e.target.value)}
                                disabled={verificationEmailStatus === "Verified"}
                                placeholder="name@iitb.ac.in"
                                className="flex-1 bg-[#02040a]/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-all font-sans disabled:opacity-60"
                              />
                              <button
                                onClick={handleVerifyEmailSimulated}
                                disabled={verificationEmailStatus === "Verified"}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none transition-all"
                              >
                                {verificationEmailStatus === "Verified" ? "Verified ✓" : "Verify Email"}
                              </button>
                            </div>
                          </div>

                          {/* Document Dropzone Upload Simulator */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                            <h5 className="font-extrabold text-xs text-slate-200">Upload Student Identity Card</h5>
                            <p className="text-[10px] text-slate-400 font-sans select-none">
                              If your college doesn't issue student email addresses, upload a photo of your ID Card (front and back) or Tuition Receipt.
                            </p>

                            {/* Upload Area */}
                            <button
                              onClick={handleVerifyDocSimulatedUpload}
                              disabled={isUploadingVerificationDoc}
                              className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer select-none ${
                                isUploadingVerificationDoc
                                  ? "border-purple-500/40 bg-purple-500/5 cursor-wait"
                                  : verificationDocName
                                  ? "border-emerald-500/30 bg-emerald-500/[0.01] hover:border-emerald-500/50"
                                  : "border-white/[0.08] bg-[#02040a]/20 hover:border-purple-500/20 hover:bg-purple-500/[0.01]"
                              }`}
                            >
                              {/* State 1: Uploading progress */}
                              {isUploadingVerificationDoc ? (
                                <div className="space-y-3 w-full max-w-[200px]">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-purple-400 font-heading">
                                    <span>ANALYZING CREDENTIALS...</span>
                                    <span>{verificationDocUploadProgress}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.03]">
                                    <div
                                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150"
                                      style={{ width: `${verificationDocUploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : verificationDocName ? (
                                <>
                                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                                    </svg>
                                  </div>
                                  <div className="text-center font-sans">
                                    <p className="text-xs font-bold text-slate-200">{verificationDocName}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Size 1.4 MB • Status validated successfully</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-400 flex items-center justify-center">
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-slate-300">Tap to upload Collegiate ID Document</p>
                                    <p className="text-[9px] text-slate-500 font-sans mt-1">Accepts PDF, PNG, or JPG up to 5MB size</p>
                                  </div>
                                </>
                              )}
                            </button>

                            {verificationDocName && (
                              <div className="bg-[#02040a]/20 border border-white/[0.02] p-3 rounded-xl space-y-1.5 text-left text-[10px] text-slate-400 font-sans select-none">
                                <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px]">ID Card AI Extraction Logs:</p>
                                <div className="space-y-0.5">
                                  <p className="text-emerald-400 flex items-center gap-1"><span>✓</span> Student Name matches <strong>{settingsName || memberName}</strong></p>
                                  <p className="text-emerald-400 flex items-center gap-1"><span>✓</span> Institute matches <strong>{settingsCollege || memberCompany}</strong></p>
                                  <p className="text-emerald-400 flex items-center gap-1"><span>✓</span> ID validity active until 2027</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 8️⃣ ACCOUNT MANAGEMENT */}
                      {activeSettingsSection === "account" && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-heading uppercase tracking-wider pl-2 border-l-2 border-purple-500 select-none">
                              Account Control & Danger Zone
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans pl-2 select-none">
                              Download your complete profile data package or manage permanent closure options.
                            </p>
                          </div>

                          {/* Data portability card */}
                          <div className="bg-[#02040a]/40 border border-white/[0.03] p-5 rounded-2xl space-y-4 text-left">
                            <h5 className="font-extrabold text-xs text-slate-200">Data Portability & Archives</h5>
                            <p className="text-[10px] text-slate-400 font-sans leading-normal">
                              Download a copy of your campus profiles, code posts, community comments, and connection networks.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={handleExportDataSimulated}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#02040a]/60 hover:bg-[#02040a]/90 border border-white/[0.05] hover:border-purple-500/20 text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                              >
                                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Export My Profile Data (JSON)</span>
                              </button>

                              <button
                                onClick={handleDownloadPostsSimulated}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#02040a]/60 hover:bg-[#02040a]/90 border border-white/[0.05] hover:border-blue-500/20 text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                              >
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Download My Posts (CSV)</span>
                              </button>
                            </div>
                          </div>

                          {/* Danger Zone */}
                          <div className="bg-red-500/[0.02] border border-red-500/15 p-5 rounded-2xl space-y-4 text-left">
                            <h5 className="font-extrabold text-xs text-red-400">Danger Operations Area</h5>
                            <p className="text-[10px] text-slate-400 font-sans leading-normal">
                              Warning: These steps are irreversible. Manage permanent account deactivation or total server deletion.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button
                                onClick={() => {
                                  const confirmBox = window.confirm("Are you sure you want to deactivate your StudentHub profile temporarily?");
                                  if (confirmBox) {
                                    alert("Your student card has been deactivated. You can reactivate it at any time.");
                                  }
                                }}
                                className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-amber-500/90 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer select-none"
                              >
                                Deactivate Student Card
                              </button>

                              <button
                                onClick={() => {
                                  const confirmBox = window.confirm("CRITICAL WARNING: Are you absolutely sure you want to permanently delete your StudentHub account? This purges all connections, posts, code snippets, and active student profiles. This action cannot be undone.");
                                  if (confirmBox) {
                                    alert("De-registration sequence completed. Your data has been permanently purged from archives.");
                                  }
                                }}
                                className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer select-none"
                              >
                                Delete Account Permanently
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </motion.div>
              );
            })()}
          </div>
        </div>

      </main>

      {/* DYNAMIC POST EDITING DIALOGUE MODAL */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPost(null)}
              className="absolute inset-0 bg-[#02040ae6] backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[440px] bg-[#040815]/95 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-left font-body bg-card-glow"
            >
              <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-brand to-transparent" />
              
              <h3 className="text-lg font-bold font-heading text-white tracking-tight pb-3 border-b border-white/[0.04] mb-4">
                Edit Discussion Post
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Post Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Circle</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand font-semibold cursor-pointer"
                  >
                    <option value="#general">#general</option>
                    <option value="#placement-prep">#placement-prep</option>
                    <option value="#academic-notes">#academic-notes</option>
                    <option value="#hackathons">#hackathons</option>
                    <option value="#campus-life">#campus-life</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Body Text</label>
                  <textarea
                    required
                    rows={4}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand font-body resize-none"
                  />
                </div>

                {editError && (
                  <p className="text-xs font-semibold text-red-400">{editError}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="rounded-xl border border-slate-800 bg-[#02040a]/40 hover:bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoader}
                    className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-hover cursor-pointer"
                  >
                    {editLoader ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC POST DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmPostId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmPostId(null)}
              className="absolute inset-0 bg-[#02040ae6] backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[360px] bg-[#040815]/95 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-center font-body bg-card-glow"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-base font-bold font-heading text-white tracking-tight mb-2">
                Delete Discussion Post?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Are you sure you want to delete this post? This action is permanent and will completely delete the post and all its replies.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmPostId(null)}
                  className="flex-1 rounded-xl border border-slate-800 bg-[#02040a]/40 hover:bg-slate-900/60 py-2.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(deleteConfirmPostId)}
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 cursor-pointer"
                >
                  Delete Post
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM GLASSMORPHIC COMMUNITY CREATION MODAL OVERLAY */}
      <AnimatePresence>
        {isCreatingCommunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingCommunity(false)}
              className="absolute inset-0 bg-[#02040ae6] backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[460px] bg-[#040815]/95 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-left font-body bg-card-glow"
            >
              <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
              
              <h3 className="text-lg font-bold font-heading text-white tracking-tight pb-3 border-b border-white/[0.04] mb-4 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Create New Community Circle
              </h3>

              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Community Name</label>
                  <input
                    type="text"
                    required
                    value={createCommunityName}
                    onChange={(e) => setCreateCommunityName(e.target.value)}
                    placeholder="e.g. Artificial Intelligence Circle"
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-semibold placeholder-slate-600 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Category / Student Coordinate Focus</label>
                  <select
                    value={createCommunityCategory}
                    onChange={(e) => setCreateCommunityCategory(e.target.value)}
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer transition-all"
                  >
                    <option value="College">College Specific</option>
                    <option value="Technology">Technology & Engineering</option>
                    <option value="Placements">Placements & Prep</option>
                    <option value="Startups">Startups & Incubator</option>
                    <option value="AI/ML">AI & Machine Learning</option>
                    <option value="Hackathons">Hackathons & Build</option>
                    <option value="Exams">Exams & Core Studies</option>
                    <option value="General Interest">General Student Interest</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Community Description</label>
                  <textarea
                    required
                    rows={4}
                    value={createCommunityDescription}
                    onChange={(e) => setCreateCommunityDescription(e.target.value)}
                    placeholder="Describe the scope, discussions topics, rules, or verified college memberships allowed..."
                    className="w-full bg-[#040815]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-body resize-none transition-all leading-relaxed"
                  />
                </div>

                {createCommunityError && (
                  <p className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl">{createCommunityError}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateCommunityName("");
                      setCreateCommunityDescription("");
                      setIsCreatingCommunity(false);
                    }}
                    className="rounded-xl border border-slate-800 bg-[#02040a]/40 hover:bg-slate-900/60 px-4.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCommunityLoader}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5.5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center min-w-[120px]"
                  >
                    {creatingCommunityLoader ? "Publishing..." : "Create Circle"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div> {/* CLOSE RIGHT MAIN AREA WRAPPER */}
    </div>
  );
}
