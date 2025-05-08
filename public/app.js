// Connect to Socket.io server
const socket = io();

// Game state
let currentRoomId = null;
let isMyTurn = false;
let playerIndex = null;
let isSinglePlayerMode = false;
let board = Array(7).fill().map(() => Array(6).fill(null));
let currentPlayer = 0;
let gameActive = false;

// DOM Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  join: document.getElementById('join-screen'),
  waiting: document.getElementById('waiting-screen'),
  game: document.getElementById('game-screen'),
  gameOver: document.getElementById('game-over-screen')
};

const elements = {
  createGameBtn: document.getElementById('create-game-btn'),
  joinGameBtn: document.getElementById('join-game-btn'),
  singlePlayerBtn: document.getElementById('single-player-btn'),
  joinRoomBtn: document.getElementById('join-room-btn'),
  roomIdInput: document.getElementById('room-id'),
  roomCode: document.getElementById('room-code'),
  copyCodeBtn: document.getElementById('copy-code-btn'),
  gameBoard: document.getElementById('game-board'),
  columnMarkers: document.querySelectorAll('.column-marker'),
  playerDisplay: document.getElementById('player-display'),
  gameStatus: document.getElementById('game-status'),
  gameResult: document.getElementById('game-result'),
  winnerDisplay: document.getElementById('winner-display'),
  player2Name: document.getElementById('player2-name'),
  resetGameBtn: document.getElementById('reset-game-btn'),
  leaveGameBtn: document.getElementById('leave-game-btn'),
  playAgainBtn: document.getElementById('play-again-btn'),
  exitGameBtn: document.getElementById('exit-game-btn'),
  backBtns: document.querySelectorAll('.back-btn'),
  notification: document.getElementById('notification'),
  notificationMessage: document.getElementById('notification-message'),
  notificationClose: document.getElementById('notification-close')
};

// Initialize the game board
function initializeBoard() {
  elements.gameBoard.innerHTML = '';
  
  for (let row = 5; row >= 0; row--) {
    for (let col = 0; col < 7; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      // Add click event directly to cells for better mobile experience
      cell.addEventListener('click', () => {
        if (gameActive) {
          makeMove(parseInt(cell.dataset.col));
        }
      });
      
      elements.gameBoard.appendChild(cell);
    }
  }
  
  // Reset game state
  board = Array(7).fill().map(() => Array(6).fill(null));
  currentPlayer = 0;
  gameActive = true;
}

// Update the game board based on the current state
function updateBoard(newBoard, lastMove = null) {
  board = newBoard;
  
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 6; row++) {
      const cellValue = board[col][row];
      const cellElement = document.querySelector(`.cell[data-col="${col}"][data-row="${row}"]`);
      
      if (cellElement) {
        // Remove previous player classes
        cellElement.classList.remove('player-0', 'player-1', 'drop-animation');
        
        if (cellValue !== null) {
          cellElement.classList.add(`player-${cellValue}`);
          
          // Add drop animation for the last move
          if (lastMove && lastMove.column === col && lastMove.row === row) {
            cellElement.classList.add('drop-animation');
          }
        }
      }
    }
  }
}

// Single player mode - AI move
function makeAIMove() {
  if (!gameActive || currentPlayer !== 1 || !isSinglePlayerMode) return;
  
  setTimeout(() => {
    // Simple AI: First try to find a winning move
    const winningMove = findWinningMove(1);
    if (winningMove !== -1) {
      processSinglePlayerMove(winningMove);
      return;
    }
    
    // Then try to block opponent's winning move
    const blockingMove = findWinningMove(0);
    if (blockingMove !== -1) {
      processSinglePlayerMove(blockingMove);
      return;
    }
    
    // Otherwise, make a random valid move
    let validColumns = [];
    for (let col = 0; col < 7; col++) {
      if (board[col][5] === null) { // If the top cell is empty, column is not full
        validColumns.push(col);
      }
    }
    
    if (validColumns.length > 0) {
      const randomColumn = validColumns[Math.floor(Math.random() * validColumns.length)];
      processSinglePlayerMove(randomColumn);
    }
  }, 1000); // Add a delay to make it feel more natural
}

