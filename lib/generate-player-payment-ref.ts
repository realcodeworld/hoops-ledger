import { randomBytes } from 'crypto'

/** Alphanumeric without ambiguous 0/O/1/I for the short suffix. */
const PAYMENT_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const SUFFIX_LEN = 4
const NAME_MAX_LEN = 28

/**
 * Normalise player name for use in a bank reference (readable, widely accepted characters).
 */
export function sanitizePlayerNameForPaymentRef(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\r\n·•]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} \-'\u2019]/gu, '')
    .trim()
    .slice(0, NAME_MAX_LEN)

  return cleaned.length > 0 ? cleaned : 'Player'
}

function randomSuffix(length: number): string {
  const bytes = randomBytes(length)
  let s = ''
  for (let i = 0; i < length; i++) {
    s += PAYMENT_REF_ALPHABET[bytes[i]! % PAYMENT_REF_ALPHABET.length]
  }
  return s
}

/**
 * Human-friendly payment reference: "Jane Smith · K8M2" (name + short unique suffix).
 * Server-only. Uniqueness is enforced by DB + retry with a new suffix on collision.
 */
export function generatePlayerPaymentRef(playerName: string): string {
  const label = sanitizePlayerNameForPaymentRef(playerName)
  const suffix = randomSuffix(SUFFIX_LEN)
  return `${label} · ${suffix}`
}
