import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8090;

const ADMIN = "Admin";
// user state
const UserState = {
  users: [],
  setUsers: function (newUserArray) {
    this.users = newUserArray;
  },
};

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () =>
  console.log(`Server is running on port : ${PORT}`)
);

const io = new Server(expressServer, {
  cors: process.env.NODE_ENV === "production" ? false : ["http://localhost"],
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} is connected`);
});

io.on("disconnect", (socket) => {});

io.on("message", (socket) => {});

io.on("activity", (socket) => {});

// helper functions

// build message payload
function buildMessage(name, message) {
  return {
    name,
    message,
    time: Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(new Date()),
  };
}

// set all active user lists
function activateUser(id, name, room) {
  const newUser = { id, name, room };

  UserState.setUsers([
    ...UserState.users.filter((user) => user.id !== id),
    newUser,
  ]);

  return newUser;
}

// remove user from array when they leave
function leaveTheChat(id) {
  UserState.setUsers(UserState.users.filter((user) => user !== id));
}

function getUser(id) {
  return UserState.setUsers(UserState.users.filter((user) => user.id === id));
}

function getUserInRoom(room) {
  return UserState.setUsers(
    UserState.users.filter((user) => user.room === room)
  );
}

// get all active room
function allActiveRoom() {
  return Array.from(new Set(UserState.users.map((user) => user.room)));
}