// Find a winning move for the specified player
function findWinningMove(player) {
  for (let col = 0; col < 7; col++) {
    // Skip full columns
    if (board[col][5] !== null) continue;
    
    // Find the row where the piece would land
    let row = -1;
    for (let r = 0; r < 6; r++) {
      if (board[col][r] === null) {
        row = r;
        break;
      }
    }
    
    if (row !== -1) {
      // Temporarily place the piece
      board[col][row] = player;
      
      // Check if this is a winning move
      const isWinningMove = checkWin(board, col, row, player);
      
      // Undo the move
      board[col][row] = null;
      
      if (isWinningMove) {
        return col;
      }
    }
  }
  
  return -1; // No winning move found
}

// Process a move in single player mode
function processSinglePlayerMove(column) {
  // Find the first empty row in the selected column
  let row = -1;
  for (let i = 0; i < 6; i++) {
    if (board[column][i] === null) {
      row = i;
      break;
    }
  }
  
  if (row === -1) return; // Column is full
  
  // Update the board
  board[column][row] = currentPlayer;
  
  // Check for win
  const isWinner = checkWin(board, column, row, currentPlayer);
  
  // Check for draw
  const isDraw = board.every(column => column.every(cell => cell !== null));
  
  const lastMove = { column, row, player: currentPlayer };
  
  if (isWinner) {
    updateBoard(board, lastMove);
    highlightWinningCells(board, lastMove);
    handleGameOver(currentPlayer);
    gameActive = false;
  } else if (isDraw) {
    updateBoard(board, lastMove);
    handleGameOver(-1);
    gameActive = false;
  } else {
    // Switch player
    currentPlayer = (currentPlayer + 1) % 2;
    updateBoard(board, lastMove);
    updatePlayerDisplay(currentPlayer);
    
    // If it's AI's turn, make a move
    if (isSinglePlayerMode && currentPlayer === 1) {
      makeAIMove();
    }
  }
}

// Check win condition (similar to server-side logic)
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

// Update the player display
function updatePlayerDisplay(newCurrentPlayer) {
  currentPlayer = newCurrentPlayer;
  
  const players = document.querySelectorAll('.player');
  players.forEach((player, index) => {
    if (index === currentPlayer) {
      player.classList.add('current');
    } else {
      player.classList.remove('current');
    }
  });
  
  // Update turn status
  if (isSinglePlayerMode) {
    if (currentPlayer === 0) {
      elements.gameStatus.textContent = 'Du bist am Zug!';
      isMyTurn = true;
    } else {
      elements.gameStatus.textContent = 'Computer denkt nach...';
      isMyTurn = false;
    }
  } else {
    isMyTurn = playerIndex === currentPlayer;
    
    if (isMyTurn) {
      elements.gameStatus.textContent = 'Du bist am Zug!';
    } else {
      elements.gameStatus.textContent = 'Warte auf deinen Gegner...';
    }
  }
}

// Handle game over state
function handleGameOver(winner) {
  if (winner === -1) {
    elements.gameResult.textContent = 'Unentschieden!';
    elements.winnerDisplay.textContent = 'Das Spiel endet ohne Gewinner.';
  } else {
    if (isSinglePlayerMode) {
      const isWinner = winner === 0;
      elements.gameResult.textContent = isWinner ? 'Gewonnen!' : 'Verloren!';
      
      const winnerToken = document.createElement('div');
      winnerToken.className = `winner-token player-${winner}`;
      
      elements.winnerDisplay.innerHTML = '';
      elements.winnerDisplay.appendChild(document.createTextNode(isWinner ? 'Du hast gewonnen!' : 'Der Computer hat gewonnen!'));
      elements.winnerDisplay.appendChild(winnerToken);
    } else {
      const isWinner = playerIndex === winner;
      elements.gameResult.textContent = isWinner ? 'Gewonnen!' : 'Verloren!';
      
      const winnerToken = document.createElement('div');
      winnerToken.className = `winner-token player-${winner}`;
      
      elements.winnerDisplay.innerHTML = '';
      elements.winnerDisplay.appendChild(document.createTextNode(isWinner ? 'Du hast gewonnen!' : 'Dein Gegner hat gewonnen!'));
      elements.winnerDisplay.appendChild(winnerToken);
    }
  }
  
  // Don't hide the game screen, just show the overlay
  screens.gameOver.classList.add('active');
}

