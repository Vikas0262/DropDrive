/**
 * Generate a unique, URL-safe slug for public file sharing
 * Format: 12-16 character alphanumeric string (base62)
 * Examples: "abc123def456", "xyz9876w5432"
 */
export function generatePublicSlug(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 12; // 12 characters = ~71 billion combinations
  let slug = '';

  for (let i = 0; i < length; i++) {
    slug += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return slug;
}

/**
 * Validates if a slug is in the correct format
 * Must be 8-16 alphanumeric characters
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9]{8,16}$/.test(slug);
}
