import { isBefore, parseISO, startOfToday } from "date-fns";
import { ApiError, fail, json } from "@/lib/api/errors";
import { requireUser } from "@/lib/api/auth";
import { Task, TaskStatus } from "@/lib/types";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: memberships, error: membershipError } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);

    if (membershipError) {
      throw new ApiError(500, membershipError.message);
    }

    const projectIds = (memberships ?? []).map((item) => item.project_id);

    if (projectIds.length === 0) {
      return json({
        stats: {
          totalTasks: 0,
          byStatus: { todo: 0, in_progress: 0, done: 0 },
          byUser: [],
          overdue: [],
          projects: 0,
        },
      });
    }

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, created_at), creator:profiles!tasks_created_by_fkey(id, name, email, created_at)")
      .in("project_id", projectIds);

    if (error) {
      throw new ApiError(500, error.message);
    }

    const allTasks = (tasks ?? []) as Task[];
    const byStatus = allTasks.reduce(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      { todo: 0, in_progress: 0, done: 0 } as Record<TaskStatus, number>,
    );

    const userCounts = new Map<string, { userId: string; name: string; count: number }>();

    allTasks.forEach((task) => {
      const current = userCounts.get(task.assigned_to) ?? {
        userId: task.assigned_to,
        name: task.assignee?.name ?? "Unknown",
        count: 0,
      };
      current.count += 1;
      userCounts.set(task.assigned_to, current);
    });

    const overdue = allTasks
      .filter((task) => task.status !== "done" && isBefore(parseISO(task.due_date), startOfToday()))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8);

    return json({
      stats: {
        totalTasks: allTasks.length,
        byStatus,
        byUser: Array.from(userCounts.values()).sort((a, b) => b.count - a.count),
        overdue,
        projects: projectIds.length,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
