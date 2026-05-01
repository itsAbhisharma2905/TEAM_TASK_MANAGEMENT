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

    return json({ user: data.user, session: data.session, confirmationRequired: !data.session }, 201);
  } catch (error) {
    return fail(error);
  }
}
