import { useEffect, useRef } from 'react'
import { CloseIcon } from './Icons'

interface Group {
  title: string
  items: [string[], string][]
}

/** Two columns on wide screens: writing and listening on the left, fixing a note on the right. */
const COLUMNS: Group[][] = [
  [
    {
      title: 'Writing',
      items: [
        [['A', '–', 'G'], 'Write a note in the blue box, in the nearest octave'],
        [['R'], 'Write a rest in the blue box'],
        [['Shift', 'A', '–', 'G'], 'Add a note above to the selected note, making a chord'],
        [['Click'], 'Write a note there. On a notehead it selects that note; above or below one it adds to the chord'],
        [['1', '–', '5'], 'Value of the next note: whole to sixteenth (changes a note you clicked)'],
        [['.'], 'Dotted value'],
        [['W'], 'Write tool: clicks write notes'],
        [['S'], 'Select tool: clicks only pick notes. S again goes back to writing'],
      ],
    },
    {
      title: 'Playback',
      items: [
        [['Space'], 'Play from the orange line / pause (playing again resumes)'],
        [['Shift', 'Space'], 'Move the orange line back to the beginning and play'],
        [['Home'], 'Move the orange line back to the beginning'],
      ],
    },
  ],
  [
    {
      title: 'Selected note',
      items: [
        [['+'], 'Sharpen'],
        [['−'], 'Flatten'],
        [['N'], 'Natural'],
        [['↑', '↓'], 'Move a step'],
        [['Shift', '↑ ↓'], 'Move an octave'],
        [['Alt', '↑ ↓'], 'In a chord, pick the note above / below'],
        [['T'], 'Tie to the next note'],
        [['Del'], 'Turn into a rest (in a chord, remove the picked note)'],
        [['←', '→'], 'Select the previous / next note'],
        [['Esc'], 'Clear the selection'],
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
  ],
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
        <div className="shortcut-columns">
          {COLUMNS.map((groups) => (
            <div key={groups[0].title}>
              {groups.map((group) => (
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
            </div>
          ))}
        </div>
        <p className="muted shortcut-note">
          Value keys set the value of the next note you write; after clicking a note they change that note instead.
          While you type, a blue box shows where the next note goes: after the note you just wrote, or into a selected
          rest. The orange line is where playback starts. Drag it, or pick a note with the Select tool to move it there.
        </p>
      </div>
    </dialog>
  )
}
