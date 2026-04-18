// Shared cancellation / reschedule policy — the canonical decisions live in
// public.get_booking_policy SQL. These helpers exist only to render preview
// messaging; final amounts come from the server-authoritative RPC response.

export type PolicySnapshot = {
  hoursUntilShoot: number;
  cancelRefundPercent: 0 | 50 | 100;
  cancelRefundCents: number;
  canCancel: boolean;
  rescheduleFeePercent: -1 | 0 | 50;
  rescheduleFeeCents: number;
  canRescheduleFree: boolean;
  canReschedulePaid: boolean;
  totalCents: number;
};

// UI copy for each policy bucket — keep concise and unambiguous.
export const CANCEL_POLICY_COPY: Record<number, string> = {
  100: '100% refund — more than 48 hours before the shoot.',
  50: '50% refund — between 24 and 48 hours before the shoot.',
  0: 'No refund — within 24 hours of the shoot.',
};

export const RESCHEDULE_POLICY_COPY: Record<number, string> = {
  0: 'Free reschedule — more than 48 hours before the shoot.',
  50: '50% fee to reschedule — between 24 and 48 hours before the shoot.',
  [-1]: 'Rescheduling is not possible within 24 hours of the shoot.',
};

export function formatRefundMessage(refundCents: number): string {
  const dollars = (refundCents / 100).toFixed(2);
  return `$${dollars} will be returned to the original payment method within 5–10 business days.`;
}
