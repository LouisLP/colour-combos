/**
 * Write text to the clipboard, resolving to whether it landed.
 *
 * `writeText` can reject (denied permission, insecure context) or be missing
 * entirely, and a failed copy shows no confirmation rather than throwing into a
 * render (ADR 0007 §4).
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
