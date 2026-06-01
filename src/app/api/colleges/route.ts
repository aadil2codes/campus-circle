import { NextResponse } from "next/server";
import collegesData from "@/lib/colleges.json";

export interface CollegeRecord {
  name: string;
  city: string;
  state: string;
}

const colleges = collegesData as CollegeRecord[];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    if (!query) {
      // Return a default set of popular colleges if no search is typed
      return NextResponse.json(colleges.slice(0, 15));
    }

    // Special exact mappings for common shortcuts/abbreviations
    let customMatches: CollegeRecord[] = [];
    if (query === "iit") {
      customMatches = colleges.filter(c => c.name.startsWith("IIT "));
    } else if (query === "nit") {
      customMatches = colleges.filter(c => c.name.startsWith("NIT "));
    } else if (query === "ggv") {
      customMatches = colleges.filter(c => c.name.toLowerCase().includes("ggv") || c.name.toLowerCase().includes("guru ghasidas"));
    }

    // Score and filter colleges
    const scored = colleges
      .map(c => {
        const nameLower = c.name.toLowerCase();
        const cityLower = c.city.toLowerCase();
        const stateLower = c.state.toLowerCase();
        
        let score = 0;

        // Exact match on premium abbreviation
        if (query === "iit" && nameLower.startsWith("iit ")) score += 100;
        if (query === "nit" && nameLower.startsWith("nit ")) score += 100;
        if (query === "ggv" && (nameLower.includes("ggv") || nameLower.includes("guru ghasidas"))) score += 100;

        // Scoring rules
        if (nameLower === query) {
          score += 50; // Exact full match
        } else if (nameLower.startsWith(query)) {
          score += 30; // Starts with query
        } else {
          // Check if any word starts with query
          const words = nameLower.split(/[\s,.\-&()/]+/);
          const wordMatchIndex = words.findIndex(w => w.startsWith(query));
          if (wordMatchIndex !== -1) {
            score += 20 - wordMatchIndex; // First words rank higher
          } else if (nameLower.includes(query)) {
            score += 10; // Simple substring match in name
          }
        }

        // Substring match in city or state
        if (cityLower.startsWith(query)) {
          score += 8;
        } else if (cityLower.includes(query)) {
          score += 4;
        }
        
        if (stateLower.startsWith(query)) {
          score += 5;
        } else if (stateLower.includes(query)) {
          score += 2;
        }

        return { college: c, score };
      })
      .filter(item => item.score > 0);

    // Sort by score descending, then by name alphabetically
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.college.name.localeCompare(b.college.name);
    });

    // Extract college records and dedup if we prepended custom matches
    const results: CollegeRecord[] = [];
    const seen = new Set<string>();

    // Add custom shortcut matches first
    for (const c of customMatches) {
      const key = `${c.name}|${c.city}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(c);
      }
    }

    // Add other scored matches
    for (const item of scored) {
      const key = `${item.college.name}|${item.college.city}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item.college);
      }
      if (results.length >= 25) break; // Limit to 25 results
    }

    return NextResponse.json(results.slice(0, 20));
  } catch (error: any) {
    console.error("Colleges search API failed:", error);
    return NextResponse.json({ error: "Failed to fetch colleges" }, { status: 500 });
  }
}
