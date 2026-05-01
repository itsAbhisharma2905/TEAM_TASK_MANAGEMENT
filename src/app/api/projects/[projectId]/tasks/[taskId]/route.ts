import { ApiError, fail, json } from "@/lib/api/errors";
import { requireProjectRole } from "@/lib/api/auth";
import { taskUpdateSchema } from "@/lib/api/validation";

type Context = {
  params: Promise<{ projectId: string; taskId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { projectId, taskId } = await context.params;
    const body = taskUpdateSchema.parse(await request.json());
    const { supabase, user, role } = await requireProjectRole(projectId, ["admin", "member"]);
    const { data: existing, error: existingError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("project_id", projectId)
      .single();

    if (existingError || !existing) {
      throw new ApiError(404, "Task not found");
    }

    const memberEditingOwnStatus = role === "member" && existing.assigned_to === user.id && Object.keys(body).every((key) => key === "status");

    if (role !== "admin" && !memberEditingOwnStatus) {
      throw new ApiError(403, "Members can update only their own task status");
    }

    if (body.assignedTo) {
      const { data: assignee } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", body.assignedTo)
        .maybeSingle();

      if (!assignee) {
        throw new ApiError(400, "Assigned user must be a project member");
      }
    }

    const patch = Object.fromEntries(
      Object.entries({
        title: body.title,
        description: body.description,
        due_date: body.dueDate,
        priority: body.priority,
        status: body.status,
        assigned_to: body.assignedTo,
        updated_at: new Date().toISOString(),
      }).filter((entry) => entry[1] !== undefined),
    );

    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", taskId)
      .eq("project_id", projectId)
      .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, created_at), creator:profiles!tasks_created_by_fkey(id, name, email, created_at)")
      .single();

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ task: data });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { projectId, taskId } = await context.params;
    const { supabase } = await requireProjectRole(projectId, ["admin"]);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("project_id", projectId);

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
