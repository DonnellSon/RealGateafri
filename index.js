const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://localhost:3000", "https://beta.gateafri.com"],
    }
});

let connectedUsers = []

const addUser = (userId, socketId) => {
    !connectedUsers.some((user) => user.userId === userId) &&
        connectedUsers.push({ userId, socketId })
}

const removeUser = (socketId) => {
    connectedUsers = connectedUsers.filter(u => u.socketId !== socketId)
}



io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('connectUser', userId => {
        addUser(userId, socket.id)
        console.log(connectedUsers, 'cUSER')
    })
    socket.on('sendMessage', ({ message, receivers, sender }) => {
        io.to(connectedUsers.filter((cu) => receivers.find((r) => cu.userId = r && !sender)))
            .emit('arrivalMsg', message)
    })
    socket.on('sendNotification', ({ notification, currentUser }) => {
        try {
            const receivers = notification.receivers.map(user => connectedUsers.find(conn => conn.userId === user.userId)?.socketId).filter(socketId => socketId !== null);
            console.log(receivers, 'RECEIVERS')
            io.to(receivers)
                .emit('newNotification', notification)
            console.log(notification, 'NOTIF')
        } catch (error) {
            console.log(error, 'errrr')
        }
    })
    socket.on('disconnect', () => {
        console.log('a user diconnected');
        removeUser(socket.id)
    })
});

server.listen(5000, () => {
    console.log('server running at http://localhost:5000');
});