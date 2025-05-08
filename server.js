const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game rooms
const rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new game room
  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      players: [socket.id],
      currentPlayer: 0,
      board: Array(7).fill().map(() => Array(6).fill(null))
    };
    
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    console.log(`Room created: ${roomId}`);
  });

  // Join an existing room
  socket.on('joinRoom', (roomId) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('error', 'Room does not exist');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }
    
    room.players.push(socket.id);
    socket.join(roomId);
    
    socket.emit('joinedRoom', roomId);
    io.to(roomId).emit('gameStart', { 
      players: room.players,
      currentPlayer: room.currentPlayer,
      board: room.board
    });
    
    console.log(`Player joined room: ${roomId}`);
  });

  // Handle player moves
  socket.on('makeMove', ({ roomId, column }) => {
    const room = rooms[roomId];
    
    if (!room) return;
    
    const playerIndex = room.players.indexOf(socket.id);
    
    if (playerIndex === -1 || playerIndex !== room.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }
    
    // Find the first empty row in the selected column
    const columnArray = room.board[column];
    let row = -1;
    
    for (let i = 0; i < columnArray.length; i++) {
      if (columnArray[i] === null) {
        row = i;
        break;
      }
    }
    
    if (row === -1) {
      socket.emit('error', 'Column is full');
      return;
    }
    
    // Update the board
    room.board[column][row] = playerIndex;
    
    // Check for win condition
    const isWinner = checkWin(room.board, column, row, playerIndex);
    
    // Check for draw
    const isDraw = room.board.every(column => column.every(cell => cell !== null));
    
    if (isWinner) {
      io.to(roomId).emit('gameOver', { winner: playerIndex, board: room.board });
      console.log(`Player ${playerIndex} won in room ${roomId}`);
    } else if (isDraw) {
      io.to(roomId).emit('gameOver', { winner: -1, board: room.board });
      console.log(`Game ended in a draw in room ${roomId}`);
    } else {
      // Switch player
      room.currentPlayer = (room.currentPlayer + 1) % 2;
      
      // Broadcast updated game state
      io.to(roomId).emit('gameUpdate', {
        board: room.board,
        currentPlayer: room.currentPlayer,
        lastMove: { column, row, player: playerIndex }
      });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and clean up any rooms the player was in
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.indexOf(socket.id);
      
      if (playerIndex !== -1) {
        io.to(roomId).emit('playerDisconnected');
        delete rooms[roomId];
        console.log(`Room ${roomId} closed due to player disconnect`);
      }
    }
  });

  // Handle room reset
  socket.on('resetRoom', (roomId) => {
    const room = rooms[roomId];
    if (room) {
      room.board = Array(7).fill().map(() => Array(6).fill(null));
      room.currentPlayer = 0;
      io.to(roomId).emit('gameReset', {
        board: room.board,
        currentPlayer: room.currentPlayer
      });
      console.log(`Game reset in room ${roomId}`);
    }
  });
});

// Check win condition (horizontal, vertical, diagonal)
function checkWin(board, col, row, player) {
  // Horizontal check
  let count = 0;
  for (let c = 0; c < 7; c++) {
    if (board[c][row] === player) {
      count++;
      if (count >= 4) return true;
    } else {
      count = 0;
    }
  }

  // Vertical check
  count = 0;
  for (let r = 0; r < 6; r++) {
    if (board[col][r] === player) {
      count++;
      if (count >= 4) return true;
    } else {
      count = 0;
    }
  }

  // Diagonal check (top-left to bottom-right)
  let startCol = col - Math.min(col, row);
  let startRow = row - Math.min(col, row);
  count = 0;
  
  while (startCol < 7 && startRow < 6) {
    if (startCol >= 0 && startRow >= 0 && board[startCol][startRow] === player) {
      count++;
      if (count >= 4) return true;
    } else {
      count = 0;
    }
    startCol++;
    startRow++;
  }

  // Diagonal check (top-right to bottom-left)
  startCol = col + Math.min(6 - col, row);
  startRow = row - Math.min(6 - col, row);
  count = 0;
  
  while (startCol >= 0 && startRow < 6) {
    if (startCol < 7 && startRow >= 0 && board[startCol][startRow] === player) {
      count++;
      if (count >= 4) return true;
    } else {
      count = 0;
    }
    startCol--;
    startRow++;
  }

  return false;
}

// Generate a random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 