import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ride_id, reason } = await req.json();

    const ride = await prisma.rideRequest.findUnique({
      where: { id: parseInt(ride_id) },
      include: { driver: true },
    });

    if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

    if (user.role === "driver" && ride.accepted_by_id !== user.id) {
      return NextResponse.json({ error: "Not your ride" }, { status: 403 });
    }
    if (user.role === "user" && ride.client_name !== user.username) {
      return NextResponse.json({ error: "Not your ride" }, { status: 403 });
    }

    // If driver reached destination
    if (user.role === "driver" && reason === "reached") {
      await prisma.profile.update({
        where: { captain_name: user.username },
        data: { rides_count: { increment: 1 } },
      });

      // Set to completed 
      await prisma.rideRequest.update({
        where: { id: ride.id },
        data: { 
          ride_status: "completed",
          is_active: false
        },
      });

      // Check for next scheduled ride
      const nextScheduled = await prisma.rideRequest.findFirst({
        where: {
          accepted_by_id: user.id,
          ride_status: "scheduled"
        },
        orderBy: { timestamp: "asc" }
      });

      if (nextScheduled) {
        await prisma.rideRequest.update({
          where: { id: nextScheduled.id },
          data: { ride_status: "accepted" }
        });
      }

      return NextResponse.json({ status: "completed", nextRideId: nextScheduled?.id });
    }

    // Otherwise, it's a cancellation - delete immediately
    await prisma.rideRequest.delete({ where: { id: ride.id } });
    return NextResponse.json({ status: "cancelled" });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
