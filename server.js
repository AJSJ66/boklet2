const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Allow any device on your local subnet to connect securely
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let activePlayers = {};

// Simple browser check page
app.get('/', (req, res) => {
    res.send('<h1>Blooket 2 Local Server is Online! 🚀</h1>');
});

io.on('connection', (socket) => {
    console.log(`Device connected: ${socket.id}`);

    // Listen for players joining the game loop
    socket.on('joinGame', (data) => {
        const { username, pin } = data;

        if (pin === "001122") {
            activePlayers[socket.id] = {
                username: username,
                score: 0
            };
            console.log(`Player "${username}" successfully joined the lobby.`);
            sendUpdatedLeaderboard();
        } else {
            socket.emit('joinError', 'Invalid Game ID Pin!');
        }
    });

    // Listen for points scored from matching candies
    socket.on('addPoints', (points) => {
        if (activePlayers[socket.id]) {
            activePlayers[socket.id].score += points;
            console.log(`${activePlayers[socket.id].username} scored +${points} pts.`);
            sendUpdatedLeaderboard();
        }
    });

    // Clean up when a device disconnects or closes the tab
    socket.on('disconnect', () => {
        if (activePlayers[socket.id]) {
            console.log(`${activePlayers[socket.id].username} left the game.`);
            delete activePlayers[socket.id];
            sendUpdatedLeaderboard();
        }
    });
});

// Broadcast the sorted high scores to all connected game screens
function sendUpdatedLeaderboard() {
    let playersList = Object.values(activePlayers);
    playersList.sort((a, b) => b.score - a.score);
    io.emit('updateLeaderboard', playersList);
}

// Start the server and explicitly bind it to your local network address block
const PORT = 3000;
const HOST = '74.220.52.1'; // Binds to your designated interface gateway

server.listen(PORT, HOST, () => {
    console.log(`Multiplayer server actively running at http://${HOST}:${PORT}`);
    console.log(`Listening for devices on the 74.220.52.0/24 network.`);
});
