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
import { getSeedPosts, getPostCommunitySlug } from "../../dashboard/page";

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

interface Community {
  id?: string;
  name: string;
  slug: string;
  description: string;
  banner_url: string;
  created_at?: string;
}

type ComposerTab = "text" | "image";

const DEMO_WHITELIST = ["factanlgesupoort@gmail.com", "userai4545@gmail.com"];

const isDemoAllowed = (email: string | null | undefined): boolean => {
  return false;
};

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams.slug;

  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);

  // Active user profile states
  const [userId, setUserId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberTitle, setMemberTitle] = useState("");
  const [memberCompany, setMemberCompany] = useState(""); // college_name
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [joinedDate, setJoinedDate] = useState("Recently");
  const [memberUsername, setMemberUsername] = useState("");

  // Dynamic content feeds
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [peers, setPeers] = useState<Profile[]>([]);
  const [peersLoading, setPeersLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]); // relationship request records

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
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // User Stats
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);

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

  // Slugification helper
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  const isMockLoginBypass = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return (
        urlParams.get("mock_login") === "true" ||
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("supabase.co")
      );
    }
    return true;
  };

  // Guard Auth & Fetch Community Data
  useEffect(() => {
    if (slug) {
      fetchCommunityAndAuth(slug);
    }
  }, [slug]);

  // Retrieve user statistics tallies
  useEffect(() => {
    if (userId && !isMockLoginBypass()) {
      fetchUserStats();
    }
  }, [userId]);

  const fetchCommunityAndAuth = async (collegeSlug: string) => {
    setLoading(true);
    const isMock = isMockLoginBypass();
    let urlEmail = "";
    let mockProfileStr = null;
    let currentUserId = "";
    let currentMemberCompany = "";
    let effectiveEmail = "";

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      urlEmail = urlParams.get("email") || sessionStorage.getItem("mock_user_email") || "";

      if (isMock) {
        // Mock session check
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

        mockProfileStr = localStorage.getItem("mock_user_profile");
        if (mockProfileStr) {
          try {
            const profile = JSON.parse(mockProfileStr);
            currentUserId = "mock-user-id";
            setUserId("mock-user-id");
            setMemberName(profile.full_name || "Student Peer");
            setMemberEmail(urlEmail || "student@campus.edu");
            effectiveEmail = urlEmail || "student@campus.edu";
            setMemberTitle(`${profile.year} / ${profile.branch}`);
            currentMemberCompany = profile.college_name || "IIT Bombay";
            setMemberCompany(currentMemberCompany);
            setBio(profile.bio || "");
            setAvatarUrl(profile.avatar_url || "");
            setMemberUsername(profile.username || "student");
            setSelectedTags(profile.interests || []);
            setJoinedDate("May 2026");
          } catch (e) {
            console.error("Parsing mock profile failed", e);
          }
        }
      } else {
        // Live Auth
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            window.location.href = "/";
            return;
          }

          currentUserId = session.user.id;
          setUserId(session.user.id);
          setMemberEmail(session.user.email || "");
          effectiveEmail = session.user.email || "";

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
          currentMemberCompany = profile.college_name;
          setMemberCompany(currentMemberCompany);
          setBio(profile.bio || "");
          setAvatarUrl(profile.avatar_url || "");
          setMemberUsername(profile.username || "");
          setSelectedTags(profile.interests || []);

          if (profile.created_at) {
            const d = new Date(profile.created_at);
            setJoinedDate(d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
          }
        } catch (authErr) {
          console.error("Live session resolve failed:", authErr);
          window.location.href = "/";
          return;
        }
      }
    }

    // Load or generate community details
    let communityObj: Community | null = null;
    if (isMock) {
      const savedCommunities = localStorage.getItem("mock_communities");
      let communitiesList = [];
      if (savedCommunities) {
        try {
          communitiesList = JSON.parse(savedCommunities);
        } catch (e) {}
      }

      communityObj = communitiesList.find((c: any) => c.slug === collegeSlug) || null;

      if (!communityObj) {
        const readableName = collegeSlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        communityObj = {
          name: readableName,
          slug: collegeSlug,
          description: `The online community where ${readableName} students actually interact.`,
          banner_url: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
        };
      }
    } else {
      try {
        const { data, error } = await supabase
          .from("communities")
          .select("*")
          .eq("slug", collegeSlug)
          .maybeSingle();

        if (error) throw error;
        communityObj = data;

        if (!communityObj) {
          const readableName = collegeSlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const bannerGradients = [
            "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
            "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
            "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
            "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
          ];
          const randomGradient = bannerGradients[Math.floor(Math.random() * bannerGradients.length)];

          const { data: insertedData, error: insertErr } = await supabase
            .from("communities")
            .insert({
              name: readableName,
              slug: collegeSlug,
              description: `The online community where ${readableName} students actually interact.`,
              banner_url: randomGradient,
            })
            .select()
            .single();

          if (!insertErr && insertedData) {
            communityObj = insertedData;
          }
        }
      } catch (err) {
        console.error("Failed to query community details in Supabase:", err);
      }
    }

    setCommunity(communityObj);
    setLoading(false);

    if (communityObj) {
      fetchCommunityPosts(communityObj.name, isMock, currentUserId, effectiveEmail);
      fetchCommunityPeers(communityObj.name, isMock, currentUserId, effectiveEmail);
      fetchConnections(currentUserId, effectiveEmail);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

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

  // Fetch peers in this community
  const fetchCommunityPeers = async (collegeName: string, isMock: boolean, currentUserId: string, currentUserEmail?: string) => {
    setPeersLoading(true);
    const emailToCheck = currentUserEmail || memberEmail;

    if (isMock) {
      setPeers([]);
      setPeersLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, college_name, year, branch")
        .eq("college_name", collegeName)
        .eq("onboarding_completed", true);

      if (error) throw error;
      // Filter out current user from community peers roster
      const activePeers = (data || []).filter((p: any) => {
        return p.user_id !== currentUserId;
      });
      setPeers(activePeers);
    } catch (err) {
      console.error("Failed to fetch community peers:", err);
    } finally {
      setPeersLoading(false);
    }
  };

  // --- FETCH CONNECTIONS ---
  const fetchConnections = async (currentUserId: string, currentUserEmail?: string) => {
    const isMock = isMockLoginBypass();
    const effectiveUserId = currentUserId || userId;
    if (!effectiveUserId) return;

    const emailToCheck = currentUserEmail || memberEmail;

    if (isMock) {
      const stored = localStorage.getItem("mock_connections");
      if (stored) {
        try {
          const list = JSON.parse(stored);
          setConnections(list.filter((c: any) => c.sender_id === effectiveUserId || c.receiver_id === effectiveUserId));
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
        .or(`sender_id.eq.${effectiveUserId},receiver_id.eq.${effectiveUserId}`);
      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error("Failed to fetch Supabase connections:", err);
    }
  };

  // --- SEND CONNECTION REQUEST ---
  const handleSendConnectionRequest = async (receiverId: string) => {
    if (!userId) return;
    const today = new Date().toDateString();
    const rateLimitKey = `techleaders_limit_reqs_${userId}_${today}`;
    const reqsToday = parseInt(localStorage.getItem(rateLimitKey) || "0", 10);
    if (reqsToday >= 5) {
      alert("⚠️ Daily Spam Protection: You can send at most 5 connection requests per day to prevent campus spamming.");
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

      fetchConnections(userId);
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

      fetchConnections(userId);
      alert("🎉 Connection request dispatched!");
    } catch (err: any) {
      console.error("Failed to send connection request:", err);
      alert(err.message || "Failed to dispatch request. They might already have a pending connection with you.");
    }
  };

  // --- ACCEPT CONNECTION REQUEST ---
  const handleAcceptConnectionRequest = async (senderId: string, connectionId: string) => {
    if (!userId) return;
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

      await fetchConnections(userId);
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
        console.warn("Conversation pair record might not exist yet:", convoErr);
      }

      await fetchConnections(userId);
      alert("🤝 Connection request accepted! Unlimited chatting is unlocked.");
    } catch (err: any) {
      console.error("Failed to accept connection request:", err);
    }
  };

  // Fetch posts filtered to this community
  const fetchCommunityPosts = async (collegeName: string, isMock: boolean, currentUserId: string, currentUserEmail?: string) => {
    setPostsLoading(true);
    const emailToCheck = currentUserEmail || memberEmail;

    if (isMock) {
      const storedPosts = localStorage.getItem(`mock_posts_${collegeName.replace(/\s+/g, "_")}`);
      let userCustomPosts: Post[] = [];
      if (storedPosts) {
        try {
          userCustomPosts = JSON.parse(storedPosts) as Post[];
        } catch (e) {
          userCustomPosts = [];
        }
      }

      // Generate realistic seed posts
      const seeds = getSeedPosts(memberCompany || "IIT Bombay", emailToCheck);
      
      // Filter seed posts by this community slug
      const communitySeeds = seeds.filter(seed => {
        const postSlug = getPostCommunitySlug(seed);
        return postSlug === slug;
      });

      // Combine user custom posts and seed posts
      const combined = [...userCustomPosts];
      communitySeeds.forEach(seed => {
        if (!combined.some(p => p.id === seed.id)) {
          combined.push(seed);
        }
      });

      // Map upvote scores and active user votes
      const postsWithVotes = combined.map(post => {
        const voteKey = `mock_vote_${post.id}_${currentUserId || "mock-user-id"}`;
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

      // Filter college or interest-based posts
      const activePosts = (postsData || []).filter((post: any) => {
        const postSlug = getPostCommunitySlug(post);
        // Either matches the college name directly or matches the community slug
        const matchesCommunity = postSlug === slug || post.profiles?.college_name === collegeName;
        
        if (!isDemoAllowed(emailToCheck)) {
          const isDemoPost = post.id.startsWith("seed-") || 
                             post.user_id.startsWith("mock-") || 
                             post.user_id.startsWith("seed-") ||
                             post.user_id.startsWith("elite-") ||
                             ["seed-aadil", "seed-priya", "seed-rahul", "seed-jordan", "seed-aisha", "seed-vikram", "seed-ananya"].includes(post.user_id);
          if (isDemoPost && post.user_id !== currentUserId) return false;
        }
        return matchesCommunity;
      });

      // Include seed posts for standard user if they match the community slug
      const seeds = getSeedPosts(memberCompany || "IIT Bombay", emailToCheck);
      const communitySeeds = seeds.filter(seed => getPostCommunitySlug(seed) === slug);

      const combined: Post[] = [...activePosts];
      communitySeeds.forEach(seed => {
        if (!combined.some(p => p.id === seed.id)) {
          combined.push(seed);
        }
      });

      const postsDetails = await Promise.all(
        combined.map(async (post: any) => {
          // Replies count
          const { count: commentCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Votes calculation
          const { data: votesData } = await supabase
            .from("votes")
            .select("vote_value, user_id")
            .eq("post_id", post.id);

          let score = 0;
          let userVoteVal = 0;
          if (votesData) {
            votesData.forEach((v: any) => {
              score += v.vote_value;
              if (v.user_id === currentUserId) {
                userVoteVal = v.vote_value;
              }
            });
          }

          return {
            ...post,
            replies_count: commentCount || 0,
            votes_score: score,
            user_vote_value: userVoteVal,
          };
        })
      );

      // Sort by date
      postsDetails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(postsDetails);
    } catch (err: any) {
      console.error("Supabase community post query failed:", err?.message || err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Canvas Image Compression Handler
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageCompressing(true);

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
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setUploadedImageBase64(compressedBase64);
        setImageCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upvote/Downvote Mechanic with Composite Prevention
  const handleVote = async (postId: string, direction: number) => {
    if (!userId) return;

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const currentVote = targetPost.user_vote_value || 0;
    let nextVote = 0;
    if (currentVote === direction) {
      nextVote = 0; // Clicked again, retract vote
    } else {
      nextVote = direction; // Apply up/down
    }

    const changeScore = nextVote - currentVote;

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((p) =>
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

      // Sync into mock posts catalog
      if (community) {
        const stored = localStorage.getItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Post[];
            const updated = parsed.map((p) =>
              p.id === postId ? { ...p, votes_score: (p.votes_score || 0) + changeScore } : p
            );
            localStorage.setItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`, JSON.stringify(updated));
          } catch (e) {}
        }
      }
      return;
    }

    try {
      if (nextVote === 0) {
        await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", userId);
      } else {
        const { error } = await supabase.from("votes").upsert(
          {
            post_id: postId,
            user_id: userId,
            vote_value: nextVote,
          },
          { onConflict: "post_id, user_id" }
        );
        if (error) throw error;
      }
    } catch (err) {
      console.error("Database vote failed, reverting:", err);
      // Revert Optimistic State
      setPosts((prev) =>
        prev.map((p) =>
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

  // Expand / Toggle nested comment thread
  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
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
        } catch (e) {
          setCommentsList([]);
        }
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
          user_id,
          body,
          created_at,
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
      console.error("Comments fetch failed:", err);
      setCommentError("Could not fetch replies.");
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit new comment thread
  const handleSubmitComment = async (postId: string) => {
    if (!newCommentBody.trim()) return;

    setCommentingLoader(true);
    setCommentError("");

    const isMock = isMockLoginBypass();
    const mockCommentItem: Comment = {
      id: `mock-comm-${Date.now()}`,
      post_id: postId,
      user_id: userId,
      body: newCommentBody,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: memberName || "Student Peer",
        username: memberUsername || "student",
        avatar_url: avatarUrl || "",
        year: memberTitle.split(" / ")[0] || "1st Year",
        branch: memberTitle.split(" / ")[1] || "CSE",
      },
    };

    if (isMock) {
      const storedComments = localStorage.getItem(`mock_comments_${postId}`);
      let parsed: Comment[] = [];
      if (storedComments) {
        try {
          parsed = JSON.parse(storedComments);
        } catch (e) {}
      }
      parsed.push(mockCommentItem);
      localStorage.setItem(`mock_comments_${postId}`, JSON.stringify(parsed));

      setCommentsList(parsed);
      setNewCommentBody("");

      // Increment replies tally locally
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p))
      );

      // Increment in mock posts catalog
      if (community) {
        const stored = localStorage.getItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`);
        if (stored) {
          try {
            const parsedPosts = JSON.parse(stored) as Post[];
            const updated = parsedPosts.map((p) =>
              p.id === postId ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p
            );
            localStorage.setItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`, JSON.stringify(updated));
          } catch (e) {}
        }
      }

      setCommentingLoader(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: userId,
          body: newCommentBody.trim(),
        })
        .select(`
          id,
          post_id,
          user_id,
          body,
          created_at,
          profiles:user_id (
            full_name,
            username,
            avatar_url,
            year,
            branch
          )
        `)
        .single();

      if (error) throw error;

      setCommentsList((prev) => [...prev, data]);
      setNewCommentBody("");

      // Increment local count
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p))
      );
      setTotalCommentsCount((c) => c + 1);
    } catch (err: any) {
      console.error("Submit comment failed:", err);
      setCommentError(err.message || "Could not publish reply.");
    } finally {
      setCommentingLoader(false);
    }
  };

  // Submit new post directly to this college community
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeBody.trim()) {
      setComposeError("Title and body fields are required.");
      return;
    }

    if (!community) return;

    setComposeError("");
    setPostingLoader(true);

    const isMock = isMockLoginBypass();
    const newPostId = `mock-post-${Date.now()}`;
    const newPostItem: Post = {
      id: newPostId,
      title: composeTitle.trim(),
      body: composeBody.trim(),
      category: composeCategory,
      image_url: composerTab === "image" ? uploadedImageBase64 : null,
      created_at: new Date().toISOString(),
      user_id: userId,
      profiles: {
        full_name: memberName || "Student Peer",
        username: memberUsername || "student",
        avatar_url: avatarUrl || "",
        college_name: community.name,
        year: memberTitle.split(" / ")[0] || "1st Year",
        branch: memberTitle.split(" / ")[1] || "CSE",
      },
      replies_count: 0,
      votes_score: 0,
      user_vote_value: 0,
    };

    if (isMock) {
      const stored = localStorage.getItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`);
      let parsed: Post[] = [];
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (e) {}
      }
      parsed.unshift(newPostItem);
      localStorage.setItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`, JSON.stringify(parsed));

      setPosts((prev) => [newPostItem, ...prev]);
      
      // Cleanup States
      setComposeTitle("");
      setComposeBody("");
      setUploadedImageBase64(null);
      setIsComposing(false);
      setPostingLoader(false);
      return;
    }

    try {
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        college_name: community.name,
        title: composeTitle.trim(),
        body: composeBody.trim(),
        category: composeCategory,
        image_url: composerTab === "image" ? uploadedImageBase64 : null,
      });

      if (error) throw error;

      // Refresh post feed
      fetchCommunityPosts(community.name, false, userId);
      setTotalPostsCount((c) => c + 1);

      // Reset
      setComposeTitle("");
      setComposeBody("");
      setUploadedImageBase64(null);
      setIsComposing(false);
    } catch (err: any) {
      console.error("Create post failed:", err);
      setComposeError(err.message || "Failed to publish post.");
    } finally {
      setPostingLoader(false);
    }
  };

  // Post Editing Actions
  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditCategory(post.category);
    setEditError("");
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    if (!editTitle.trim() || !editBody.trim()) {
      setEditError("Title and post content are required.");
      return;
    }

    setEditLoader(true);
    setEditError("");

    const isMock = isMockLoginBypass();
    if (isMock) {
      if (community) {
        const stored = localStorage.getItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Post[];
            const updated = parsed.map((p) =>
              p.id === editingPost.id
                ? { ...p, title: editTitle.trim(), body: editBody.trim(), category: editCategory }
                : p
            );
            localStorage.setItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`, JSON.stringify(updated));
            
            // Sync locally
            setPosts((prev) =>
              prev.map((p) =>
                p.id === editingPost.id
                  ? { ...p, title: editTitle.trim(), body: editBody.trim(), category: editCategory }
                  : p
              )
            );
          } catch (e) {}
        }
      }
      setEditingPost(null);
      setEditLoader(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title: editTitle.trim(),
          body: editBody.trim(),
          category: editCategory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id)
        .eq("user_id", userId);

      if (error) throw error;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, title: editTitle.trim(), body: editBody.trim(), category: editCategory }
            : p
        )
      );
      setEditingPost(null);
    } catch (err: any) {
      console.error("Failed to edit post:", err);
      setEditError(err.message || "Failed to save edits.");
    } finally {
      setEditLoader(false);
    }
  };

  // Post Deletion Actions
  const handleDeletePostConfirm = async () => {
    if (!deleteConfirmPostId) return;

    const isMock = isMockLoginBypass();
    if (isMock) {
      if (community) {
        const stored = localStorage.getItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Post[];
            const filtered = parsed.filter((p) => p.id !== deleteConfirmPostId);
            localStorage.setItem(`mock_posts_${community.name.replace(/\s+/g, "_")}`, JSON.stringify(filtered));
            
            setPosts((prev) => prev.filter((p) => p.id !== deleteConfirmPostId));
          } catch (e) {}
        }
      }
      setDeleteConfirmPostId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", deleteConfirmPostId)
        .eq("user_id", userId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== deleteConfirmPostId));
      setTotalPostsCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Delete post failed:", err);
    } finally {
      setDeleteConfirmPostId(null);
    }
  };

  const getMockAuthQueryParam = () => {
    return isMockLoginBypass() ? `?mock_login=true&email=${encodeURIComponent(memberEmail)}` : "";
  };

  // Rendering Helper for Initials Avatars
  const renderInitialsAvatar = (name: string, size = "w-10 h-10") => {
    const initials = name
      ? name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
      : "CC";
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-brand/60 to-blue-600/40 flex items-center justify-center border border-white/10 text-white font-heading font-black text-xs select-none`}
      >
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-brand" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs uppercase tracking-widest font-bold text-slate-500 animate-pulse">
            Loading Campus Community...
          </span>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-deep text-slate-300 p-6 text-center">
        <h2 className="text-2xl font-heading font-extrabold text-white mb-2">Community Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          The requested college circle page could not be located in this campus network network.
        </p>
        <Link
          href={`/dashboard${getMockAuthQueryParam()}`}
          className="px-6 py-2.5 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-hover transition-all"
        >
          Return to Hub Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-navy-deep text-slate-100 font-body bg-grid-pattern pb-12">
      {/* Background Radial Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-radial-glow pointer-events-none z-0" />

      {/* Main Top Header Navigation Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.04] bg-navy-deep/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard${getMockAuthQueryParam()}`} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <LogoIcon className="text-blue-400" size={13} />
            </div>
            <span className="text-sm font-heading font-black tracking-tight text-white uppercase group-hover:text-blue-400 transition-colors">
              CircleNet
            </span>
          </Link>
          <span className="text-slate-700 text-sm select-none">/</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-blue-400 font-heading bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none">
              r/{community.slug}
            </span>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href={`/dashboard${getMockAuthQueryParam()}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </header>

      {/* Premium College Banner Cover Jumbotron */}
      <div
        className="w-full h-36 relative select-none"
        style={{ background: community.banner_url || "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-black/30 pointer-events-none" />
        
        {/* Glowing badge */}
        <div className="absolute bottom-4 left-6 md:left-12 flex items-end gap-4 z-10">
          {renderInitialsAvatar(community.name, "w-16 h-16 md:w-20 md:h-20 text-lg border-2 border-white/20 shadow-2xl")}
          <div className="mb-1 text-left">
            <h1 className="text-lg md:text-2xl font-black font-heading text-white flex items-center gap-2 drop-shadow-md">
              {community.name} Community
              <VerifiedIcon size={18} className="text-blue-400 shadow-md" />
            </h1>
            <p className="text-[10px] md:text-xs text-slate-300 drop-shadow-sm font-semibold tracking-wide uppercase">
              Private Campus Sub-feed
            </p>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <main className="max-w-[1240px] w-full mx-auto px-4 md:px-8 mt-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: NAVIGATION / HUB NAVIGATION */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 text-left">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
              Navigation Hub
            </h4>
            
            <Link
              href={`/dashboard${getMockAuthQueryParam()}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="w-5 h-5 rounded bg-brand/10 border border-brand/20 flex items-center justify-center">
                <LogoIcon className="text-blue-400" size={8} />
              </div>
              Home Hub Feed
            </Link>

            <div className="h-[1px] bg-white/[0.04] my-1" />

            <div className="px-3 py-2 bg-brand/10 border border-brand/20 rounded-xl flex flex-col gap-1 text-left">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Current Community
              </span>
              <span className="text-xs font-extrabold text-white truncate">{community.name}</span>
            </div>

            <div className="h-[1px] bg-white/[0.04] my-1" />

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#040815]/60 border border-white/[0.04] rounded-xl p-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase">My Posts</p>
                <p className="text-base font-black text-white mt-0.5">{totalPostsCount}</p>
              </div>
              <div className="bg-[#040815]/60 border border-white/[0.04] rounded-xl p-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase">My Karma</p>
                <p className="text-base font-black text-white mt-0.5">{totalCommentsCount + totalPostsCount * 2}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: FEED & POST COMPOSER */}
        <section className="lg:col-span-6 flex flex-col gap-5">
          
          {/* Post composer trigger area */}
          {!isComposing ? (
            <div 
              onClick={() => setIsComposing(true)}
              className="glass-panel rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-brand/40 transition-colors group select-none text-left"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="User DP" className="w-9 h-9 rounded-full object-cover border border-white/10" />
              ) : (
                renderInitialsAvatar(memberName || "Student", "w-9 h-9")
              )}
              <div className="flex-1 bg-[#040815]/60 border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-slate-500 font-semibold group-hover:text-slate-400 group-hover:border-white/[0.08] transition-colors">
                Share a textbook, ask a senior, or upload a photo to {community.name}...
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 border-brand/20 bg-card-glow relative overflow-hidden"
            >
              {/* Card top border line */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
              
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon size={14} className="text-blue-400 animate-pulse-slow" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 font-heading">
                    Compose Sub-Community Post
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Tab selector */}
              <div className="flex bg-[#040815]/60 border border-white/[0.05] rounded-lg p-0.5 mb-4">
                <button
                  type="button"
                  onClick={() => setComposerTab("text")}
                  className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                    composerTab === "text"
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ✍️ Text discussion
                </button>
                <button
                  type="button"
                  onClick={() => setComposerTab("image")}
                  className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                    composerTab === "image"
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🖼️ Image / Attachment
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4 text-left">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Post Title
                  </label>
                  <input
                    type="text"
                    required
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="E.g., Anyone having past years question papers for DBMS?"
                    className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all"
                  />
                </div>

                {/* Subcategory selection & post info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Category Tag
                    </label>
                    <select
                      value={composeCategory}
                      onChange={(e) => setComposeCategory(e.target.value)}
                      className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand"
                    >
                      <option value="#general">#general</option>
                      <option value="#academics">#academics</option>
                      <option value="#hackathons">#hackathons</option>
                      <option value="#placements">#placements</option>
                      <option value="#events">#events</option>
                      <option value="#marketplace">#marketplace</option>
                    </select>
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 select-none py-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Posting to {community.name}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Content Body
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Provide detailed information, context, links, etc. Keep details concise and clear..."
                    className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all resize-none"
                  />
                </div>

                {/* Image upload tab contents with Canvas compression */}
                {composerTab === "image" && (
                  <div className="space-y-2 border-t border-white/[0.04] pt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Attach Image (Client-side compression)
                    </label>

                    {uploadedImageBase64 ? (
                      <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-[180px] w-full flex items-center justify-center bg-black/40">
                        <img src={uploadedImageBase64} alt="Attachment" className="max-h-[180px] object-contain" />
                        <button
                          type="button"
                          onClick={() => setUploadedImageBase64(null)}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black text-red-400 p-1.5 rounded-full text-[10px] font-bold transition-all focus:outline-none"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="border border-dashed border-white/[0.06] hover:border-brand/40 bg-[#040815]/40 hover:bg-[#070e24]/40 rounded-xl p-6 cursor-pointer text-center transition-colors duration-300"
                      >
                        {imageCompressing ? (
                          <div className="flex flex-col items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-[10px] text-slate-400 font-semibold">Scaling & Compressing...</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-[11px] font-bold text-slate-300">Click to upload image</span>
                            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Auto-scales to 400px JPEG to save storage</p>
                          </>
                        )}
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
                )}

                {composeError && (
                  <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-left">
                    <p className="text-[10px] sm:text-xs font-semibold text-red-400">{composeError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={postingLoader || imageCompressing}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-brand py-3 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(24,95,165,0.2)] transition-all hover:bg-brand-hover hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postingLoader ? "Publishing..." : `Publish to r/${community.slug}`}
                </button>
              </form>
            </motion.div>
          )}

          {/* Posts Feed Card Header */}
          <div className="flex items-center justify-between pb-1 select-none text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Community discussions
            </h3>
            <span className="text-[10px] font-bold text-slate-600 bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded-full">
              {posts.length} Posts
            </span>
          </div>

          {/* POSTS LISTING */}
          {postsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-brand mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Loading Community Feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel rounded-3xl p-10 text-center flex flex-col items-center bg-card-glow min-h-[300px] justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center mb-4 text-brand animate-pulse-slow">
                <SparklesIcon size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">No Posts Yet</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Be the first verified batchmate to start a discussion or share news here!
              </p>
              <button
                onClick={() => setIsComposing(true)}
                className="mt-6 px-5 py-2.5 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-hover shadow-[0_0_12px_rgba(24,95,165,0.2)] transition-all scale-[1.01]"
              >
                Create First Post
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const author = post.profiles || {
                  full_name: "Student Peer",
                  username: "student",
                  avatar_url: "",
                  college_name: community.name,
                  year: "Senior",
                  branch: "Engineering",
                };
                const hasVotedUp = post.user_vote_value === 1;
                const hasVotedDown = post.user_vote_value === -1;
                const isAuthor = post.user_id === userId;

                return (
                  <motion.div
                    key={post.id}
                    layout="position"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-2xl overflow-hidden hover:border-white/[0.08] transition-colors bg-card-glow flex flex-col"
                  >
                    <div className="flex">
                      
                      {/* Left Reddit Upvote Strip */}
                      <div className="flex flex-col items-center justify-start py-4 px-2 sm:px-3 bg-white/[0.01] border-r border-white/[0.03] select-none min-w-[36px] sm:min-w-[48px]">
                        <button
                          type="button"
                          onClick={() => handleVote(post.id, 1)}
                          title="Upvote"
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
                          title="Downvote"
                          className={`p-1 rounded transition-all hover:bg-white/[0.05] focus:outline-none ${
                            hasVotedDown ? "text-red-400 scale-110 drop-shadow-[0_0_6px_rgba(248,113,113,0.3)]" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M20 10h-6V2h-4v8H4l8 10 8-10z" />
                          </svg>
                        </button>
                      </div>

                      {/* Right Main Post content */}
                      <div className="flex-1 p-4 md:p-5 flex flex-col text-left">
                        {/* Meta header info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.03] mb-3">
                          <div className="flex items-center gap-2">
                            {author.avatar_url ? (
                              <img
                                src={author.avatar_url}
                                alt="Author profile"
                                className="w-6 h-6 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              renderInitialsAvatar(author.full_name, "w-6 h-6")
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 text-left">
                              <span className="text-[10px] font-extrabold text-white flex items-center gap-0.5">
                                {author.full_name}
                                <VerifiedIcon size={12} className="text-blue-400" />
                              </span>
                              <span className="hidden sm:inline text-slate-700">•</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-semibold text-slate-400">
                                  @{author.username} ({author.year} / {author.branch})
                                </span>
                                {!isAuthor && (
                                  <Link
                                    href={
                                      isMockLoginBypass()
                                        ? `/dashboard?mock_login=true&email=${encodeURIComponent(memberEmail)}&tab=chats&chat_with=${post.user_id}`
                                        : `/dashboard?tab=chats&chat_with=${post.user_id}`
                                    }
                                    className="ml-1 p-0.5 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 flex items-center justify-center cursor-pointer"
                                    title="Send private message"
                                  >
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                    </svg>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none">
                            {post.category}
                          </span>
                        </div>

                        {/* Title & Body */}
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug mb-2">
                          {post.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed whitespace-pre-wrap">
                          {post.body}
                        </p>

                        {/* Image attachment if exists */}
                        {post.image_url && (
                          <div className="mt-3.5 rounded-xl border border-white/[0.05] overflow-hidden bg-black/20 max-h-[300px] w-full flex items-center justify-center">
                            <img
                              src={post.image_url}
                              alt="Post attachments"
                              className="max-h-[300px] object-contain w-full"
                            />
                          </div>
                        )}

                        {/* Interaction bar footer */}
                        <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/[0.03] select-none">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleComments(post.id)}
                              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                            >
                              <ChatBubbleIcon size={13} className="text-slate-500" />
                              <span>{post.replies_count ?? 0} Replies</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCopiedPostId(post.id);
                                navigator.clipboard.writeText(`${window.location.origin}/community/${slug}?mock_login=true&email=${encodeURIComponent(memberEmail)}`);
                                setTimeout(() => setCopiedPostId(null), 2000);
                              }}
                              className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold transition-all duration-200 focus:outline-none cursor-pointer ${
                                copiedPostId === post.id ? "text-emerald-400 font-extrabold" : "text-slate-400 hover:text-white"
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
                              </svg>
                              <span>{copiedPostId === post.id ? "Copied ✓" : "Share"}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAuthor && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(post)}
                                  className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors focus:outline-none"
                                >
                                  Edit
                                </button>
                                <span className="text-slate-700">|</span>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmPostId(post.id)}
                                  className="text-[10px] sm:text-xs font-bold text-red-500 hover:text-red-400 transition-colors focus:outline-none"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            <span className="text-[9px] font-semibold text-slate-500">
                              {new Date(post.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Inline Comment thread slide-down drawer panel */}
                    <AnimatePresence>
                      {expandedPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-white/[0.04] bg-[#030612]/60 overflow-hidden"
                        >
                          <div className="p-4 md:p-5 space-y-4">
                            <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-left">
                              Replies & Discussion
                            </h4>

                            {commentsLoading ? (
                              <div className="py-6 flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Loading replies...</span>
                              </div>
                            ) : commentsList.length === 0 ? (
                              <p className="text-[10px] text-slate-500 text-left py-2 font-semibold">
                                No comments posted yet. Start the thread conversation!
                              </p>
                            ) : (
                              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                                {commentsList.map((comm) => {
                                  const cAuth = comm.profiles || {
                                    full_name: "Student Peer",
                                    username: "student",
                                    avatar_url: "",
                                    year: "Student",
                                    branch: "Campus",
                                  };
                                  return (
                                    <div key={comm.id} className="flex gap-2.5 text-left border-l-2 border-white/[0.03] pl-3.5 py-0.5">
                                      {cAuth.avatar_url ? (
                                        <img
                                          src={cAuth.avatar_url}
                                          alt="Comment Author Avatar"
                                          className="w-5 h-5 rounded-full object-cover border border-white/10"
                                        />
                                      ) : (
                                        renderInitialsAvatar(cAuth.full_name, "w-5 h-5")
                                      )}
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold text-white">
                                            {cAuth.full_name}
                                          </span>
                                          <span className="text-[8px] text-slate-500 font-semibold">
                                            @{cAuth.username} ({cAuth.year})
                                          </span>
                                        </div>
                                        <p className="text-[10px] sm:text-[11px] text-slate-300 font-normal leading-relaxed">
                                          {comm.body}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Comment composer box */}
                            <div className="space-y-2 border-t border-white/[0.04] pt-4 text-left">
                              <textarea
                                rows={2}
                                value={newCommentBody}
                                onChange={(e) => setNewCommentBody(e.target.value)}
                                placeholder="Type a verified helpful response..."
                                className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition-all resize-none"
                              />

                              {commentError && (
                                <div className="p-2 bg-red-950/20 border border-red-500/20 rounded-lg text-left">
                                  <p className="text-[9px] font-semibold text-red-400">{commentError}</p>
                                </div>
                              )}

                              <div className="flex justify-end select-none">
                                <button
                                  type="button"
                                  disabled={commentingLoader || !newCommentBody.trim()}
                                  onClick={() => handleSubmitComment(post.id)}
                                  className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-[10px] font-bold text-white shadow transition-all disabled:opacity-50"
                                >
                                  {commentingLoader ? "Replying..." : "Publish Reply"}
                                </button>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: DIRECTORY & ROSTER & GUIDELINES */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Community Info Card */}
          <div className="glass-panel rounded-2xl p-4 text-left">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 select-none">
              Community Info
            </h4>
            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-extrabold text-white">r/{community.slug}</h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {community.description}
                </p>
              </div>

              <div className="h-[1px] bg-white/[0.04]" />

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-medium">Campus Peers</span>
                <span className="text-white font-bold bg-[#040815]/60 border border-white/[0.04] px-2 py-0.5 rounded-md">
                  {peers.length + 1} Enrolled
                </span>
              </div>

              <div className="h-[1px] bg-white/[0.04]" />

              {(() => {
                const isJoined = joinedCommunities[slug] === true;
                return (
                  <button
                    onClick={() => {
                      setJoinedCommunities(prev => ({
                        ...prev,
                        [slug]: !isJoined
                      }));
                    }}
                    className={`w-full text-center text-xs font-extrabold py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      isJoined
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/15"
                    }`}
                  >
                    {isJoined ? "Leave Community" : "Join Community"}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Peers list matching this specific college */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 text-left">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
              Verified Peers
            </h4>

            {peersLoading ? (
              <div className="py-6 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : peers.length === 0 ? (
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  You are currently the first verified user in {community.name}! Invite batchmates to join the feed.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {peers.map((peer, idx) => {
                  const conn = connections.find(
                    (c: any) =>
                      (c.sender_id === userId && c.receiver_id === peer.user_id) ||
                      (c.sender_id === peer.user_id && c.receiver_id === userId)
                  );

                  return (
                    <div key={peer.user_id || idx} className="flex items-center justify-between border-b border-white/[0.02] pb-2 last:border-0 last:pb-0 group">
                      <div className="flex items-center gap-2 truncate">
                        {peer.avatar_url ? (
                          <img
                            src={peer.avatar_url}
                            alt={peer.full_name}
                            className="w-7 h-7 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          renderInitialsAvatar(peer.full_name, "w-7 h-7 text-[10px]")
                        )}
                        <div className="flex flex-col truncate">
                          <span className="text-[10px] font-bold text-white truncate flex items-center gap-0.5">
                            {peer.full_name}
                            <VerifiedIcon size={10} className="text-blue-400" />
                          </span>
                          <span className="text-[8px] text-slate-500 font-medium truncate">
                            {peer.year} • {peer.branch}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Relationship Badge/Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 select-none">
                        {!conn ? (
                          <>
                            <button
                              onClick={() => handleSendConnectionRequest(peer.user_id || "")}
                              className="px-2 py-0.5 rounded bg-brand/10 hover:bg-brand text-[9px] font-extrabold text-blue-400 hover:text-white transition-all border border-brand/20 cursor-pointer"
                            >
                              Connect
                            </button>
                            <Link
                              href={
                                isMockLoginBypass()
                                  ? `/dashboard?mock_login=true&email=${encodeURIComponent(memberEmail)}&tab=chats&chat_with=${peer.user_id}`
                                  : `/dashboard?tab=chats&chat_with=${peer.user_id}`
                              }
                              className="p-1 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 cursor-pointer flex items-center justify-center"
                              title="Send direct message"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                              </svg>
                            </Link>
                          </>
                        ) : conn.status === "pending" ? (
                          <>
                            {conn.sender_id === userId ? (
                              <span className="px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] text-[9px] font-extrabold text-slate-500 cursor-not-allowed select-none">
                                Pending
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAcceptConnectionRequest(peer.user_id || "", conn.id)}
                                className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-[9px] font-extrabold text-white transition-all cursor-pointer"
                              >
                                Accept
                              </button>
                            )}
                            <Link
                              href={
                                isMockLoginBypass()
                                  ? `/dashboard?mock_login=true&email=${encodeURIComponent(memberEmail)}&tab=chats&chat_with=${peer.user_id}`
                                  : `/dashboard?tab=chats&chat_with=${peer.user_id}`
                              }
                              className="p-1 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 cursor-pointer flex items-center justify-center"
                              title="Send direct message"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                              </svg>
                            </Link>
                          </>
                        ) : conn.status === "accepted" ? (
                          <Link
                            href={
                              isMockLoginBypass()
                                ? `/dashboard?mock_login=true&email=${encodeURIComponent(memberEmail)}&tab=chats&chat_with=${peer.user_id}`
                                : `/dashboard?tab=chats&chat_with=${peer.user_id}`
                            }
                            className="p-1 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 cursor-pointer flex items-center justify-center"
                            title="Send direct message"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSendConnectionRequest(peer.user_id || "")}
                              className="px-2 py-0.5 rounded bg-brand/10 hover:bg-brand text-[9px] font-extrabold text-blue-400 hover:text-white transition-all border border-brand/20 cursor-pointer"
                            >
                              Connect
                            </button>
                            <Link
                              href={
                                isMockLoginBypass()
                                  ? `/dashboard?mock_login=true&email=${encodeURIComponent(memberEmail)}&tab=chats&chat_with=${peer.user_id}`
                                  : `/dashboard?tab=chats&chat_with=${peer.user_id}`
                              }
                              className="p-1 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 cursor-pointer flex items-center justify-center"
                              title="Send direct message"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 10.457 10.457 0 01-2.184-2.84C1.805 14.887 1.5 13.504 1.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                              </svg>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Posting Guidelines */}
          <div className="glass-panel rounded-2xl p-4 text-left select-none">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Posting Guidelines
            </h4>
            <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-semibold">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">1.</span>
                Be polite, helpful, and support junior students.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">2.</span>
                Only share verified information, academic materials, or real events.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold">3.</span>
                Do not spam marketplace, ads, or mock placeholders.
              </li>
            </ul>
          </div>

        </section>

      </main>

      {/* EDIT MODAL FOR POSTS */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg glass-panel p-6 rounded-2xl shadow-2xl relative"
          >
            <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider mb-4 border-b border-white/[0.04] pb-2 text-left">
              🔧 Edit My Post
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Post Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="#general">#general</option>
                    <option value="#academics">#academics</option>
                    <option value="#hackathons">#hackathons</option>
                    <option value="#placements">#placements</option>
                    <option value="#events">#events</option>
                    <option value="#marketplace">#marketplace</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Content Body</label>
                <textarea
                  rows={5}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-[#040815]/60 border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white resize-none"
                />
              </div>

              {editError && (
                <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl">
                  <p className="text-[10px] text-red-400 font-semibold">{editError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePost}
                disabled={editLoader}
                className="px-5 py-2 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-hover shadow disabled:opacity-50"
              >
                {editLoader ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm glass-panel p-6 rounded-2xl shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">Delete Post Permanently?</h3>
            <p className="text-[11px] text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              This action cannot be undone. It will remove the post and all its replies from the database.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmPostId(null)}
                className="px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePostConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
