import { ApiError, fail, json } from "@/lib/api/errors";
import { requireProjectRole } from "@/lib/api/auth";
import { memberSchema } from "@/lib/api/validation";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { projectId } = await context.params;
    const body = memberSchema.parse(await request.json());
    const { supabase } = await requireProjectRole(projectId, ["admin"]);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", body.email.toLowerCase())
      .maybeSingle();

    if (profileError) {
      throw new ApiError(500, profileError.message);
    }

    if (!profile) {
      throw new ApiError(404, "No signed-up user exists with that email");
    }

    const { data, error } = await supabase
      .from("project_members")
      .upsert({ project_id: projectId, user_id: profile.id, role: body.role }, { onConflict: "project_id,user_id" })
      .select("id, project_id, user_id, role, joined_at, profile:profiles(id, name, email, created_at)")
      .single();

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ member: data }, 201);
  } catch (error) {
    return fail(error);
  }
}
