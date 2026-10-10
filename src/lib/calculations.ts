/**
 * Calculates the total job amount in integer paise.
 * 
 * @param billingMethod - 'area' (Bigha/Acre) or 'hourly' or 'fixed'
 * @param quantity - The number of Bigha, Acres, or Hours worked
 * @param ratePaise - The rate per unit in paise (e.g., ₹800 = 80000 paise)
 * @param additionalChargesPaise - Extra costs (transport, etc.) in paise
 * @param discountPaise - Discount given in paise
 */
export function calculateJobTotal(
  billingMethod: "area" | "hourly" | "fixed",
  quantity: number,
  ratePaise: number,
  additionalChargesPaise: number = 0,
  discountPaise: number = 0
): number {
  let baseAmount = 0;

  if (billingMethod === "fixed") {
    baseAmount = ratePaise;
  } else {
    // Area or Hourly
    baseAmount = quantity * ratePaise;
  }

  const total = baseAmount + additionalChargesPaise - discountPaise;
  
  // Ensure we don't return negative values
  return Math.max(0, Math.round(total));
}

/**
 * Formats paise to a readable INR string (e.g., 125050 -> "₹1,250.50")
 */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}