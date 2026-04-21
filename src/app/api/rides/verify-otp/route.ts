import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ride_id, otp } = await req.json();
    const ride = await prisma.rideRequest.findUnique({ where: { id: parseInt(ride_id) } });

    if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    if (ride.otp !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

    await prisma.rideRequest.update({
      where: { id: ride.id },
      data: { ride_status: "in_progress" },
    });

    return NextResponse.json({ status: "in_progress" });
  } catch (error) {
    console.error("OTP error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
