import { NextResponse } from "next/server";
import { fetchMetaRows } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const expectedToken = process.env.DASHBOARD_REFRESH_TOKEN;
  if (expectedToken) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Set DASHBOARD_REFRESH_TOKEN to enable the live refresh endpoint.",
      },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const since = url.searchParams.get("since") ?? "";
  const until = url.searchParams.get("until") ?? "";
  const level = url.searchParams.get("level") === "ad" ? "ad" : "campaign";

  if (!DATE_PATTERN.test(since) || !DATE_PATTERN.test(until) || since > until) {
    return NextResponse.json(
      { error: "Provide valid since/until dates in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  try {
    const rows = await fetchMetaRows({ since, until, level });
    return NextResponse.json(
      { rows, count: rows.length, since, until, level },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not configured") ? 501 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
