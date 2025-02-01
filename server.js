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
  console.log('User connected:', socket.id);

  // Đăng ký user khi kết nối
  socket.on('register', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
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
    console.log('User disconnected:', socket.id);
    Object.keys(users).forEach((key) => {
      if (users[key] === socket.id) {
        delete users[key];
      }
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
