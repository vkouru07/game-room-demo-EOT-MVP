const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Queue = require('queue-fifo');

const app = express();
app.use(cors()); // Enable CORS

app.use(express.static(__dirname));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow requests from this origin
        methods: ["GET", "POST"]
    }
});

// const firebaseApp = initializeApp(firebaseConfig);
// const database = getDatabase(firebaseApp);

const unmatchedUntimedUsers = new Queue(); 
const games = {};

let connectedUsers = 0;

/*
MAIN EVENTS: 

listens for: 
- findUntimedGame
- requestMakeMove, data: { gameId, playerId, move: 'move 1,2,3' }

- disconnect

emits: 
- gameStarted -> data: {gameID, player1ID, player2I}
- canMakeMove -> data: {playerId}
- moveMade -> data: {playerId, move: 'move 1,2,3'}
- gameOver -> data: {winnerId, message}
- playerLeft -> data: {playerId}

- updateUserCount -> data: {count}

*/

io.on('connection', (socket) => {
    console.log('New client connected');
    connectedUsers++;
    io.emit('updateUserCount', { count: connectedUsers });

    socket.on('findUntimedGame', () => {
        if (unmatchedUntimedUsers.isEmpty()) {
            unmatchedUntimedUsers.enqueue(socket);
        } else {
            const player1 = unmatchedUntimedUsers.dequeue();
            const player2 = socket;

            while (player1.id === player2.id && !unmatchedUntimedUsers.isEmpty()) {
                player1 = unmatchedUntimedUsers.dequeue();
            } 

            if (player1 == null || player1.id === player2.id) {
                unmatchedUntimedUsers.enqueue(player2);
                return;
            }
            const room = `room-${player1.id}-${player2.id}`;
            games[room] = { p1: { id: player1.id, socket: player1 }, p2: { id: player2.id, socket: player2 }};
            console.log (`Game started in room ${room} between ${player1.id} and ${player2.id}`);

            player1.join(room);
            player2.join(room);
            io.to(room).emit('gameStarted', {
                gameId: room, 
                player1Id: player1.id,
                player2Id: player2.id
            });
            io.to(room).emit('canMakeMove', {
                playerId: player1.id
            });
        }
    }); 

    socket.on('requestMakeMove', (data) => {
        const validMove = true;
        const gameOver = data.move === 'win';

        if (!validMove) {
            return;
        }

        io.to(data.room).emit('moveMade', {
            playerId: data.playerId,
            move: data.move
        });

        if (gameOver) {
            io.to(data.gameId).emit('gameOver', {
                winnerId: data.playerId,
                message: `${data.playerId} won the game!`
            });
            console.log(`Game over in room ${data.gameId}`);
            return;
        }

        if (games[data.gameId]) {
            io.to(data.gameId).emit('canMakeMove', {
                playerId: games[data.gameId].p1.id === data.playerId ? games[data.gameId].p2.id : games[data.gameId].p1.id, 
            });
        }
    }); 

    socket.on('disconnecting', () => {
        console.log('Client disconnected');

        const self = this; 
        Object.keys(games).forEach(room => {
            const game = games[room];
            io.to(room).emit('gameOver', { winnerId: 'none', message: `${socket.id} disconnected` });
            io.to(room).emit('playerLeft', { playerId: socket.id });
            delete games[room];
        });

        connectedUsers--;
        io.emit('updateUserCount', { count: connectedUsers });
    }); 
}); 

server.listen(5050, () => console.log('WebSocket server running on port 5050'));
