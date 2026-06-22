import { NextResponse } from "next/server";
import { getCurrentToken } from "@/src/shared/lib/auth/ephemeralTokens";
import { fetchImports } from "@/src/shared/lib/api/api";

export async function GET(request: Request) {
  const token = request.headers.get("x-dashboard-token");
  if (!token || token !== getCurrentToken()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end params are required" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchImports({ start, end });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error fetching imports" }, { status: 500 });
  }
}
