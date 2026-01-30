import { NextResponse } from "next/server";

export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
