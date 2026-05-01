import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(90),
  description: z.string().trim().max(500).default(""),
});

export const memberSchema = z.object({
  email: z.string().trim().email().max(180),
  role: z.enum(["admin", "member"]).default("member"),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1200).default(""),
  dueDate: z.string().date(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  assignedTo: z.string().uuid(),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});
