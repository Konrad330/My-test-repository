const chessboard = document.getElementById('chessboard');
const status = document.getElementById('status');
const pieces = {
    'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚', 'P': '♟',
    'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔', 'p': '♙'
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let boardState = JSON.parse(JSON.stringify(initialBoard)); // Deep copy of initial board
let selectedPiece = null;
let currentPlayer = 'white'; // 'white' or 'black'
let gameOver = false;

function createBoard() {
    chessboard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = boardState[row][col];
            if (piece) {
                square.textContent = pieces[piece];
            }

            square.addEventListener('click', () => handleSquareClick(square));
            chessboard.appendChild(square);
        }
    }
    updateStatus();
}

function handleSquareClick(square) {
    if (gameOver) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = boardState[row][col];

    if (selectedPiece) {
        const [fromRow, fromCol] = selectedPiece;
        if (isValidMove(fromRow, fromCol, row, col)) {
            movePiece(fromRow, fromCol, row, col);
            if (isCheckmate()) {
                gameOver = true;
                status.textContent = `Checkmate! ${currentPlayer} wins!`;
            } else if (isCheck()) {
                status.textContent = `Check! ${currentPlayer}'s turn.`;
            } else {
                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                updateStatus();
            }
        }
        selectedPiece = null;
        createBoard();
    } else if (piece && isCurrentPlayerPiece(piece)) {
        selectedPiece = [row, col];
        square.classList.add('selected');
    }
}

function isCurrentPlayerPiece(piece) {
    return (currentPlayer === 'white' && piece === piece.toUpperCase()) ||
           (currentPlayer === 'black' && piece === piece.toLowerCase());
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    const targetPiece = boardState[toRow][toCol];

    if (targetPiece && isCurrentPlayerPiece(targetPiece)) {
        return false; // Cannot capture your own piece
    }

    const dx = Math.abs(toCol - fromCol);
    const dy = Math.abs(toRow - fromRow);

    switch (piece.toLowerCase()) {
        case 'p': // Pawn
            const direction = piece === 'P' ? -1 : 1;
            if (fromCol === toCol && !targetPiece) {
                return (toRow === fromRow + direction) || 
                       (fromRow === (piece === 'P' ? 6 : 1) && toRow === fromRow + 2 * direction);
            } else if (dx === 1 && dy === 1 && targetPiece) {
                return true; // Capture
            }
            return false;

        case 'r': // Rook
            return (fromRow === toRow || fromCol === toCol) && isPathClear(fromRow, fromCol, toRow, toCol);

        case 'n': // Knight
            return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);

        case 'b': // Bishop
            return dx === dy && isPathClear(fromRow, fromCol, toRow, toCol);

        case 'q': // Queen
            return (fromRow === toRow || fromCol === toCol || dx === dy) && isPathClear(fromRow, fromCol, toRow, toCol);

        case 'k': // King
            return dx <= 1 && dy <= 1;

        default:
            return false;
    }
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const dx = Math.sign(toCol - fromCol);
    const dy = Math.sign(toRow - fromRow);
    let x = fromCol + dx;
    let y = fromRow + dy;

    while (x !== toCol || y !== toRow) {
        if (boardState[y][x]) return false;
        x += dx;
        y += dy;
    }
    return true;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    boardState[toRow][toCol] = boardState[fromRow][fromCol];
    boardState[fromRow][fromCol] = '';
}

function isCheck() {
    const king = currentPlayer === 'white' ? 'K' : 'k';
    let kingPos = null;

    // Find the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (boardState[row][col] === king) {
                kingPos = [row, col];
                break;
            }
        }
        if (kingPos) break;
    }

    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece && !isCurrentPlayerPiece(piece)) {
                if (isValidMove(row, col, kingPos[0], kingPos[1])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isCheckmate() {
    if (!isCheck()) return false;

    // Check if any move can get the king out of check
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = boardState[fromRow][fromCol];
            if (piece && isCurrentPlayerPiece(piece)) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                            const originalPiece = boardState[toRow][toCol];
                            movePiece(fromRow, fromCol, toRow, toCol);
                            const stillInCheck = isCheck();
                            movePiece(toRow, toCol, fromRow, fromCol); // Undo move
                            boardState[toRow][toCol] = originalPiece;
                            if (!stillInCheck) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }
    return true;
}

function updateStatus() {
    status.textContent = `${currentPlayer}'s turn`;
}

createBoard();
