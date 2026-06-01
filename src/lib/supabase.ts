import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if credentials are valid URL/non-empty
const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Extremely premium build-resilient client configuration
// Checks for valid URLs, falling back to a local mock client
// if the environment variables are unconfigured. This prevents
// build-time static generation crashes!
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      from: (tableName: string) => ({
        insert: async (data: any) => {
          console.warn(`Supabase Mock: Inserting into '${tableName}'`, data);
          await new Promise((resolve) => setTimeout(resolve, 1200)); // Latency

          // Auto-increment queue position in LocalStorage for dynamic UI demoing
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("techleaders_mock_queue");
            const nextVal = stored ? parseInt(stored, 10) + 1 : 47;
            localStorage.setItem("techleaders_mock_queue", nextVal.toString());
          }
          return { error: null, data: null };
        },
        select: async (query: string, options: any) => {
          console.warn(`Supabase Mock: Selecting count from '${tableName}'`);
          let currentQueue = 47;
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("techleaders_mock_queue");
            currentQueue = stored ? parseInt(stored, 10) : 47;
          }
          return { count: currentQueue, error: null };
        }
      })
    } as any);
