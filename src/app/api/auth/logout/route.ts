import { fail, json } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
