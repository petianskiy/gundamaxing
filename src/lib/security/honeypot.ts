const HONEYPOT_FIELD_NAMES = [
  "website_url_confirm",
  "phone_verify",
  "address_confirm",
  "fax_number",
  "company_url",
] as const;

export type HoneypotFieldName = (typeof HONEYPOT_FIELD_NAMES)[number];

/**
 * Returns a random honeypot field name from the predefined list.
 * These are realistic-sounding field names designed to attract bot auto-fill.
 */
export function generateHoneypotFieldName(): string {
  const index = Math.floor(Math.random() * HONEYPOT_FIELD_NAMES.length);
  return HONEYPOT_FIELD_NAMES[index];
}

/**
 * Validates that none of the known honeypot fields have been filled in.
 * Returns `true` if the form submission is likely from a human (all honeypot fields empty).
 * Returns `false` if any honeypot field has a value (likely a bot).
 */
export function validateHoneypot(formData: FormData): boolean {
  for (const fieldName of HONEYPOT_FIELD_NAMES) {
    const value = formData.get(fieldName);
    if (value && String(value).trim().length > 0) {
      return false;
    }
  }
  return true;
}
