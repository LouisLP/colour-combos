/**
 * Copy text, resolving to whether it worked. `writeText` can reject or be
 * missing; a failed copy just shows no confirmation (ADR 0007 §4).
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard)
      return false
    await navigator.clipboard.writeText(text)
    return true
  }
  catch {
    return false
  }
}
