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

export const isMockMode = !isValidUrl(supabaseUrl) || !supabaseAnonKey;

// Helper to create a chainable, thenable (Promise-like) Proxy mock
export const createChainableMock = (resolvedValue: any) => {
  const targetFn = () => {};
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve(resolvedValue);
      }
      if (typeof prop === "symbol") {
        return undefined;
      }
      return () => new Proxy(targetFn, handler);
    }
  };
  return new Proxy(targetFn, handler);
};

export const supabase = !isMockMode
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      from: (tableName: string) => {
        let currentQueue = 47;
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("techleaders_mock_queue");
          currentQueue = stored ? parseInt(stored, 10) : 47;
        }
        return createChainableMock({ data: [], error: null, count: currentQueue });
      },
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signUp: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null }, error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
      }
    } as any);

