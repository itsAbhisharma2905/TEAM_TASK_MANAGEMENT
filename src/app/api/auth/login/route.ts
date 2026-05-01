import { fail, json } from "@/lib/api/errors";
import { loginSchema } from "@/lib/api/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      const message = error.message.toLowerCase().includes("email not confirmed")
        ? "Direct login is blocked because Supabase email confirmation is enabled. Disable Confirm email in Supabase Auth settings."
        : "Invalid email or password";
      return json({ error: message }, 401);
    }

    return json({ user: data.user });
  } catch (error) {
    return fail(error);
  }
}
