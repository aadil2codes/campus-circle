import { createClient } from "@supabase/supabase-js";
import { supabase as publicClient } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Check if credentials are valid URL/non-empty
export const isServiceMockMode =
  !isValidUrl(supabaseUrl) ||
  !serviceRoleKey ||
  serviceRoleKey.includes("your_supabase_service_role");

// Initialize Administrative Supabase Client with service role key if present
export const supabaseAdmin = !isServiceMockMode
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : ({
      auth: {
        admin: {
          generateLink: async ({ email, options }: any) => {
            console.warn(
              "Supabase Admin: SUPABASE_SERVICE_ROLE_KEY is missing. Generating mock auth link."
            );
            const redirectUrl = options?.redirectTo || "http://localhost:3000/auth/callback";
            const mockLink = `${redirectUrl}?code=mock_token_${encodeURIComponent(
              email
            )}&email=${encodeURIComponent(email)}`;
            return {
              data: {
                properties: {
                  action_link: mockLink,
                },
              },
              error: null,
            };
          },
        },
      },
      // Delegate standard database requests to the public client to allow live updates
      from: (tableName: string) => {
        if (publicClient && typeof publicClient.from === "function") {
          return publicClient.from(tableName);
        }
        return {
          update: (data: any) => ({
            eq: (col: string, val: any) => Promise.resolve({ error: null, data: null }),
          }),
          select: (query: string, options: any) => ({
            eq: (col: string, val: any) => ({
              order: (colOrder: string, opts: any) =>
                Promise.resolve({
                  data: [
                    {
                      id: "mock-1",
                      full_name: "Arjun Mehta",
                      title: "CTO",
                      company_name: "Razorpay",
                      linkedin_url: "https://linkedin.com",
                      status: "pending",
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      },
    } as any);

if (isServiceMockMode && typeof window === "undefined") {
  console.warn(
    "TechLeaders.in: SUPABASE_SERVICE_ROLE_KEY not configured. Administrative features operate in Mock Mode."
  );
}
