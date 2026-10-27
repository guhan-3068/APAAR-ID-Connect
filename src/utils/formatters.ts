/**
 * Format 12-digit APAAR ID into readable 4-4-4 chunk format
 * Example: 123456789012 -> 1234-5678-9012
 */
export function formatApaarId(apaarId: string): string {
  const cleaned = apaarId.replace(/\D/g, '').slice(0, 12)
  const parts = cleaned.match(/.{1,4}/g)
  return parts ? parts.join('-') : cleaned
}

/**
 * Validate standard 12-digit APAAR ID format
 */
export function isValidApaarId(apaarId: string): boolean {
  const cleaned = apaarId.replace(/\D/g, '')
  return cleaned.length === 12
}

/**
 * Capitalize string
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
