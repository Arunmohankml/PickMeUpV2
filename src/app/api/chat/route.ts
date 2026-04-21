import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get("rideId");

    if (!rideId) return NextResponse.json({ error: "Missing rideId" }, { status: 400 });

    const messages = await prisma.chatMessage.findMany({
      where: { ride_id: parseInt(rideId) },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ride_id, content } = await req.json();

    if (!ride_id || !content) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const message = await prisma.chatMessage.create({
      data: {
        ride_id: parseInt(ride_id),
        sender: user.username,
        content,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
