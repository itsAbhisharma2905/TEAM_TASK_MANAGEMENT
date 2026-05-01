"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, FolderPlus, LayoutDashboard, Shield, UsersRound } from "lucide-react";
import { api } from "@/lib/api/client";
import { Project } from "@/lib/types";

export function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const data = await api<{ projects: Project[] }>("/api/projects");
    setProjects(data.projects.filter(Boolean));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    setError("");
    setCreating(true);
    const form = new FormData(target);

    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? ""),
        }),
      });
      target.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
      <header className="mb-6 grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-[26px] bg-[#20201d] text-white">
          <div className="grid min-h-[270px] gap-6 p-7 md:grid-cols-[1fr_260px]">
            <div className="flex flex-col justify-between">
              <div>
                <p className="mb-3 text-sm font-medium text-white/60">Project portfolio</p>
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-normal md:text-5xl">A clean room for every moving initiative.</h1>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <PortfolioStat icon={BriefcaseBusiness} label="Projects" value={projects.length} />
                <PortfolioStat icon={LayoutDashboard} label="Tasks" value={projects.reduce((total, project) => total + (project.task_count ?? 0), 0)} />
                <PortfolioStat icon={Shield} label="Admin" value={projects.filter((project) => project.my_role === "admin").length} />
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.07] p-4 md:block">
              <div className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbce6a] text-[#20201d]">
                <FolderPlus size={20} />
              </div>
              <p className="text-sm leading-6 text-white/70">Create a project, invite signed-up teammates, assign work, then track delivery from the dashboard.</p>
            </div>
          </div>
        </div>
        <form onSubmit={createProject} className="rounded-[26px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FolderPlus size={18} />
            <h2 className="font-semibold">Create project</h2>
          </div>
          <input name="name" required minLength={2} placeholder="Project name" className="mb-3 h-11 w-full rounded-xl border border-black/10 bg-[#fbfaf7] px-3 text-sm outline-none focus:border-[#2d6cdf]" />
          <textarea name="description" placeholder="What is this team trying to finish?" className="mb-3 min-h-24 w-full resize-none rounded-xl border border-black/10 bg-[#fbfaf7] p-3 text-sm outline-none focus:border-[#2d6cdf]" />
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={creating} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2d6cdf] text-sm font-semibold text-white disabled:opacity-60">
            {creating ? "Creating..." : "Create project"}
            <ArrowRight size={17} />
          </button>
        </form>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && <p className="text-sm text-[#66736c]">Loading projects...</p>}
        {!loading && projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-black/20 bg-white p-8 text-center md:col-span-2 xl:col-span-3">
            <h2 className="mb-2 text-xl font-semibold">No projects yet</h2>
            <p className="text-sm text-[#66736c]">Create one to invite members and start assigning tasks.</p>
          </div>
        )}
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(32,32,29,0.10)]">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f1ec] text-[#17614a]">
                <UsersRound size={21} />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fbfaf7] px-3 py-1 text-xs font-semibold capitalize text-[#66736c]">
                <Shield size={13} />
                {project.my_role}
              </span>
            </div>
            <h2 className="mb-2 text-xl font-semibold">{project.name}</h2>
            <p className="min-h-11 text-sm leading-6 text-[#66736c]">{project.description || "No description yet."}</p>
            <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 text-sm text-[#66736c]">
              <span>{project.task_count ?? 0} tasks</span>
              <span className="font-medium text-[#20201d] group-hover:text-[#2d6cdf]">Open</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function PortfolioStat({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
      <Icon size={16} className="mb-4 text-white/65" />
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-white/55">{label}</div>
    </div>
  );
}
