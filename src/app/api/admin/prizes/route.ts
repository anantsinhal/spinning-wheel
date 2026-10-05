import { NextResponse } from "next/server";
import { getPrizes, setPrizes, WheelPrize } from "@/lib/prize-store";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  return NextResponse.json(
    { success: true, prizes: getPrizes() },
    { headers: noStoreHeaders }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prizes: newPrizes, adminKey } = body;

    // Admin authentication check
    if (adminKey !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid admin key" },
        { status: 401 }
      );
    }

    if (!Array.isArray(newPrizes) || newPrizes.length < 2) {
      return NextResponse.json(
        { success: false, error: "Wheel must have at least 2 prize segments." },
        { status: 400 }
      );
    }

    const totalProbability = newPrizes.reduce(
      (sum: number, p: WheelPrize) => sum + (Number(p.probability) || 0),
      0
    );

    if (Math.abs(totalProbability - 100) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Total probability must equal 100%. Current total: ${totalProbability.toFixed(1)}%`,
        },
        { status: 400 }
      );
    }

    setPrizes(newPrizes);
    return NextResponse.json(
      { success: true, prizes: getPrizes() },
      { headers: noStoreHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update prizes." },
      { status: 500 }
    );
  }
}
