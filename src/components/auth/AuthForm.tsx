"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, PanelsTopLeft, UserRound } from "lucide-react";
import { api } from "@/lib/api/client";

type Props = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(isSignup ? payload : { email: payload.email, password: payload.password }),
      });

      router.push(searchParams.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#101412] text-[#20201d]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#101412_0%,#1c2925_44%,#38483b_100%)]" />
          <div className="absolute inset-x-14 top-28 h-px bg-white/10" />
          <div className="absolute bottom-28 left-14 right-14 h-px bg-white/10" />
          <div className="absolute bottom-28 top-28 left-14 w-px bg-white/10" />
          <div className="absolute bottom-28 top-28 right-14 w-px bg-white/10" />
          <div className="relative flex min-h-screen flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#101412]">
                <PanelsTopLeft size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Team workspace</p>
                <p className="text-xs text-white/50">Tasks, owners, progress</p>
              </div>
            </div>
            <div>
              <div className="mb-8 max-w-3xl">
                <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/70">Project clarity without the clutter</p>
                <h1 className="max-w-3xl text-6xl font-semibold leading-[0.95] tracking-normal text-white xl:text-7xl">A calmer way to move team work forward.</h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/62">Create focused project rooms, assign accountable owners, and keep progress visible from one clean dashboard.</p>
              </div>
              <div className="grid max-w-3xl grid-cols-3 gap-3">
                {[
                  ["01", "Plan"],
                  ["02", "Assign"],
                  ["03", "Track"],
                ].map(([number, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                    <div className="mb-8 text-sm text-white/45">{number}</div>
                    <div className="text-lg font-semibold text-white">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid max-w-2xl grid-cols-2 gap-3">
              {["Role based control", "Live project focus"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-medium text-white/72">
                  <CheckCircle2 size={17} className="text-[#d8f36a]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <main className="flex min-h-screen items-center justify-center bg-[#f5f2ea] px-5 py-10">
          <form onSubmit={submit} className="w-full max-w-md rounded-[30px] border border-black/10 bg-white p-6 shadow-[0_28px_80px_rgba(16,20,18,0.16)] sm:p-8">
            <div className="mb-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101412] text-white">
                <PanelsTopLeft size={23} />
              </div>
              <p className="mb-2 text-sm font-semibold text-[#66736c]">{isSignup ? "Create account" : "Welcome back"}</p>
              <h2 className="text-4xl font-semibold leading-tight tracking-normal">{isSignup ? "Build your workspace" : "Sign in to continue"}</h2>
            </div>
            <div className="space-y-4">
              {isSignup && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Name</span>
                  <span className="flex h-13 items-center gap-3 rounded-2xl border border-black/10 bg-[#f8f7f2] px-4 focus-within:border-[#4f8cff]">
                    <UserRound size={18} className="text-[#66736c]" />
                    <input name="name" required className="w-full bg-transparent text-sm outline-none" placeholder="Aarav Sharma" />
                  </span>
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Email</span>
                <span className="flex h-13 items-center gap-3 rounded-2xl border border-black/10 bg-[#f8f7f2] px-4 focus-within:border-[#4f8cff]">
                  <Mail size={18} className="text-[#66736c]" />
                  <input name="email" type="email" required className="w-full bg-transparent text-sm outline-none" placeholder="you@company.com" />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Password</span>
                <span className="flex h-13 items-center gap-3 rounded-2xl border border-black/10 bg-[#f8f7f2] px-4 focus-within:border-[#4f8cff]">
                  <LockKeyhole size={18} className="text-[#66736c]" />
                  <input name="password" type="password" required minLength={8} className="w-full bg-transparent text-sm outline-none" placeholder="Minimum 8 characters" />
                </span>
              </label>
            </div>
            {notice && <p className="mt-4 rounded-2xl bg-[#e5f1ec] px-4 py-3 text-sm text-[#17614a]">{notice}</p>}
            {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={loading} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#101412] text-sm font-semibold text-white transition hover:bg-[#26312d] disabled:opacity-60">
              {loading ? "Working..." : isSignup ? "Create account" : "Log in"}
              <ArrowRight size={17} />
            </button>
            <p className="mt-6 text-center text-sm text-[#66736c]">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <Link className="font-semibold text-[#101412]" href={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Log in" : "Create account"}
              </Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
