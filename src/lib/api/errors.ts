import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, error.status);
  }

  if (error instanceof ZodError) {
    return json({ error: "Invalid request", details: error.flatten() }, 422);
  }

  return json({ error: "Something went wrong" }, 500);
}
