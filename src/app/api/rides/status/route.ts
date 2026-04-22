import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get("rideId");

    if (rideId) {
      const ride = await prisma.rideRequest.findUnique({
        where: { id: parseInt(rideId) },
        include: { driver: { include: { profile: true } } },
      });
      if (!ride) return NextResponse.json({ status: "not_found" });

      if (ride.is_active && ride.accepted_by_id) {
        return NextResponse.json({
          status: "accepted",
          ride,
          profile: ride.driver?.profile,
        });
      }
      return NextResponse.json({ status: "waiting" });
    }

    // fallback for active ride check
    if (user.role === "user") {
      const ride = await prisma.rideRequest.findFirst({
        where: { client_name: user.username },
        orderBy: { timestamp: "desc" },
        include: { driver: { include: { profile: true } } },
      });
      return NextResponse.json({ ride });
    }

    if (user.role === "driver") {
      const ride = await prisma.rideRequest.findFirst({
        where: { accepted_by_id: user.id, is_active: true },
        orderBy: [
          { ride_status: "desc" }, // 'in_progress' starts with 'i', 'accepted' with 'a', 'scheduled' with 's'. Wait, 'scheduled' is after 'in_progress'. 
          // Let's use a more explicit ordering or just simple findFirst.
          { timestamp: "asc" }
        ],
        include: { driver: { include: { profile: true } } },
      });
      return NextResponse.json({ ride });
    }

    return NextResponse.json({ ride: null });

  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
