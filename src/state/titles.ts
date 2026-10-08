/**
 * `title`, or the first variant of it not in `taken`, so library cards can be
 * told apart: "Ode to Joy (copy)", "Ode to Joy (copy 2)" for copies, and
 * "Untitled score 2" for new scores.
 */
export function uniqueTitle(title: string, taken: Iterable<string>, style: 'copy' | 'number'): string {
  const used = new Set(taken)
  const name = title.trim() || 'Untitled score'
  if (!used.has(name)) return name
  // Copying a copy counts up from the original rather than stacking suffixes.
  const base = style === 'copy' ? name.replace(/ \(copy(?: \d+)?\)$/, '') : name
  for (let n = 1; ; n++) {
    const candidate = style === 'copy' ? `${base} (copy${n > 1 ? ` ${n}` : ''})` : `${base} ${n + 1}`
    if (!used.has(candidate)) return candidate
  }
}
