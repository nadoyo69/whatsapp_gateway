import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });
  }
  return socket;
}

export function joinSessionRoom(sessionId) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join-session', sessionId);
  } else {
    s.once('connect', () => {
      s.emit('join-session', sessionId);
    });
  }
}

export function leaveSessionRoom(sessionId) {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave-session', sessionId);
  }
}
