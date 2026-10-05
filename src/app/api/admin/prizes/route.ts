import { NextResponse } from "next/server";
import { getPrizes, setPrizes, WheelPrize } from "@/lib/prize-store";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
};

function isValidAdminKey(key: unknown) {
  const configured = process.env.ADMIN_PASSWORD;
  // Keep the current password working locally if no env var is configured.
  return key === (configured || "admin");
}

export async function GET() {
  try {
    return NextResponse.json(
      { success: true, prizes: await getPrizes() },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("Failed to load prizes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load wheel offers." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prizes: newPrizes, adminKey } = body;

    if (!isValidAdminKey(adminKey)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid admin password" },
        { status: 401, headers: noStoreHeaders }
      );
    }

    if (!Array.isArray(newPrizes) || newPrizes.length < 2) {
      return NextResponse.json(
        { success: false, error: "Wheel must have at least 2 prize segments." },
        { status: 400, headers: noStoreHeaders }
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
        { status: 400, headers: noStoreHeaders }
      );
    }

    const saved = await setPrizes(newPrizes);

    return NextResponse.json(
      { success: true, prizes: saved },
      { headers: noStoreHeaders }
    );
  } catch (err) {
    console.error("Failed to update prizes:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update prizes.",
      },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
