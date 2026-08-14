/**
 * Zero-dependency UUIDv7 Generator & Parser
 * RFC 9562 compliant: Encodes 48-bit Unix millisecond epoch in the top bits
 * for natural, chronological B-Tree sorting and embedded creation moments.
 */

export const uuidv7 = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  const msecs = Date.now()

  // 48-bit timestamp in big-endian order
  bytes[0] = (msecs / 0x10000000000) & 0xff
  bytes[1] = (msecs / 0x100000000) & 0xff
  bytes[2] = (msecs / 0x1000000) & 0xff
  bytes[3] = (msecs / 0x10000) & 0xff
  bytes[4] = (msecs / 0x100) & 0xff
  bytes[5] = msecs & 0xff

  // Version 7: set bits 4-7 of byte 6 to 0111 (0x70)
  bytes[6] = (bytes[6] & 0x0f) | 0x70

  // Variant RFC 4122 / 9562: set bits 6-7 of byte 8 to 10 (0x80)
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Convert to formatted hex UUID string (8-4-4-4-12)
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Extracts the original creation timestamp Date from any valid UUIDv7
 */
export const extractDateFromUUIDv7 = (uuid: string): Date | null => {
  try {
    const clean = uuid.replace(/-/g, '')
    if (clean.length !== 32) return null
    const timeHex = clean.slice(0, 12)
    const msecs = parseInt(timeHex, 16)
    return new Date(msecs)
  } catch {
    return null
  }
}
