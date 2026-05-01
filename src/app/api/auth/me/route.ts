import { fail, json } from "@/lib/api/errors";
import { requireUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return json({ user, profile });
  } catch (error) {
    return fail(error);
  }
}
