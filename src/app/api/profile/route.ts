import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stand = searchParams.get("stand");

    const profiles = await prisma.profile.findMany({
      where: stand ? { captain_stand: stand } : undefined,
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching profiles" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const updatedProfile = await prisma.profile.update({
      where: { captain_name: user.username },
      data: {
        captain_number: data.captain_number || undefined,
        captain_auto: data.captain_auto || undefined,
        captain_stand: data.captain_stand || undefined,
        captain_bio: data.captain_bio || undefined,
        captain_aadhar: data.captain_aadhar || undefined,
        captain_image: data.captain_image || undefined,
        captain_verified: true,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Profile update error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
