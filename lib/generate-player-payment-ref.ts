import { randomBytes } from 'crypto'

/** Alphanumeric without ambiguous 0/O/1/I for the short suffix. */
const PAYMENT_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const SUFFIX_LEN = 4
/** Max length of the name segment (UK bank refs are often ≤18 chars total; suffix + hyphen use 5). */
const NAME_SEGMENT_MAX = 12

function randomSuffix(length: number): string {
  const bytes = randomBytes(length)
  let s = ''
  for (let i = 0; i < length; i++) {
    s += PAYMENT_REF_ALPHABET[bytes[i]! % PAYMENT_REF_ALPHABET.length]
  }
  return s
}

/**
 * Normalise player name for the bank reference: A–Z and 0–9 only, no spaces,
 * easy to type on a phone keypad.
 */
function normalizeNameSegment(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\r\n·•]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} \-'\u2019]/gu, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, NAME_SEGMENT_MAX)

  return cleaned.length > 0 ? cleaned : 'PLAYER'
}

/**
 * Bank reference: `NAMEPART-SUFFIX` (e.g. `JANESMITH-K8M2`).
 * Hyphen separator only; alphanumeric. Uniqueness is enforced by DB + retry on collision.
 */
export function generatePlayerPaymentRef(playerName: string): string {
  const segment = normalizeNameSegment(playerName)
  const suffix = randomSuffix(SUFFIX_LEN)
  return `${segment}-${suffix}`
}
