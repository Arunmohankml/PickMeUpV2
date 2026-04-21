import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rides = await prisma.rideRequest.findMany({
      where: { is_active: false },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ rides });
  } catch (error) {
    console.error("Fetch rides error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
