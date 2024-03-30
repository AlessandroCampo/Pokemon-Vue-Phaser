import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('starting_pokemon', (pokemon) => {
        // Emit the event to all sockets in the room except the emitting socket
        socket.to(socket.room).emit('starting_pokemon', pokemon);
    });

    socket.on('join_room', (room) => {
        console.log(`Socket ${socket.id} joining room: ${room}`);
        socket.join(room);
        socket.room = room;
    });
});


httpServer.listen(3000);