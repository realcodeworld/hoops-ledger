import { randomBytes } from 'crypto'

/** Alphanumeric without ambiguous 0/O/1/I for bank payment references. */
const PAYMENT_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Unique code players use as the bank transfer reference (e.g. HPL-K7X2M9P4). Server-only. */
export function generatePlayerPaymentRef(): string {
  const bytes = randomBytes(10)
  let suffix = ''
  for (let i = 0; i < 10; i++) {
    suffix += PAYMENT_REF_ALPHABET[bytes[i]! % PAYMENT_REF_ALPHABET.length]
  }
  return `HPL-${suffix}`
}
