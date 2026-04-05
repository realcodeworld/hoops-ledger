import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatSessionName(date: Date | string): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} @ ${hours}:${minutes}`
}

/** E.164: optional +, then 1–15 digits; no spaces or other chars */
const E164_REGEX = /^\+?[0-9]{1,15}$/

export function isValidE164(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  const digitsOnly = phone.replace(/^\s*\+/, '').replace(/\D/g, '')
  const normalized = (phone.trim().startsWith('+') ? '+' : '') + digitsOnly
  return E164_REGEX.test(normalized)
}

export function normalizeToE164(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null
  const trimmed = phone.trim()
  const digitsOnly = trimmed.replace(/\D/g, '')
  if (digitsOnly.length === 0 || digitsOnly.length > 15) return null
  const normalized = '+' + digitsOnly
  return E164_REGEX.test(normalized) ? normalized : null
}

/** Client-only: triggers a JSON file download in the browser. */
export function downloadJsonFile(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}