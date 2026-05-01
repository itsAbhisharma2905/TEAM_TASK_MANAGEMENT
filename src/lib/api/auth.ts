import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, "Authentication required");
  }

  return { supabase, user };
}

export async function requireProjectRole(projectId: string, allowed: Array<"admin" | "member">) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!data || !allowed.includes(data.role)) {
    throw new ApiError(403, "You do not have access to this project");
  }

  return { supabase, user, role: data.role as "admin" | "member" };
}
