import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ride_id } = await req.json();
    const ride = await prisma.rideRequest.findUnique({ where: { id: parseInt(ride_id) } });

    if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    if (ride.is_active) return NextResponse.json({ error: "Ride already accepted" }, { status: 400 });

    // Check if driver has an existing active ride (accepted or in_progress)
    const activeRide = await prisma.rideRequest.findFirst({
      where: {
        accepted_by_id: user.id,
        is_active: true,
        ride_status: { in: ["accepted", "in_progress"] }
      }
    });

    const newStatus = activeRide ? "scheduled" : "accepted";

    await prisma.rideRequest.update({
      where: { id: ride.id },
      data: {
        is_active: true,
        accepted_by_id: user.id,
        ride_status: newStatus,
      },
    });

    return NextResponse.json({ status: newStatus, rideId: ride.id });
  } catch (error) {
    console.error("Accept error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
