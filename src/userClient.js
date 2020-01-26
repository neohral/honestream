class User {
  constructor(_ws, _id, _room, _name) {
    this.ws = _ws;
    this.id = _id;
    this.room = _room;
    this.lag = 0;
    this.isHost = false;
  }
}
let user;
let receive = ws => {
  ws.addEventListener("message", () => {
    let json = JSON.parse(event.data);
    switch (json.title) {
      case "welcome":
        user = new User(json.user.ws, json.user.id, json.user.room, "noname");
        user.lag = new Date().getTime() - json.time;
        let data = {
          sender: user.id,
          title: "setLag",
          lag: user.lag
        };
        ws.send(JSON.stringify(data));
        console.log(`LOGIN`);
        console.log(`USERID:${user.id}`);
        document.getElementById(
          "name"
        ).innerHTML = `ID:<strong>${user.id}</strong>`;
        break;
      case "updateHost":
        user.isHost = true;
        document.getElementById(
          "name"
        ).innerHTML = `ID:<strong>${user.id}</strong>👑`;
        console.log(`ISHOST`);
        break;
    }
  });
};
export { user, receive };
