const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Cho phép kết nối từ mọi domain
});

let users = {}; // Lưu trữ người dùng online

// Khi có client kết nối
io.on('connection', (socket) => {
  // Đăng ký user khi kết nối
  socket.on('register', (userId) => {
    users[userId] = socket.id;
    Object.keys(users).forEach((key) => {
      if (users[key] !== socket.id) {
        var socketId = users[key];
        io.to(socketId).emit('message_connection', { userId: userId, status: 'connection' });
        console.log("connection "+userId)
      }
    });
  });

  socket.on('get_list_user', (data) => {
    socket.emit('list_user', { users: users, status: 'sent' });
  });

  // Gửi tin nhắn
  socket.on('send_message', (data) => {
    const { senderId, receiverId, message } = data;
    const receiverSocketId = users[receiverId];

    // Phản hồi trạng thái "Đã gửi"
    socket.emit('message_status', { messageId: data.id, status: 'sent' });

    if (receiverSocketId) {
      // Gửi tin nhắn cho người nhận
      io.to(receiverSocketId).emit('receive_message', data);

      // Cập nhật trạng thái "Đã nhận"
      socket.emit('message_status', { messageId: data.id, status: 'delivered' });
    }
  });

  // Xác nhận khi người nhận đã xem tin nhắn
  socket.on('seen_message', (data) => {
    const senderSocketId = users[data.senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_status', { messageId: data.id, status: 'seen' });
    }
  });

  // Xử lý khi user disconnect
  socket.on('disconnect', () => {
    var userId = 0
    Object.keys(users).forEach((key) => {
      if (users[key] === socket.id) {
        delete users[key];
        userId = key
      }
    });
    if(userId > 0) {
      Object.keys(users).forEach((key) => { 
        var socketId = users[key];
        io.to(socketId).emit('message_disconnect', { userId: userId, status: 'disconnect' });
        console.log("disconnect "+userId)
      })
    }
  });
});

server.listen(9000, () => {
  console.log('Server is running on http://localhost:9000');
});
