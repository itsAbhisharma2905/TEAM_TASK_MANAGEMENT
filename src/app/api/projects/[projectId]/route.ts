import { ApiError, fail, json } from "@/lib/api/errors";
import { requireProjectRole } from "@/lib/api/auth";
import { projectSchema } from "@/lib/api/validation";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const { projectId } = await context.params;
    const { supabase } = await requireProjectRole(projectId, ["admin", "member"]);
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      throw new ApiError(404, "Project not found");
    }

    const { data: members, error: memberError } = await supabase
      .from("project_members")
      .select("id, project_id, user_id, role, joined_at, profile:profiles(id, name, email, created_at)")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true });

    if (memberError) {
      throw new ApiError(500, memberError.message);
    }

    return json({ project: { ...project, members } });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { projectId } = await context.params;
    const body = projectSchema.partial().parse(await request.json());
    const { supabase } = await requireProjectRole(projectId, ["admin"]);
    const { data, error } = await supabase
      .from("projects")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ project: data });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { projectId } = await context.params;
    const { supabase } = await requireProjectRole(projectId, ["admin"]);
    const { error } = await supabase.from("projects").delete().eq("id", projectId);

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