// Highlight winning cells
function highlightWinningCells(board, lastMove) {
  if (!lastMove) return;
  
  const { column, row, player } = lastMove;
  const winningCells = findWinningCells(board, column, row, player);
  
  if (winningCells.length === 4) {
    winningCells.forEach(coords => {
      const cell = document.querySelector(`.cell[data-col="${coords.col}"][data-row="${coords.row}"]`);
      if (cell) {
        cell.classList.add('winner-highlight');
      }
    });
  }
}

// Find winning cells (similar to the server-side check)
function findWinningCells(board, col, row, player) {
  const directions = [
    { x: 1, y: 0 },  // Horizontal
    { x: 0, y: 1 },  // Vertical
    { x: 1, y: 1 },  // Diagonal (top-left to bottom-right)
    { x: 1, y: -1 }  // Diagonal (bottom-left to top-right)
  ];
  
  for (const direction of directions) {
    const winningCells = [];
    
    // Check in both directions
    for (let i = -3; i <= 3; i++) {
      const checkCol = col + i * direction.x;
      const checkRow = row + i * direction.y;
      
      if (checkCol >= 0 && checkCol < 7 && checkRow >= 0 && checkRow < 6 && 
          board[checkCol][checkRow] === player) {
        winningCells.push({ col: checkCol, row: checkRow });
      } else {
        winningCells.length = 0;  // Reset if the sequence is broken
      }
      
      if (winningCells.length === 4) {
        return winningCells;
      }
    }
  }
  
  return [];
}

// Show notification
function showNotification(message, duration = 3000) {
  elements.notificationMessage.textContent = message;
  elements.notification.classList.remove('hidden');
  
  setTimeout(() => {
    elements.notification.classList.add('hidden');
  }, duration);
}

// Show a screen and hide others
function showScreen(screenId) {
  Object.keys(screens).forEach(key => {
    // Special handling for game-over-screen to keep game screen visible
    if (key === 'gameOver' && screenId !== 'gameOver') {
      screens[key].classList.remove('active');
    } else if (key !== 'gameOver' || screenId === 'gameOver') {
      screens[key].classList.remove('active');
    }
  });
  
  screens[screenId].classList.add('active');
}

// Create a new game room
function createRoom() {
  socket.emit('createRoom');
  showScreen('waiting');
}

// Start single player mode
function startSinglePlayerMode() {
  isSinglePlayerMode = true;
  elements.player2Name.textContent = 'Computer';
  elements.resetGameBtn.disabled = false;
  
  initializeBoard();
  updatePlayerDisplay(0);
  showScreen('game');
}

// Join an existing room
function joinRoom() {
  const roomId = elements.roomIdInput.value.trim().toUpperCase();
  
  if (roomId.length < 4) {
    showNotification('Bitte gib einen gültigen Spiel-Code ein!');
    return;
  }
  
  socket.emit('joinRoom', roomId);
}

// Make a move in the game
function makeMove(column) {
  if (isSinglePlayerMode) {
    if (currentPlayer !== 0 || !gameActive) {
      return;
    }
    
    processSinglePlayerMove(column);
  } else {
    if (!isMyTurn) {
      showNotification('Warte bis du an der Reihe bist!');
      return;
    }
    
    socket.emit('makeMove', { roomId: currentRoomId, column });
  }
}

