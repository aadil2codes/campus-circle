"use client";

import React from "react";
import { AiModelsList, AiModel } from "./ui/ai-models-preview";

export default function WhyJoin() {
  const studentMotiveModels: AiModel[] = [
    {
      id: "dtu-notes",
      name: "Showcase Your Work",
      provider: "Delhi Technological University (DTU)",
      family: "3rd Year IT • Priya Sharma",
      version: "9.4 GPA",
      description: "Share portfolios, designs, projects, achievements, and ideas while receiving feedback from a community of verified students.",
      contextWindowTokens: 2026,
      inputPricePer1KTokensUSD: 100, // Represents % time saved
      outputPricePer1KTokensUSD: 1.5, // Represents thousands of resources shared
      supports: { streaming: true, vision: true },
      tags: ["notes", "academics", "dtu"],
      meta: { 
        "Student Contributor": "Priya Sharma", 
        "Academic Year": "3rd Year", 
        "Shared Resources": "45 Documents",
        "Time Saved Weekly": "6.5 Hours" 
      },
    },
    {
      id: "nit-placement",
      name: "Build Projects Together",
      provider: "NIT Trichy",
      family: "Final Year ECE • Aadil Hashmi",
      version: "Google SWE",
      description: "Find developers, designers, researchers, and creators interested in collaborating on projects, startups, open source, and technical events",
      contextWindowTokens: 2026,
      inputPricePer1KTokensUSD: 98, // Represents placement rate success
      outputPricePer1KTokensUSD: 0.25, // Represents peer connections
      supports: { streaming: true, functionCalling: true },
      tags: ["placements", "referrals", "career"],
      meta: { 
        "Senior Mentor": "Aadil Hashmi", 
        "Current Offer": "Software Engineer @ Google", 
        "Mock Interviews Held": 12,
        "Referrals Secured": 4 
      },
    },
    {
      id: "bits-hackathon",
      name: "Find Hackathon Teammates",
      provider: "BITS Pilani",
      // family: "2nd Year CS • Rohit Kulkarni",
      // version: "SIH Winner",
      description: "Connect with students from different colleges, discover builders with complementary skills, and form teams for hackathons, competitions, and startup ideas.",
      contextWindowTokens: 2026,
      inputPricePer1KTokensUSD: 100, // Represents verified students rate
      outputPricePer1KTokensUSD: 0.045, // Represents projects launched
      supports: { streaming: true, toolUse: true },
      tags: ["hackathons", "projects", "teams"],
      meta: { 
        "Team Captain": "Rohit Kulkarni", 
        "Event Title": "Smart India Hackathon (SIH)", 
        "Placement Rank": "1st Place Winner",
        "Stack Utilized": "Next.js & Supabase" 
      },
    },
    {
      id: "iitb-mentorship",
      name: "Connect With Seniors",
      provider: "IIT Bombay",
      family: "IITB Alumna • Ananya Iyer",
      version: "Google SWE",
      description: "Get guidance from seniors and alumni on academics, internships, projects, placements, and college life without relying on scattered group chats.",
      contextWindowTokens: 2026,
      inputPricePer1KTokensUSD: 100, // Represents safety / privacy rate
      outputPricePer1KTokensUSD: 0.12, // Represents active juniors
      supports: { streaming: true, jsonMode: true },
      tags: ["mentorship", "alumni", "career"],
      meta: { 
        "Alumna Host": "Ananya Iyer", 
        "Role": "SWE @ Google, Bengaluru", 
        "Active Mentorships": "120+ Students",
        "Privacy Level": "100% Encrypted" 
      },
    },
    {
      id: "ucl-design",
      name: "Placement Preparation",
      provider: "UCL London",
      family: "Placement Preparation",
      version: "Figma Guru",
      description: "Learn from placement experiences, resume reviews, interview discussions, internship opportunities, and career-focused communities.",
      contextWindowTokens: 2026,
      inputPricePer1KTokensUSD: 92,
      outputPricePer1KTokensUSD: 0.08,
      supports: { streaming: true, vision: true },
      tags: ["ui-ux", "figma", "portfolio"],
      meta: { 
        "Lead Designer": "Aisha Khan", 
        "Course Focus": "Interaction Design", 
        "Figma Kits Shared": "15 Systems",
        "Feedback Turnaround": "< 2 Hours" 
      },
    },
    {
      id: "stanford-research",
      name: "Access Academic Resources",
      provider: "Stanford University",
      family: "3rd Year CS • Jordan Chen",
      version: "AI Specialist",
      description: "Discover notes, previous year papers, lab manuals, study guides, and semester resources shared by students across campuses.",
      contextWindowTokens: 2026,
      inputPricePer1KTokensUSD: 99,
      outputPricePer1KTokensUSD: 0.45,
      supports: { streaming: true, toolUse: true },
      tags: ["deep-learning", "research", "ai"],
      meta: { 
        "Research Scholar": "Jordan Chen", 
        "Specialization": "AI & Computer Vision", 
        "Compute Hardware": "8x H100 Nodes",
        "Papers Swap": "12 Drafts" 
      },
    }
  ];

  return (
    <section id="about" className="py-16 md:py-24 relative overflow-hidden bg-[var(--bg)] public-page">
      {/* Decorative blurs for dynamic styling */}
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Centered Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-normal text-[var(--text)] font-heading">
            Why students join CampusCircle
          </h2>
          <p className="mt-4 text-base md:text-lg text-[var(--text-muted)] font-body leading-relaxed">
            A secure, private space where verified peers share academic resources, seek career mentorship, and collaborate.
          </p>
        </div>

        {/* Dynamic shadcn-designed testmonial cards list */}
        <div className="w-full max-w-5xl mx-auto">
          <AiModelsList models={studentMotiveModels} className="[&>h2]:hidden" />
        </div>

      </div>
    </section>
  );
}
