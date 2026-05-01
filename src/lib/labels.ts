import { TaskPriority, TaskStatus } from "@/lib/types";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const statuses: TaskStatus[] = ["todo", "in_progress", "done"];
export const priorities: TaskPriority[] = ["low", "medium", "high"];
