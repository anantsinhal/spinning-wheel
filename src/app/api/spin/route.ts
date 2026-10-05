import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getPrizes } from "@/lib/prize-store";

export const dynamic = "force-dynamic";

async function selectPrize() {
  const prizes = await getPrizes();

  if (!prizes.length) {
    throw new Error("No prizes are configured.");
  }

  let draw: number;
  try {
    draw = randomInt(0, 10_000) / 100;
  } catch {
    draw = Math.random() * 100;
  }

  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += Number(prize.probability) || 0;
    if (draw < cumulativeProbability) return prize.name;
  }

  return prizes[prizes.length - 1].name;
}

export async function POST() {
  try {
    const result = await selectPrize();
    return NextResponse.json({ success: true, result, hasVoucher: false });
  } catch (error) {
    console.error("Spin failed", error);
    return NextResponse.json(
      { success: false, error: "We could not complete your spin. Please try again." },
      { status: 500 }
    );
  }
}
