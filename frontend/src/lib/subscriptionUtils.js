import moment from "moment";
import { PLAN_FEES } from "@/lib/constants";

export { PLAN_FEES };

export const REBATE_MULTIPLIER = 100;

export function isSubscriptionExpired(seller) {
  if (!seller.subscription_end) return false;
  return moment(seller.subscription_end).isBefore(moment().startOf("day"));
}

export function computeTotalSales(sellerId, payments) {
  return payments
    .filter(
      (p) =>
        p.seller_id === sellerId &&
        p.payment_type === "Rent" &&
        p.status === "Completed"
    )
    .reduce((sum, p) => sum + (p.rental_amount || p.amount || 0), 0);
}

export function checkRebateEligibility(seller, totalSales) {
  const fee = seller.subscription_fee || PLAN_FEES[seller.subscription_plan] || 0;
  const threshold = fee * REBATE_MULTIPLIER;
  if (totalSales >= threshold) {
    return { eligible: false, rebate_amount: 0, status: "Not Eligible" };
  }
  return { eligible: true, rebate_amount: fee, status: "Eligible" };
}

export async function processExpiredSubscriptions(sellers, payments) {
  const updates = [];
  for (const seller of sellers) {
    if (isSubscriptionExpired(seller) && seller.status !== "Expired") {
      const totalSales = computeTotalSales(seller.id, payments);
      const rebate = checkRebateEligibility(seller, totalSales);
      updates.push({
        id: seller.id,
        data: {
          status: "Expired",
          total_sales: totalSales,
          rebate_status: rebate.status,
          rebate_amount: rebate.rebate_amount,
        },
      });
    }
  }
  return updates;
}