import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ user: null });
  
  if (user.role === "driver") {
    const profile = await prisma.profile.findUnique({ where: { captain_name: user.username } });
    return NextResponse.json({ user: { ...user, profile } });
  }

  return NextResponse.json({ user });
}
