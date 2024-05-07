const express = require("express");
const app = express();
const http = require("http");
const jwt = require("jsonwebtoken");
const server = http.createServer(app);
const { Server } = require("socket.io");
require("dotenv").config();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    credentials: true,
  },
});
app.get("/", (req, res) => {
  res.send({ status: true, msg: "server working" });
});
var onlineUsers = [];
io.on("connection", (socket) => {
  if (!socket.handshake.auth.token) return;
  try {
    var decoded = jwt.verify(
      socket.handshake.auth.token,
      process.env.SECRETKEY
    );
    onlineUsers.push({
      id: decoded._id,
      socket: socket.id,
      token: socket.handshake.auth.token,
    });
    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter(
        (el) => el.token != socket.handshake.auth.token
      );
      console.log("User disconnected");
    });
    socket.on("newSession", (body) => {
      // console.log("newsession");
      try {
        var { token } = body;
        var decoded = jwt.verify(token, process.env.SECRETKEY);
        var sockets = onlineUsers.filter((el) => el.id == decoded._id);
        // console.log(sockets);
        sockets.forEach((ele) => {
          io.to(ele.socket).emit("sessionAdded", "");
        });
      } catch (error) {
        // console.log(error);
      }
    });
    socket.on("disconnect_user", (body) => {
      try {
        var { user } = body;
        var socket = onlineUsers.find((el) => el.token == user)?.socket;
        io.to(socket).emit("Logout", "Logged out for your device");
        console.log("user disconnected remotely");
      } catch (error) {
        console.log(error);
        console.log("illigal");
      }
    });
  } catch (error) {
    console.log(error);
  }
});

server.listen(process.env.PORT || 5000, () => {
  console.log(
    "Server is running on http://localhost:" + process.env.PORT || 5000
  );
});
