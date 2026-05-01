"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, FolderKanban, LogOut, Plus, Sparkles } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api/client";
import { Profile } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api<{ profile: Profile | null }>("/api/auth/me")
        .then((data) => setProfile(data.profile))
        .catch(() => setProfile(null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#20201d]">
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-[#fbfaf7]/95 px-3 py-2 backdrop-blur md:inset-x-auto md:bottom-auto md:left-0 md:top-0 md:flex md:h-screen md:w-[92px] md:flex-col md:border-r md:border-t-0 md:px-4 md:py-5">
        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#20201d] text-white shadow-[0_14px_35px_rgba(32,32,29,0.22)] md:flex">
          <Sparkles size={20} />
        </div>
        <nav className="flex justify-around gap-2 md:mt-8 md:flex-col md:justify-start">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={clsx(
                  "flex h-12 min-w-16 items-center justify-center rounded-2xl transition md:min-w-0",
                  active ? "bg-[#20201d] text-white shadow-[0_12px_28px_rgba(32,32,29,0.18)]" : "text-[#66736c] hover:bg-black/5 hover:text-[#20201d]",
                )}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden flex-col gap-3 md:flex">
          <div title={profile ? `${profile.name} · ${profile.email}` : "Signed in"} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f1ec] text-sm font-bold text-[#17614a]">
            {initials(profile?.name)}
          </div>
          <button onClick={logout} title="Log out" className="flex h-12 items-center justify-center rounded-2xl text-[#66736c] transition hover:bg-black/5 hover:text-[#20201d]">
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-[#f5f2ea]/90 px-5 py-3 backdrop-blur md:ml-[92px] md:px-8">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#66736c]">Signed in</p>
            <p className="text-sm font-semibold">{profile?.name ?? "Loading profile"}</p>
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20201d] text-sm font-bold text-white">
              {initials(profile?.name)}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold">{profile?.name ?? "Signed-in user"}</p>
              <p className="truncate text-xs text-[#66736c]">{profile?.email ?? ""}</p>
            </div>
            <button onClick={logout} title="Log out" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#66736c] hover:bg-[#f5f2ea] hover:text-[#20201d] md:hidden">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="pb-20 md:ml-[92px] md:pb-0">{children}</main>
      <Link href="/projects" className="fixed bottom-20 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d6cdf] text-white shadow-xl md:hidden">
        <Plus size={20} />
      </Link>
    </div>
  );
}

function initials(name?: string) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
