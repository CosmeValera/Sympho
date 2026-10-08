import { useEffect, useRef } from 'react'
import { CloseIcon } from './Icons'

const GROUPS: { title: string; items: [string[], string][] }[] = [
  {
    title: 'Writing',
    items: [
      [['Click'], 'Write a note (or rest) there; clicking on a note selects it'],
      [['A', '–', 'G'], 'Add a note after the selection, in the nearest octave'],
      [['R'], 'Add a rest after the selection'],
      [['1', '–', '5'], 'Whole, half, quarter, eighth, sixteenth'],
      [['W'], 'Notes tool: clicks write notes'],
      [['Shift', 'R'], 'Rests tool: clicks write rests'],
      [['S'], 'Select tool: clicks only pick notes (press again to go back)'],
    ],
  },
  {
    title: 'Selected note',
    items: [
      [['+'], 'Sharpen'],
      [['−'], 'Flatten'],
      [['N'], 'Natural'],
      [['↑', '↓'], 'Move a step'],
      [['Shift', '↑ ↓'], 'Move an octave'],
      [['.'], 'Dot'],
      [['T'], 'Tie to the next note'],
      [['Del'], 'Turn into a rest'],
      [['←', '→'], 'Select the previous / next note'],
      [['Esc'], 'Clear the selection'],
    ],
  },
  {
    title: 'Playback',
    items: [
      [['Space'], 'Play from the marker / pause (playing again resumes)'],
      [['Shift', 'Space'], 'Play from the beginning, leaving the marker where it is'],
      [['Home'], 'Move the marker back to the beginning'],
    ],
  },
  {
    title: 'General',
    items: [
      [['Ctrl', 'Z'], 'Undo'],
      [['Ctrl', 'Y'], 'Redo'],
      [['?'], 'This list'],
    ],
  },
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
        {GROUPS.map((group) => (
          <section key={group.title} className="shortcut-group">
            <h3>{group.title}</h3>
            <dl className="shortcut-list">
              {group.items.map(([keys, action]) => (
                <div key={action} className="shortcut">
                  <dt>
                    {keys.map((k) => (k === '–' ? <span key={k}>–</span> : <kbd key={k}>{k}</kbd>))}
                  </dt>
                  <dd>{action}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="muted shortcut-note">
          The orange marker is where playback starts. Drag it, or select a note to move it there.
        </p>
      </div>
    </dialog>
  )
}
