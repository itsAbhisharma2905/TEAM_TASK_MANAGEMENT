export type MemberRole = "admin" | "member";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export type Profile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile: Profile;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  my_role?: MemberRole;
  members?: ProjectMember[];
  task_count?: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  project_id: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
  creator?: Profile;
};

export type DashboardStats = {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  byUser: Array<{ userId: string; name: string; count: number }>;
  overdue: Task[];
  projects: number;
};
