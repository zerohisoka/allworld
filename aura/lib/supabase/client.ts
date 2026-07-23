"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

let supabaseBrowserSingleton: ReturnType<typeof createBrowserClient<Database>>;

export function getSupabaseBrowserClient() {
  if (supabaseBrowserSingleton) return supabaseBrowserSingleton;
  supabaseBrowserSingleton = createClient();
  return supabaseBrowserSingleton;
}
