import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ride_id, lat, lng } = await req.json();

    await prisma.rideRequest.update({
      where: { id: parseInt(ride_id) },
      data: {
        driver_lat: lat,
        driver_lng: lng,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
