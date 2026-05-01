"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, Clock3, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api/client";
import { DashboardStats } from "@/lib/types";
import { statusLabels } from "@/lib/labels";

const initialStats: DashboardStats = {
  totalTasks: 0,
  byStatus: { todo: 0, in_progress: 0, done: 0 },
  byUser: [],
  overdue: [],
  projects: 0,
};

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ stats: DashboardStats }>("/api/dashboard")
      .then((data) => setStats(data.stats))
      .finally(() => setLoading(false));
  }, []);

  const completion = stats.totalTasks ? Math.round((stats.byStatus.done / stats.totalTasks) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-[#66736c]">Team operating room</p>
          <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">Dashboard</h1>
        </div>
        <Link href="/projects" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#20201d] px-4 text-sm font-semibold text-white">
          Open projects
        </Link>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={FolderKanban} label="Projects" value={stats.projects} tone="bg-[#e5f1ec] text-[#17614a]" />
        <Metric icon={CircleDot} label="Total tasks" value={stats.totalTasks} tone="bg-[#ecedf8] text-[#3940a0]" />
        <Metric icon={CheckCircle2} label="Completion" value={`${completion}%`} tone="bg-[#fff0c7] text-[#8a5b00]" />
        <Metric icon={AlertTriangle} label="Overdue" value={stats.overdue.length} tone="bg-[#ffe2df] text-[#b2332a]" />
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-xl border border-black/10 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task flow</h2>
            {loading && <span className="text-sm text-[#66736c]">Loading</span>}
          </div>
          <div className="space-y-4">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const width = stats.totalTasks ? Math.max(8, (count / stats.totalTasks) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{statusLabels[status as keyof typeof statusLabels]}</span>
                    <span className="text-[#66736c]">{count}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#f0eee8]">
                    <div className="h-full rounded-full bg-[#2d6cdf]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="mb-5 text-lg font-semibold">Assigned load</h2>
          <div className="space-y-3">
            {stats.byUser.length === 0 && <p className="text-sm text-[#66736c]">No assigned work yet.</p>}
            {stats.byUser.map((user) => (
              <div key={user.userId} className="flex items-center justify-between rounded-lg bg-[#fbfaf7] px-3 py-3">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm text-[#66736c]">{user.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-5 rounded-xl border border-black/10 bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <Clock3 size={18} />
          <h2 className="text-lg font-semibold">Overdue work</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {stats.overdue.length === 0 && <p className="text-sm text-[#66736c]">Nothing overdue. Nice clean runway.</p>}
          {stats.overdue.map((task) => (
            <div key={task.id} className="rounded-lg border border-black/10 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-medium">{task.title}</h3>
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{task.priority}</span>
              </div>
              <p className="text-sm text-[#66736c]">Due {format(new Date(task.due_date), "MMM d, yyyy")} · {task.assignee?.name ?? "Unassigned"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof FolderKanban; label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-[#66736c]">{label}</div>
    </div>
  );
}
