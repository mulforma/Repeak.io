const express = require('express');
const socket = require('socket.io');
const http = require('http');

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new socket.Server(server, {
  cors: {
    origin: '*',
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/** @typedef {import('./types/data').RoomData} RoomData */

const RoomData = [];

io.on("connection", (socket) => {
  socket.on("join", (data) => {
    if (!data) return;
    socket.join(data.roomId);
    console.log(`${data.name} joined ${data.roomId}`);
    if (RoomData.find(room => room.roomId === data.roomId)) {
      if (RoomData.find(room => room.roomId === data.roomId).roomPlayers.find(player => player.id === data.id)) {
        return;
      }
      RoomData.find(room => room.roomId === data.roomId).roomPlayers.push({
        name: data.name,
        id: data.id
      });
    } else {
      RoomData.push({
        roomId: data.roomId,
        roomMode: "idle",
        roomOwner: {
          name: data.name,
          id: data.id
        },
        roomPublic: false,
        roomState: "waiting",
        roomPlayers: [{
          name: data.name,
          id: data.id
        }]
      });

      socket['userData'] = {
        name: data.name,
        id: data.id,
        socketId: socket.id,
        roomId: data.roomId
      }
    }
    socket.broadcast.to(data.roomId).emit("updateRoom", RoomData.find(room => room.roomId === data.roomId));
  });

  socket.on("getRoom", (data) => {
    socket.emit("updateRoom", RoomData.find(room => room.roomId === data.roomId));
  });

  socket.on("disconnect", () => {
    if (socket['userData']) {
      console.log(socket['userData'].name + " disconnected");
      const userData = socket['userData'];
      if (RoomData.find(room => room.roomId === userData.roomId)) {
        RoomData.find(room => room.roomId === userData.roomId).roomPlayers = RoomData.find(room => room.roomId === userData.roomId).roomPlayers.filter(player => player.id !== userData.id);
        if (RoomData.find(room => room.roomId === userData.roomId).roomPlayers.length === 0) {
          RoomData.splice(RoomData.findIndex(room => room.roomId === userData.roomId), 1);
        }
      }
      socket.broadcast.to(userData.roomId).emit("updateRoom", RoomData.find(room => room.roomId === userData.roomId));
    }
  });

  socket.on("modifyRoomConfig", (data) => {
    RoomData.splice(RoomData.findIndex(room => room.roomId === data.roomId), 1, data.roomData);
    socket.broadcast.to(data.roomId).emit("updateRoom", RoomData.find(room => room.roomId === data.roomId));
  })
});