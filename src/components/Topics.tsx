"use client";

import React from "react";
import { motion } from "motion/react";
import { TestimonialsColumn, TestimonialItem } from "./ui/testimonials-columns-1";

// Import your custom images from the Topics Image directory
import img1 from "./Topics Image/realistic-indian-student-sitting-in-a-college-libr.jpeg";
import img2 from "./Topics Image/Gemini_Generated_Image_z2d5gzz2d5gzz2d5.png";
import img3 from "./Topics Image/b1f5e765-4d77-414f-b865-a4177497f557.jpg";
import img4 from "./Topics Image/Gemini_Generated_Image_evz8p4evz8p4evz8.png";
import img5 from "./Topics Image/bae86fd33b98d91a0d55a7569cfc8b68.jpg";
import img6 from "./Topics Image/c064a1763a0bbeeb546157454f0d8b1a.png";
import img7 from "./Topics Image/3daf9e4f0266bbe0cfc2dd0e6a647e2b.jpg";
import img8 from "./Topics Image/f025fdb49109ed1a535fd90ba4f1fa67.jpg";
import img9 from "./Topics Image/e1e81577-f002-4fb0-b8f8-8e4db26d8ce9.png";
import img10 from "./Topics Image/ChatGPT Image May 29, 2026, 10_22_33 PM.png";
import img11 from "./Topics Image/image-1144089278795687.jpeg";
import img12 from "./Topics Image/silhouette-af-man-without-face-in-hood-on-red-background-anonymous-crime-photo.jpg";

export default function Topics() {
  const testimonials: TestimonialItem[] = [
    {
      text: "Does anyone from IIT Delhi or DTU want to team up for the Smart India Hackathon? Our college team needs a crazy good designer, and I've heard you guys have the best design clubs. DM me!",
      image: img1.src,
      name: "Rohit K.",
      role: "BITS Pilani · #cross-college-collab",
    },
    {
      text: "Finally found a senior from BITS Pilani on this circle who roasted my resume and did a mock system design interview with me. Cross-college networking is literally a cheat code.",
      image: img2.src,
      name: "Aditya V.",
      role: "RV College · #placement-prep",
    },
    {
      text: "The syllabus for VTU and DTU is almost identical for advanced semiconductor devices. If anyone from VTU has handwritten notes, please share! Sending coffee as a thank you.",
      image: img3.src,
      name: "Shreya N.",
      role: "DTU Delhi · #resource-sharing",
    },
    {
      text: "Traveling to IIT Bombay next week for the Mood Indigo cultural fest. Any students there open to show a clueless freshman around the campus and grab some local tea?",
      image: img10.src,
      name: "Varun D.",
      role: "SRM University · #meetups",
    },
    {
      text: "Looking for a LeetCode study buddy from another college to keep me accountable. Target is 2 medium problems every day. If you skip, you owe the other person a samosa.",
      image: img4.src,
      name: "Vikram Y.",
      role: "VIT Vellore · #dsa-buddies",
    },
    {
      text: "It's crazy how students from NSUT, IIIT, and IGDTUW are all preparing for the same off-campus drive next week. Let's make a quick study circle to compile all past interview questions!",
      image: img5.src,
      name: "Karan S.",
      role: "NSUT Delhi · #prep-circle",
    },
    {
      text: "Just launched a GitHub repo for a decentralized attendance tracking bot with a classmate I met here from NIT Trichy. Working across campuses is surprisingly smooth!",
      image: img6.src,
      name: "Arjun M.",
      role: "IIT Madras · #hackathons",
    },
    {
      text: "Hostel Valorant tournament matches are fun, but let's take it up a notch. Any active squads from SRM or VIT down for a 5v5 custom lobby this Sunday?",
      image: img11.src,
      name: "Rohan M.",
      role: "KIIT University · #intercollege-lan",
    },
    {
      text: "I was debating between a mechanical core career or shifting to IT, and a mechanical senior from IIT Kharagpur here explained the whole industry to me in 10 minutes. So helpful!",
      image: img7.src,
      name: "Tanvi D.",
      role: "Anna University · #career-chat",
    },
    {
      text: "Collaborating with students from three different Pune colleges to build an electric formula car for the upcoming inter-college national event. The brainstorming sessions are wild.",
      image: img8.src,
      name: "Rohan B.",
      role: "COEP Pune · #fest-collab",
    },
    {
      text: "Anyone from UIET or Thapar building a startup and looking for a co-founder? Let's meet up this weekend at a central cafe to pitch ideas and see if we vibe!",
      image: img9.src,
      name: "Aadil H.",
      role: "PEC Chandigarh · #startup-culture",
    },
    {
      text: "To the student from IIT Roorkee who uploaded their entire semester-wise coding folder containing lab solutions—you are an unsung hero across multiple campuses.",
      image: img12.src,
      name: "Anonymous Ninja",
      role: "IIT Roorkee · #unsung-heroes",
    },
  ];

  const firstColumn = testimonials.slice(0, 4);
  const secondColumn = testimonials.slice(4, 8);
  const thirdColumn = testimonials.slice(8, 12);

  return (
    <section id="topics" className="py-16 md:py-24 relative overflow-hidden bg-[var(--bg)]">
      {/* Background Soft Ambient Light */}
      <div className="absolute top-1/4 right-10 w-[300px] h-[300px] bg-[var(--primary)]/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text)] font-heading">
              Topics discussed inside the community
            </h2>
            <p className="mt-4 text-base md:text-lg text-[var(--text-muted)] font-body leading-relaxed max-w-xl">
              Exchange helpful campus resources, ask seniors for advice, and keep up with what is happening around campus.
            </p>
          </motion.div>
        </div>

        {/* Testimonials Columns Matrix */}
        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[640px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>

      </div>
    </section>
  );
}
