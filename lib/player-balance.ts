/**
 * Single-bucket balance: session fees (recorded in attendance) + opening carried forward − payments.
 */
export function computeNetBalancePence(params: {
  totalSessionFeesPence: number
  openingBalancePence: number
  totalPaidPence: number
}) {
  const { totalSessionFeesPence, openingBalancePence, totalPaidPence } = params
  const totalLiability = totalSessionFeesPence + openingBalancePence
  const net = totalLiability - totalPaidPence
  const amountDue = Math.max(0, net)
  const credit = Math.max(0, -net)
  return {
    totalLiability,
    totalSessionFeesPence,
    openingBalancePence,
    totalPaidPence,
    net,
    amountDue,
    credit,
  }
}
