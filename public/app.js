const socket = io("https://small-chat-app-by-kei.onrender.com/");

const joinRoom = document.querySelector("#join_room");
const chatForm = document.querySelector("#chat_form");
const chatFormInput = document.querySelector("#chat_form-input");
const joinRoomInput = document.querySelector("#join_room-input");
const joinNameInput = document.querySelector("#join_name-input");
const activity = document.querySelector("#activity");
const roomP = document.querySelector("#room_p b");
const roomMember = document.querySelector("#room_member b");
const chatRoomContainer = document.querySelector("#chat_room-container");

function sendMessage(e) {
  e.preventDefault();

  if (chatFormInput.value && joinRoomInput.value && joinNameInput.value) {
    socket.emit("message", {
      name: joinNameInput.value,
      text: chatFormInput.value,
    });
    chatFormInput.value = "";
  }

  chatFormInput.focus();
}

function enterRoom(e) {
  e.preventDefault();

  if (joinNameInput.value && joinRoomInput.value) {
    socket.emit("enterRoom", {
      name: joinNameInput.value,
      room: joinRoomInput.value,
    });
  }
}

joinRoom.addEventListener("submit", enterRoom);
chatForm.addEventListener("submit", sendMessage);
chatFormInput.addEventListener("keypress", () => {
  socket.emit("activity", joinNameInput.value);
});

socket.on("message", (data) => {
  console.log(data);
  activity.textContent = "";
  const { message, name, time } = data;
  const li = document.createElement("li");

  if (name === joinNameInput.value) {
    li.innerHTML = `<li class="message message_user">
          <div class="message-header">
            <h3 class="message-header_left">${name}</h3>
            <h3 class="message-header_right">${time}</h3>
          </div>
          <p class="message-body">
             ${message}
          </p>
        </li>`;
  } else if (name !== joinNameInput.value && name !== "Admin") {
    li.innerHTML = `<li class="message message_other">
          <div class="message-header">
            <h3 class="message-header_left">${name}</h3>
            <h3 class="message-header_right">${time}</h3>
          </div>
          <p class="message-body">
             ${message}
          </p>
        </li>`;
  } else if (name === "Admin") {
    li.innerHTML = `<li class="message message_admin">
          <div class="message-header">
            <h3 class="message-header_left">${name}</h3>
            <h3 class="message-header_right">${time}</h3>
          </div>
          <p class="message-body">
             ${message}
          </p>
        </li>`;
  }

  chatRoomContainer.appendChild(li);
  chatRoomContainer.scrollTop = chatRoomContainer.scrollHeight;
});

let activityTimer;

socket.on("activity", (name) => {
  activity.textContent = `${name} is typing...`;

  clearInterval(activityTimer);
  activityTimer = setTimeout(() => {
    activity.textContent = "";
  }, 1000);
});

socket.on("roomLists", ({ rooms }) => {
  showRoom(rooms);
});
socket.on("userLists", ({ users }) => {
  console.log(users);
  showUsers(users);
});

function showRoom(rooms) {
  roomP.textContent = "";
  if (rooms) {
    roomP.textContent = rooms.join(", ");
  }
}
function showUsers(users) {
  roomMember.textContent = "";
  if (users) {
    roomMember.textContent = users.join(", ");
  }
}
