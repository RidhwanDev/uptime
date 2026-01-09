import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase credentials not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Log connection status
console.log("🔗 Supabase Config:");
console.log(
  "   URL:",
  supabaseUrl ? `${supabaseUrl.substring(0, 40)}...` : "❌ NOT SET"
);
console.log(
  "   Key:",
  supabaseAnonKey
    ? `${supabaseAnonKey.substring(0, 20)}... (${supabaseAnonKey.length} chars)`
    : "❌ NOT SET"
);

// Test connection helper
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await (supabase.from("users") as any)
      .select("count")
      .limit(1);
    if (error) {
      console.error("❌ Supabase connection test failed:", error.message);
      return false;
    }
    console.log("✅ Supabase connection test passed!");
    return true;
  } catch (e) {
    console.error("❌ Supabase connection exception:", e);
    return false;
  }
}
