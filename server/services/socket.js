// socket.js
const socketIo = require("socket.io");

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: ["https://hubwater.netlify.app", "http://localhost:5173"], // เปลี่ยนเป็นพอร์ตที่ React ใช้ทำงาน
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // เมื่อมี client เชื่อมต่อกับ socket จะมีการ log show
  io.on("connection", (socket) => {
    console.log("socket connected");
    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });
  });

  return io;
};

module.exports = initSocket;
