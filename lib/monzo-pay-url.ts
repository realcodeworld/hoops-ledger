/**
 * Builds a Monzo.me request URL: `{base}/{amount}?d={reference}`
 * Amount is GBP with two decimal places; `d` is the payment reference (Monzo description field).
 *
 * @param baseUrl - Profile link from settings, e.g. `https://monzo.me/yourusername` (no amount in path)
 */
export function buildMonzoPaymentUrl(
  baseUrl: string | null | undefined,
  amountPence: number,
  paymentRef: string
): string | null {
  const trimmed = baseUrl?.trim()
  if (!trimmed) return null

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') return null

  const amountPounds = (Math.max(0, amountPence) / 100).toFixed(2)
  const pathBase = parsed.pathname.replace(/\/$/, '') || ''
  parsed.pathname = `${pathBase}/${amountPounds}`
  parsed.search = ''
  parsed.hash = ''
  parsed.searchParams.set('d', paymentRef)

  return parsed.toString()
}
