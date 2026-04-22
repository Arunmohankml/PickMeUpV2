import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
 
    // Fetch user's registered phone number
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true }
    });
 
    const clientNumber = fullUser?.phone || "Not given";

    // Calculate road distance via OSRM API
    let distanceKm = 0;
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${data.pickup_lng},${data.pickup_lat};${data.drop_lng},${data.drop_lat}?overview=false`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();
      if (osrmData.routes && osrmData.routes.length > 0) {
        distanceKm = osrmData.routes[0].distance / 1000;
      }
    } catch (e) {
      console.log("OSRM error, falling back to simple distance");
      // Fallback distance calculation can be added here
    }

    const fare = distanceKm > 0 ? Math.round(30 + (distanceKm * 15)) : 50; // Base 30 + 15/km
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await prisma.rideRequest.create({
      data: {
        client_name: user.username,
        client_number: clientNumber,
        client_stand: data.stand || "none",
        pickup_coords: data.pickup,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        drop_coords: data.drop,
        drop_lat: data.drop_lat,
        drop_lng: data.drop_lng,
        ride_distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : "Unknown",
        ride_fare: `₹${fare}`,
        ride_status: "pending",
        otp: randomOtp,
      },
    });

    return NextResponse.json({ status: "ok", rideId: ride.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
