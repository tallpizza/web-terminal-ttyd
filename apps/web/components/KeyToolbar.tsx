'use client';
import { useState } from 'react';
import { Terminal } from 'xterm';

interface Props { term: Terminal | null }

const keys = [
  { label: 'Ctrl', value: 'Ctrl', toggle: true },
  { label: 'Alt', value: 'Alt', toggle: true },
  { label: 'Esc', seq: '\u001b' },
  { label: 'Tab', seq: '\t' },
  { label: 'Up', seq: '\u001b[A' },
  { label: 'Down', seq: '\u001b[B' },
];

export default function KeyToolbar({ term }: Props) {
  const [lock, setLock] = useState<{[k:string]: boolean}>({});

  function send(key: any) {
    if (!term) return;
    if (key.toggle) {
      setLock(l => ({ ...l, [key.value]: !l[key.value] }));
    } else {
      term.write(key.seq);
    }
  }

  return (
    <div className="flex gap-2 p-2 bg-gray-800 text-white text-sm">
      {keys.map(k => (
        <button key={k.label} onClick={() => send(k)} className={`px-2 py-1 rounded ${lock[k.value] ? 'bg-blue-600' : 'bg-gray-600'}`}>
          {k.label}
        </button>
      ))}
    </div>
  );
}
