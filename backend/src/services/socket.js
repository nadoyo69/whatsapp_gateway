let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join-session', (sessionId) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
        // console.log(`[Socket.IO] Client ${socket.id} joined room session:${sessionId}`);
      }
    });

    socket.on('leave-session', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToSession(sessionId, event, data) {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
    io.emit(`global:${event}`, { sessionId, ...data });
  }
}

function emitGlobal(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToSession,
  emitGlobal
};
