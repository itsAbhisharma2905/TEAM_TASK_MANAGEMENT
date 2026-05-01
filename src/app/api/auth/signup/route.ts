import { fail, json } from "@/lib/api/errors";
import { signupSchema } from "@/lib/api/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
        },
      },
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    if (data.session) {
      return json({ user: data.user, session: data.session }, 201);
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (loginError) {
      const confirmEnabled = loginError.message.toLowerCase().includes("email not confirmed");
      return json(
        {
          error: confirmEnabled
            ? "Direct login is blocked because Supabase email confirmation is enabled. Disable Confirm email in Supabase Auth settings."
            : loginError.message,
        },
        confirmEnabled ? 409 : 400,
      );
    }

    return json({ user: loginData.user, session: loginData.session }, 201);
  } catch (error) {
    return fail(error);
  }
}
