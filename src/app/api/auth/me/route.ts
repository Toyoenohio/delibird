import { NextResponse } from "next/server";
import { getCurrentUserWithSites } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
