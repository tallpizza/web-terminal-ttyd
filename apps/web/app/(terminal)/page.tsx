'use client';
import { useState } from 'react';
import TerminalView from '../../components/Terminal';
import KeyToolbar from '../../components/KeyToolbar';
import UploadArea from '../../components/UploadArea';
import { Terminal } from 'xterm';

export default function Page() {
  const [term, setTerm] = useState<Terminal | null>(null);
  return (
    <div className="h-full flex flex-col">
      <KeyToolbar term={term} />
      <TerminalView onReady={setTerm} />
      <UploadArea />
    </div>
  );
}
