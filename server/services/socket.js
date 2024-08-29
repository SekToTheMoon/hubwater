// socket.js
const socketIo = require("socket.io");

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // เปลี่ยนเป็นพอร์ตที่ React ใช้ทำงาน
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // เมื่อมี client เชื่อมต่อกับ socket จะมีการ log show
  io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};

module.exports = initSocket;
