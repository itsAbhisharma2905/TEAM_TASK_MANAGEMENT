import { ApiError, fail, json } from "@/lib/api/errors";
import { requireUser } from "@/lib/api/auth";
import { projectSchema } from "@/lib/api/validation";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("project_members")
      .select("role, projects(id, name, description, created_by, created_at, updated_at, tasks(count))")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    const projects = (data ?? []).map((item) => {
      const project = Array.isArray(item.projects) ? item.projects[0] : item.projects;
      return {
        ...project,
        my_role: item.role,
        task_count: project?.tasks?.[0]?.count ?? 0,
      };
    });

    return json({ projects });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = projectSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("create_project_with_admin", {
      project_name: body.name,
      project_description: body.description,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ project: data }, 201);
  } catch (error) {
    return fail(error);
  }
}
