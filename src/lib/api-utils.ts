import { NextResponse } from "next/server";

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return NextResponse.json({ data, total, page, limit });
}
