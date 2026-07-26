// app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const AWS_BACKEND_URL = process.env.AWS_BACKEND_URL || "http://localhost:8000";

async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname; // keep "/api/v1/chat/start" intact
  const searchParams = req.nextUrl.search;

  const backendRes = await fetch(`${AWS_BACKEND_URL}${path}${searchParams}`, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Client-ID": req.headers.get("X-Client-ID") || "",
    },
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
  });

  const data = await backendRes.text();
  return new NextResponse(data, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
};