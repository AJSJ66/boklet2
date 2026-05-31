const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Allows your website to connect securely from any device
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let activePlayers = {};

app.get('/', (req, res) => {
    res.send('<h1>Blooket 2 Server is Online! 🚀</h1>');
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle player joining
    socket.on('joinGame', (data) => {
        const { username, pin } = data;

        if (pin === "001122") {
            activePlayers[socket.id] = {
                username: username,
                score: 0
            };
            console.log(`${username} joined.`);
            sendUpdatedLeaderboard();
        } else {
            socket.emit('joinError', 'Invalid Game ID Pin!');
        }
    });

    // Handle points added from candy matches
    socket.on('addPoints', (points) => {
        if (activePlayers[socket.id]) {
            activePlayers[socket.id].score += points;
            sendUpdatedLeaderboard();
        }
    });

    // Handle player leaving
    socket.on('disconnect', () => {
        if (activePlayers[socket.id]) {
            console.log(`${activePlayers[socket.id].username} left.`);
            delete activePlayers[socket.id];
            sendUpdatedLeaderboard();
        }
    });
});

function sendUpdatedLeaderboard() {
    let playersList = Object.values(activePlayers);
    playersList.sort((a, b) => b.score - a.score); // High scores first
    io.emit('updateLeaderboard', playersList);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Multiplayer server running on port ${PORT}`);
});
