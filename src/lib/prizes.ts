export const prizes = [
  { name: "₹500 Cashback", probability: 30 },
  { name: "₹1000 Cashback", probability: 10 },
  { name: "Food Coupon", probability: 20 },
  { name: "Tumbler", probability: 15 },
  { name: "Better Luck Next Time", probability: 25 },
] as const;

export const NO_VOUCHER_PRIZE = "Better Luck Next Time";

const probabilityTotal = prizes.reduce((total, prize) => total + prize.probability, 0);
if (probabilityTotal !== 100) {
  throw new Error(`Prize probabilities must total 100, got ${probabilityTotal}`);
}
