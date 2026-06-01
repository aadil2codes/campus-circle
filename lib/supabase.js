import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Secure validation check to prevent Next.js build-time static page crashes
const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Graceful fallback to prevent build crashes when environment variables are missing
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: (tableName) => ({
        insert: async (data) => {
          console.warn(`Supabase Mock: Inserting into '${tableName}'`, data);
          
          // Simulate latency
          await new Promise((resolve) => setTimeout(resolve, 1200));

          // Auto-increment queue position in LocalStorage for high-signal UI demoing
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("techleaders_mock_queue");
            const nextVal = stored ? parseInt(stored, 10) + 1 : 47;
            localStorage.setItem("techleaders_mock_queue", nextVal.toString());
          }
          return { error: null };
        },
        select: async (query, options) => {
          console.warn(`Supabase Mock: Selecting count from '${tableName}'`);
          
          let currentQueue = 47;
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("techleaders_mock_queue");
            currentQueue = stored ? parseInt(stored, 10) : 47;
          }
          return { count: currentQueue, error: null };
        }
      })
    };