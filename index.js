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
  socket.emit("message", buildMessage(ADMIN, `Welcome from Chat App⌨️👨🏻‍💻`));

  socket.on("enterRoom", ({ name, room }) => {
    const existingUser = getUser(socket.id);

    const prevRoom = existingUser[0]?.room;

    if (prevRoom) {
      socket.leave(prevRoom);
      io.to(prevRoom).emit(
        "message",
        buildMessage(ADMIN, `${name} has left from the Chat`)
      );
    }

    // activate the user and push user data to user state
    const user = activateUser(socket.id, name, room);

    if (prevRoom) {
      io.to(prevRoom).emit("userLists", {
        users: getUserInRoom(user.room),
      });
    }

    // join the room
    socket.join(user.room);

    // to user
    socket.emit(
      "message",
      buildMessage(ADMIN, `You joined the ${user.room} chat room`)
    );

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        buildMessage(ADMIN, `${user.name} has joined the chat room`)
      );

    io.to(user.room).emit("userLists", {
      users: getUserInRoom(user.room),
    });

    io.emit("roomLists", {
      rooms: allActiveRoom(),
    });
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);

    leaveTheChat(socket.id);
    if (user) {
      io.to(user[0]?.room).emit(
        "message",
        buildMessage(ADMIN, `${user[0]?.room} has left the room`)
      );

      io.to(user[0]?.room).emit("userLists", {
        users: getUserInRoom(user[0]?.room),
      });

      io.emit("roomLists", {
        rooms: allActiveRoom(),
      });
    }
  });

  socket.on("message", ({ name, text }) => {
    const user = getUser(socket.id);

    if (user) {
      const room = user[0]?.room;
      io.to(room).emit("message", buildMessage(name, text));
    }
  });

  socket.on("activity", (name) => {
    const user = getUser(socket.id);

    if (user) {
      const room = user[0]?.room;
      socket.broadcast.to(room).emit("activity", name);
    }
  });
});

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
  return UserState.users.filter((user) => user.id === id);
}

function getUserInRoom(room) {
  const userArray = UserState.users.filter((user) => user.room === room);

  return userArray.reduce((acc, curr) => {
    acc.push(curr.name);
    return acc;
  }, []);
}

// get all active room
function allActiveRoom() {
  return Array.from(new Set(UserState.users.map((user) => user.room)));
}
