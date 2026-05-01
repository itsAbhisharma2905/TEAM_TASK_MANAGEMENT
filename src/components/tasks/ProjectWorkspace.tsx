"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { format } from "date-fns";
import { AlertTriangle, CalendarDays, Check, CircleCheckBig, Clock3, ListTodo, Pencil, RefreshCw, ShieldCheck, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api/client";
import { priorities, priorityLabels, statuses, statusLabels } from "@/lib/labels";
import { Project, ProjectMember, Task, TaskPriority, TaskStatus } from "@/lib/types";

type Props = {
  projectId: string;
};

export function ProjectWorkspace({ projectId }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myId, setMyId] = useState("");
  const [error, setError] = useState("");
  const [taskModal, setTaskModal] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const myMember = project?.members?.find((member) => member.user_id === myId);
  const isAdmin = myMember?.role === "admin";

  const grouped = useMemo(
    () =>
      statuses.reduce(
        (acc, status) => {
          acc[status] = tasks.filter((task) => task.status === status);
          return acc;
        },
        {} as Record<TaskStatus, Task[]>,
      ),
    [tasks],
  );

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: tasks.length,
      open: tasks.filter((task) => task.status !== "done").length,
      done: tasks.filter((task) => task.status === "done").length,
      overdue: tasks.filter((task) => task.status !== "done" && new Date(task.due_date) < today).length,
    };
  }, [tasks]);

  const load = useCallback(async () => {
    setError("");
    const [projectData, tasksData, meData] = await Promise.all([
      api<{ project: Project }>(`/api/projects/${projectId}`),
      api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`),
      api<{ user: { id: string } }>("/api/auth/me"),
    ]);
    setProject(projectData.project);
    setTasks(tasksData.tasks);
    setMyId(meData.user.id);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load project");
        setLoading(false);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateTaskStatus(taskId: string, nextStatus: TaskStatus | undefined) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task || !nextStatus || task.status === nextStatus) {
      return;
    }

    setTasks((current) => current.map((item) => (item.id === taskId ? { ...item, status: nextStatus } : item)));

    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      setTasks((current) => current.map((item) => (item.id === taskId ? task : item)));
      setError(err instanceof Error ? err.message : "Unable to move task");
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    await updateTaskStatus(String(event.active.id), event.over?.id as TaskStatus | undefined);
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    setError("");
    const form = new FormData(target);

    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          role: String(form.get("role") ?? "member"),
        }),
      });
      target.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add member");
    }
  }

  async function removeMember(memberId: string) {
    if (!window.confirm("Remove this member from the project?")) {
      return;
    }

    setActioning(memberId);
    setError("");

    try {
      await api(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member");
    } finally {
      setActioning("");
    }
  }

  function taskPayloadFromForm(form: FormData) {
    return {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      dueDate: String(form.get("dueDate") ?? ""),
      priority: String(form.get("priority") ?? "medium"),
      status: String(form.get("status") ?? "todo"),
      assignedTo: String(form.get("assignedTo") ?? ""),
    };
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    setActioning("task");
    setError("");

    try {
      await api(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(taskPayloadFromForm(new FormData(target))),
      });
      target.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign task");
    } finally {
      setActioning("");
    }
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskModal) {
      return;
    }

    setActioning("task");
    setError("");

    try {
      await api(`/api/projects/${projectId}/tasks/${taskModal.id}`, {
        method: "PATCH",
        body: JSON.stringify(taskPayloadFromForm(new FormData(event.currentTarget))),
      });
      setTaskModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save task");
    } finally {
      setActioning("");
    }
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    setActioning(taskId);
    setError("");

    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task");
    } finally {
      setActioning("");
    }
  }

  if (loading) {
    return <div className="px-5 py-8 text-sm text-[#66736c] md:px-8">Loading project...</div>;
  }

  if (!project) {
    return <div className="px-5 py-8 text-sm text-red-700 md:px-8">{error || "Project not found"}</div>;
  }

  return (
    <div className="mx-auto max-w-[1680px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5 grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="overflow-hidden rounded-[28px] bg-[#20201d] text-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_430px]">
            <div className="flex min-h-[220px] flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold capitalize text-white/70">
                  <ShieldCheck size={14} />
                  {myMember?.role ?? "member"} access
                </div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal md:text-5xl">{project.name}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">{project.description || "No description yet."}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => void load()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/80 hover:bg-white/[0.06]">
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ProjectMetric icon={ListTodo} label="Total" value={metrics.total} />
              <ProjectMetric icon={Clock3} label="Open" value={metrics.open} />
              <ProjectMetric icon={CircleCheckBig} label="Done" value={metrics.done} />
              <ProjectMetric icon={AlertTriangle} label="Overdue" value={metrics.overdue} />
            </div>
          </div>
        </div>
        <MemberPanel members={project.members ?? []} currentUserId={myId} isAdmin={isAdmin} actioning={actioning} onAdd={addMember} onRemove={removeMember} />
      </header>
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {isAdmin && <TaskComposer members={project.members ?? []} saving={actioning === "task"} onSubmit={createTask} />}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <section className="grid gap-4 lg:grid-cols-3">
          {statuses.map((status) => (
            <Column key={status} status={status} tasks={grouped[status]} isAdmin={isAdmin} actioning={actioning} onEdit={setTaskModal} onDelete={deleteTask} onStatusChange={updateTaskStatus} />
          ))}
        </section>
      </DndContext>
      {taskModal && <TaskModal task={taskModal} members={project.members ?? []} saving={actioning === "task"} onClose={() => setTaskModal(null)} onSubmit={saveTask} />}
    </div>
  );
}

function ProjectMetric({ icon: Icon, label, value }: { icon: typeof ListTodo; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <Icon size={18} className="mb-6 text-white/60" />
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-medium text-white/55">{label}</div>
    </div>
  );
}

function MemberPanel({ members, currentUserId, isAdmin, actioning, onAdd, onRemove }: { members: ProjectMember[]; currentUserId: string; isAdmin: boolean; actioning: string; onAdd: (event: FormEvent<HTMLFormElement>) => void; onRemove: (memberId: string) => void }) {
  const currentMember = members.find((member) => member.user_id === currentUserId);

  return (
    <aside className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
      {currentMember && (
        <div className="mb-4 rounded-2xl bg-[#20201d] p-4 text-white">
          <p className="text-xs font-semibold uppercase text-white/50">You are signed in as</p>
          <p className="mt-2 truncate text-lg font-semibold">{currentMember.profile?.name}</p>
          <p className="truncate text-xs text-white/55">{currentMember.profile?.email}</p>
          <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-[#20201d]">
            {currentMember.role}
          </div>
        </div>
      )}
      <div className="mb-4 flex items-center gap-2">
        <UsersRound size={18} />
        <h2 className="font-semibold">Members</h2>
      </div>
      <div className="mb-4 max-h-48 space-y-2 overflow-auto">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#fbfaf7] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.profile?.name}</p>
              <p className="truncate text-xs text-[#66736c]">{member.profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold capitalize text-[#66736c]">{member.role}</span>
              {isAdmin && (
                <button disabled={actioning === member.id} onClick={() => onRemove(member.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#66736c] hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {isAdmin && (
        <form onSubmit={onAdd} className="grid gap-2 sm:grid-cols-[1fr_110px_44px]">
          <input name="email" type="email" required placeholder="member@company.com" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
          <select name="role" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button className="flex h-11 items-center justify-center rounded-xl bg-[#2d6cdf] text-white">
            <UserPlus size={17} />
          </button>
        </form>
      )}
    </aside>
  );
}

function TaskComposer({ members, saving, onSubmit }: { members: ProjectMember[]; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mb-5 rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold">Assign task</h2>
          <p className="mt-1 text-sm text-[#66736c]">Create work and choose the responsible project member.</p>
        </div>
        <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2d6cdf]">Admin action</span>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 xl:grid-cols-[1.2fr_1fr_170px_150px_150px_110px]">
        <input name="title" required placeholder="Task title" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
        <input name="description" placeholder="Short description" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
        <select name="assignedTo" required defaultValue="" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]">
          <option value="" disabled>Assign to</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>{member.profile?.name ?? member.profile?.email}</option>
          ))}
        </select>
        <input name="dueDate" type="date" required defaultValue={today} className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
        <select name="priority" defaultValue="medium" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]">
          {priorities.map((priority) => (
            <option key={priority} value={priority}>{priorityLabels[priority]}</option>
          ))}
        </select>
        <input type="hidden" name="status" value="todo" />
        <button disabled={saving || members.length === 0} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#20201d] text-sm font-semibold text-white disabled:opacity-60">
          <Check size={16} />
          Assign
        </button>
      </form>
    </section>
  );
}

function Column({ status, tasks, isAdmin, actioning, onEdit, onDelete, onStatusChange }: { status: TaskStatus; tasks: Task[]; isAdmin: boolean; actioning: string; onEdit: (task: Task) => void; onDelete: (taskId: string) => void; onStatusChange: (taskId: string, status: TaskStatus) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={clsx("min-h-[540px] rounded-[24px] border p-3 transition", isOver ? "border-[#2d6cdf] bg-[#eef4ff]" : "border-black/10 bg-[#ebe8df]")}>
      <div className="mb-3 flex items-center justify-between px-2 py-1">
        <h2 className="font-semibold">{statusLabels[status]}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#66736c]">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 && <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 p-5 text-sm text-[#66736c]">No tasks here.</div>}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} isAdmin={isAdmin} deleting={actioning === task.id} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, isAdmin, deleting, onEdit, onDelete, onStatusChange }: { task: Task; isAdmin: boolean; deleting: boolean; onEdit: (task: Task) => void; onDelete: (taskId: string) => void; onStatusChange: (taskId: string, status: TaskStatus) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <article ref={setNodeRef} style={style} className={clsx("rounded-2xl border border-black/10 bg-white p-4 shadow-sm", isDragging && "z-30 opacity-80")}>
      <button type="button" className="w-full cursor-grab text-left active:cursor-grabbing" {...listeners} {...attributes}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-5">{task.title}</h3>
          <span className={clsx("rounded-full px-2 py-1 text-xs font-semibold capitalize", priorityTone(task.priority))}>{priorityLabels[task.priority]}</span>
        </div>
        <p className="mb-4 line-clamp-3 text-sm leading-6 text-[#66736c]">{task.description || "No description."}</p>
        <div className="flex items-center justify-between gap-3 text-xs text-[#66736c]">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} />
            {format(new Date(task.due_date), "MMM d")}
          </span>
          <span className="truncate">{task.assignee?.name}</span>
        </div>
      </button>
      <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-black/10 pt-3">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={status === task.status}
            title={statusLabels[status]}
            onClick={() => onStatusChange(task.id, status)}
            className={clsx(
              "h-8 rounded-lg text-xs font-semibold transition",
              status === task.status ? "bg-[#20201d] text-white" : "bg-[#fbfaf7] text-[#66736c] hover:bg-[#eef4ff] hover:text-[#2d6cdf]",
            )}
          >
            {status === "todo" ? "To Do" : status === "in_progress" ? "Doing" : "Done"}
          </button>
        ))}
      </div>
      {isAdmin && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onEdit(task)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-[#fbfaf7] text-xs font-semibold">
            <Pencil size={14} />
            Edit
          </button>
          <button disabled={deleting} onClick={() => onDelete(task.id)} className="flex h-9 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 disabled:opacity-50">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </article>
  );
}

function TaskModal({ task, members, saving, onClose, onSubmit }: { task: Task; members: ProjectMember[]; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-5">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-[26px] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit task</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbfaf7]">
            <X size={17} />
          </button>
        </div>
        <div className="grid gap-3">
          <input name="title" required defaultValue={task.title} placeholder="Task title" className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
          <textarea name="description" defaultValue={task.description} placeholder="Description" className="min-h-28 resize-none rounded-xl border border-black/10 bg-[#fbfaf7] p-3 text-sm outline-none focus:border-[#2d6cdf]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="dueDate" type="date" required defaultValue={task.due_date} className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
            <select name="assignedTo" required defaultValue={task.assigned_to} className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]">
              <option value="" disabled>Assign to</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>{member.profile?.name}</option>
              ))}
            </select>
            <select name="priority" defaultValue={task.priority} className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]">
              {priorities.map((priority) => (
                <option key={priority} value={priority}>{priorityLabels[priority]}</option>
              ))}
            </select>
            <select name="status" defaultValue={task.status} className="h-11 rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]">
              {statuses.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </div>
        </div>
        <button disabled={saving} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#20201d] text-sm font-semibold text-white disabled:opacity-60">
          <Check size={17} />
          {saving ? "Saving..." : "Save task"}
        </button>
      </form>
    </div>
  );
}

function priorityTone(priority: TaskPriority) {
  return {
    low: "bg-[#e5f1ec] text-[#17614a]",
    medium: "bg-[#fff0c7] text-[#8a5b00]",
    high: "bg-red-50 text-red-700",
  }[priority];
}
