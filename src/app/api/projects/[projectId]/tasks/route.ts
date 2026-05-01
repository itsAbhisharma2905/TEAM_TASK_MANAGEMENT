import { ApiError, fail, json } from "@/lib/api/errors";
import { requireProjectRole } from "@/lib/api/auth";
import { taskSchema } from "@/lib/api/validation";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const { projectId } = await context.params;
    const { supabase, user, role } = await requireProjectRole(projectId, ["admin", "member"]);
    let query = supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, created_at), creator:profiles!tasks_created_by_fkey(id, name, email, created_at)")
      .eq("project_id", projectId)
      .order("due_date", { ascending: true });

    if (role === "member") {
      query = query.eq("assigned_to", user.id);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, error.message);
    }

    return json({ tasks: data ?? [] });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { projectId } = await context.params;
    const body = taskSchema.parse(await request.json());
    const { supabase, user } = await requireProjectRole(projectId, ["admin"]);
    const { data: assignee } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", body.assignedTo)
      .maybeSingle();

    if (!assignee) {
      throw new ApiError(400, "Assigned user must be a project member");
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: body.title,
        description: body.description,
        due_date: body.dueDate,
        priority: body.priority,
        status: body.status,
        assigned_to: body.assignedTo,
        project_id: projectId,
        created_by: user.id,
      })
      .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, created_at), creator:profiles!tasks_created_by_fkey(id, name, email, created_at)")
      .single();

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ task: data }, 201);
  } catch (error) {
    return fail(error);
  }
}
