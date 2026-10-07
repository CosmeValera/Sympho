import { useEffect, useRef } from 'react'
import { CloseIcon } from './Icons'

const SHORTCUTS: [string[], string][] = [
  [['Click'], 'Place a note at that pitch, or select the note under the cursor'],
  [['A', '–', 'G'], 'Add a note after the selection, in the nearest octave'],
  [['R'], 'Add a rest after the selection'],
  [['1', '–', '5'], 'Whole, half, quarter, eighth, sixteenth'],
  [['↑', '↓'], 'Move the selected note a step'],
  [['Shift', '↑ ↓'], 'Move it an octave'],
  [['←', '→'], 'Select the previous / next note'],
  [['+'], 'Sharpen'],
  [['−'], 'Flatten'],
  [['N'], 'Natural'],
  [['.'], 'Dot'],
  [['T'], 'Tie to the next note'],
  [['Del'], 'Turn the selected note into a rest'],
  [['Space'], 'Play from the selection / stop'],
  [['Esc'], 'Clear the selection'],
  [['Ctrl', 'Z'], 'Undo'],
  [['Ctrl', 'Y'], 'Redo'],
]

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="shortcuts-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dialog-body">
        <header className="dialog-header">
          <h2 id="shortcuts-title">Keyboard shortcuts</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <dl className="shortcut-list">
          {SHORTCUTS.map(([keys, action]) => (
            <div key={action} className="shortcut">
              <dt>
                {keys.map((k) => (k === '–' ? <span key={k}>–</span> : <kbd key={k}>{k}</kbd>))}
              </dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </dialog>
  )
}
