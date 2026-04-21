import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ride_id, stars, feedback, captain_name } = await req.json();

    if (!ride_id || !stars || !captain_name) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Save the individual rating
    await prisma.rating.create({
      data: {
        captain_name,
        client_name: user.username,
        stars: parseInt(stars),
        feedback: feedback || "",
      },
    });

    // Recalculate average rating for the captain
    const allRatings = await prisma.rating.findMany({
      where: { captain_name },
    });

    const average = allRatings.reduce((acc, curr) => acc + curr.stars, 0) / allRatings.length;

    await prisma.profile.update({
      where: { captain_name },
      data: { captain_rating: average },
    });

    // Finally delete the ride request
    await prisma.rideRequest.delete({
      where: { id: parseInt(ride_id) },
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
