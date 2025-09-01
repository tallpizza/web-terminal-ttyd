import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

export function createWS(term: Terminal, fit: FitAddon) {
  const url = (typeof location !== 'undefined') ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws/term` : '';
  let retries = 0;

  function connect() {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      retries = 0;
      const cols = term.cols;
      const rows = term.rows;
      ws.send(JSON.stringify({
        host: process.env.NEXT_PUBLIC_SSH_HOST,
        port: Number(process.env.NEXT_PUBLIC_SSH_PORT || 22),
        user: process.env.NEXT_PUBLIC_SSH_USER,
        shell: 'zsh -l',
        tmuxAttach: true,
        tmuxSession: 'dev',
        cols,
        rows,
      }));
      term.onData(d => ws.send(d));
      ws.onmessage = e => term.write(e.data);
    };
    ws.onclose = () => {
      const timeout = Math.min(1000 * 2 ** retries, 16000);
      retries++;
      setTimeout(connect, timeout);
    };
    return ws;
  }

  const socket = connect();
  window.addEventListener('resize', () => {
    fit.fit();
    socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
  });
  return socket;
}
