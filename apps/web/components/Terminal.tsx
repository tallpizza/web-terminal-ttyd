'use client';
import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { createWS } from '../lib/wsClient';

interface Props { onReady?: (term: Terminal) => void; }

export default function TerminalView({ onReady }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const fitAddon = useRef(new FitAddon());

  useEffect(() => {
    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      scrollback: 5000,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 14,
      allowProposedApi: true,
    });
    term.loadAddon(fitAddon.current);
    term.open(container.current!);
    fitAddon.current.fit();
    term.focus();
    onReady?.(term);

    const socket = createWS(term, fitAddon.current);

    return () => {
      socket.close();
      term.dispose();
    };
  }, [onReady]);

  return <div ref={container} className="h-full w-full" />;
}
