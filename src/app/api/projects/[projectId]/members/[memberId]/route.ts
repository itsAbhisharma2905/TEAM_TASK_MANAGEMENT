import { ApiError, fail, json } from "@/lib/api/errors";
import { requireProjectRole } from "@/lib/api/auth";

type Context = {
  params: Promise<{ projectId: string; memberId: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  try {
    const { projectId, memberId } = await context.params;
    const { supabase, user } = await requireProjectRole(projectId, ["admin"]);
    const { data: admins, error: adminError } = await supabase
      .from("project_members")
      .select("id, user_id")
      .eq("project_id", projectId)
      .eq("role", "admin");

    if (adminError) {
      throw new ApiError(500, adminError.message);
    }

    const targetIsOnlyAdmin = admins?.length === 1 && admins[0].id === memberId;
    const targetIsSelf = admins?.some((admin) => admin.id === memberId && admin.user_id === user.id);

    if (targetIsOnlyAdmin || targetIsSelf) {
      throw new ApiError(400, "Assign another admin before removing this member");
    }

    const { error } = await supabase.from("project_members").delete().eq("id", memberId).eq("project_id", projectId);

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
