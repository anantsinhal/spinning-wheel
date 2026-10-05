export type WheelPrize = {
  id: string;
  name: string;
  probability: number;
  color: string;
  gradientId: string;
  icon: string;
  labelLine1: string;
  labelLine2: string;
};

export const defaultPrizes: WheelPrize[] = [
  {
    id: "1",
    name: "₹500 Cashback",
    probability: 30,
    color: "#EF4D3F",
    gradientId: "grad-coral",
    icon: "coins",
    labelLine1: "₹500",
    labelLine2: "CASHBACK",
  },
  {
    id: "2",
    name: "₹1000 Cashback",
    probability: 10,
    color: "#3767D6",
    gradientId: "grad-blue",
    icon: "rupee",
    labelLine1: "₹1000",
    labelLine2: "CASHBACK",
  },
  {
    id: "3",
    name: "Food Coupon",
    probability: 20,
    color: "#F8C84B",
    gradientId: "grad-yellow",
    icon: "food",
    labelLine1: "FOOD",
    labelLine2: "COUPON",
  },
  {
    id: "4",
    name: "Tumbler",
    probability: 15,
    color: "#2A9D8F",
    gradientId: "grad-teal",
    icon: "tumbler",
    labelLine1: "TUMBLER",
    labelLine2: "",
  },
  {
    id: "5",
    name: "Better Luck Next Time",
    probability: 25,
    color: "#F58A3B",
    gradientId: "grad-orange",
    icon: "star",
    labelLine1: "BETTER LUCK",
    labelLine2: "NEXT TIME",
  },
];

// Global in-memory storage for wheel components & prizes
let currentPrizes: WheelPrize[] = [...defaultPrizes];

export function getPrizes(): WheelPrize[] {
  return currentPrizes;
}

export function setPrizes(newPrizes: WheelPrize[]): void {
  currentPrizes = newPrizes.map((p) => ({
    ...p,
    probability: Number(p.probability) || 0,
  }));
}
