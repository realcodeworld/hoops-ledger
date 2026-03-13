/**
 * Shared formatting utilities for consistent display across the app.
 */

/**
 * Returns the currency symbol for a given currency code.
 * @param currency - ISO 4217 currency code (e.g., 'GBP', 'USD')
 * @returns The currency symbol or the code itself if unknown
 */
export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'GBP': return '£'
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'AUD': return 'A$'
    default: return currency
  }
}

/**
 * Returns Tailwind classes for category badge styling based on the category name.
 * @param categoryName - The pricing category name
 * @returns Tailwind class string for badge styling
 */
export function getCategoryBadgeClass(categoryName: string): string {
  const lowerName = categoryName.toLowerCase()
  if (lowerName.includes('student')) return 'bg-purple-100 text-purple-800'
  if (lowerName.includes('standard')) return 'bg-orange-100 text-orange-800'
  if (lowerName.includes('guest')) return 'bg-yellow-100 text-yellow-800'
  if (lowerName.includes('junior') || lowerName.includes('u17') || lowerName.includes('u18')) {
    return 'bg-blue-100 text-blue-800'
  }
  return 'bg-gray-100 text-gray-800'
}

/**
 * Formats a price in pence to a display string.
 * @param pence - Amount in pence/cents
 * @param currency - Optional currency code for symbol
 * @returns Formatted price string (e.g., "£5.00")
 */
export function formatPrice(pence: number, currency?: string): string {
  const amount = (pence / 100).toFixed(2)
  return currency ? `${getCurrencySymbol(currency)}${amount}` : amount
}