// Reset the room for a new game
function resetRoom() {
  if (isSinglePlayerMode) {
    initializeBoard();
    updatePlayerDisplay(0);
    // Hide game over screen without changing the active screen
    screens.gameOver.classList.remove('active');
    gameActive = true;
  } else {
    socket.emit('resetRoom', currentRoomId);
  }
}

// Leave the current game
function leaveGame() {
  if (isSinglePlayerMode) {
    isSinglePlayerMode = false;
    elements.player2Name.textContent = 'Spieler 2';
  } else {
    socket.disconnect();
    socket.connect();
    currentRoomId = null;
    playerIndex = null;
  }
  gameActive = false;
  showScreen('welcome');
}

// Copy the room code to clipboard
function copyRoomCode() {
  const roomCode = elements.roomCode.textContent;
  navigator.clipboard.writeText(roomCode)
    .then(() => {
      showNotification('Spiel-Code in die Zwischenablage kopiert!');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
}

// Socket.io Event Handlers
socket.on('roomCreated', (roomId) => {
  currentRoomId = roomId;
  elements.roomCode.textContent = roomId;
  playerIndex = 0; // First player
});

socket.on('joinedRoom', (roomId) => {
  currentRoomId = roomId;
  playerIndex = 1; // Second player
  showScreen('game');
});

socket.on('gameStart', (gameState) => {
  initializeBoard();
  updateBoard(gameState.board);
  updatePlayerDisplay(gameState.currentPlayer);
  showScreen('game');
  elements.resetGameBtn.disabled = false;
  gameActive = true;
});

socket.on('gameUpdate', (gameState) => {
  updateBoard(gameState.board, gameState.lastMove);
  updatePlayerDisplay(gameState.currentPlayer);
});

socket.on('gameOver', (result) => {
  gameActive = false;
  updateBoard(result.board);
  
  if (result.lastMove) {
    highlightWinningCells(result.board, { 
      column: result.lastMove.column, 
      row: result.lastMove.row, 
      player: result.winner 
    });
  }
  
  handleGameOver(result.winner);
});

socket.on('gameReset', (gameState) => {
  initializeBoard();
  updateBoard(gameState.board);
  updatePlayerDisplay(gameState.currentPlayer);
  // Hide game over screen if it's active
  screens.gameOver.classList.remove('active');
  gameActive = true;
});

socket.on('playerDisconnected', () => {
  showNotification('Der andere Spieler hat das Spiel verlassen.');
  showScreen('welcome');
  currentRoomId = null;
  playerIndex = null;
  gameActive = false;
});

socket.on('error', (message) => {
  showNotification(message);
});

// Event Listeners
elements.createGameBtn.addEventListener('click', createRoom);
elements.joinGameBtn.addEventListener('click', () => showScreen('join'));
elements.singlePlayerBtn.addEventListener('click', startSinglePlayerMode);
elements.joinRoomBtn.addEventListener('click', joinRoom);
elements.backBtns.forEach(btn => btn.addEventListener('click', () => showScreen('welcome')));
elements.copyCodeBtn.addEventListener('click', copyRoomCode);
elements.resetGameBtn.addEventListener('click', resetRoom);
elements.leaveGameBtn.addEventListener('click', leaveGame);
elements.playAgainBtn.addEventListener('click', resetRoom);
elements.exitGameBtn.addEventListener('click', () => {
  screens.gameOver.classList.remove('active');
  leaveGame();
});
elements.notificationClose.addEventListener('click', () => elements.notification.classList.add('hidden'));

// Improved column marker click handling
elements.columnMarkers.forEach(marker => {
  marker.addEventListener('click', () => {
    if (gameActive) {
      const column = parseInt(marker.dataset.column);
      makeMove(column);
    }
  });
});

// Initialize the game board on load
initializeBoard();

// Handle keyboard navigation in the join screen
elements.roomIdInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    joinRoom();
  }
}); 