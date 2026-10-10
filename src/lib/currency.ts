/**
 * Converts paise (integer) to a formatted Indian Rupee string.
 * Example: 125050 -> "₹1,250.50"
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Converts a rupee string or number to integer paise.
 * Example: "1250.50" or 1250.5 -> 125050
 */
export function toPaise(amount: number | string): number {
  const numeric = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  return Math.round(numeric * 100);
}