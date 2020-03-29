/**
 * Socket
 */
let fs = require("fs");
let WebSocketServer = require("ws").Server,
  http = require("http"),
  express = require("express"),
  app = express();
app.use(express.static(__dirname + "/"));
let server = http.createServer(app);
let wss = new WebSocketServer({ server: server });

//接続時
wss.on("connection", function(ws) {
  sync_storage();
  //メッセージ送信時
  ws.on("message", function(message) {
    let json = JSON.parse(message);
    broadcast(json);
  });
});
function broadcast(message) {
  console.log(`[LOG]MESSAGE:${message.title},${message.sender},${message.id}`);
  connections.forEach(function(con, i) {
    let json = JSON.stringify(message);
    if (con.ws.readyState == 1) {
      con.ws.send(json);
    }
  });
  switch (message.title) {
    case "loginuser":
      let data;
      //storage
      data = {
        title: "sync_storage",
        sender: "server",
        id: "loginUser",
        storages: JSON.stringify(storages)
      };
      message.user.ws.send(JSON.stringify(data));
      //vote
      if (isVoting) {
        data = {
          sender: "server",
          title: "voteStart"
        };
        message.user.ws.send(JSON.stringify(data));
      }
      break;
    case "logoutUser":
      if (isVoting) {
        if (voteCheck()) {
          voteEnd();
        }
      }
      break;
  }
}

/**
 * Storage
 */
class Storage {
  constructor(id, obj) {
    this.id = id;
    this.obj = obj;
  }
}
let storages = [];
function storage_update(json) {
  //console.log(`[LOG]STORAGE:${json.storages},${json.sender}`);
  storages = JSON.parse(json.storages);
  sync_storage();
}
function sync_storage() {
  let data = {
    title: "sync_storage",
    sender: "server",
    storages: JSON.stringify(storages)
  };

  broadcast(data);
}

function getStorage(id) {
  let storage = null;
  storages.forEach(function(con, i) {
    if (con.id == id) {
      storage = con;
    }
  });
  if (storage == null) {
    storage = new Storage(id, []);
    storages.push(storage);
  }
  return storage.obj;
}
wss.on("connection", function(ws) {
  sync_storage();
  //メッセージ送信時
  ws.on("message", function(message) {
    let json = JSON.parse(message);
    switch (json.title) {
      case "storage_update":
        storage_update(json, ws);
        break;
    }
  });
});

/**
 * UserManager
 */
class User {
  constructor(_ws, _id, _room, _name) {
    this.ws = _ws;
    this.id = _id;
    this.room = _room;
    this.vote = false;
    this.isHost = false;
  }
}
let id = 0;
let connections = [];
let hostId = -1;
userManagerSocket = function(wss) {
  wss.on("connection", function(ws) {
    //login処理
    loginUser(ws);
    //logout処理
    ws.on("close", function() {
      connections = connections.filter(function(conn, i) {
        if (conn.ws === ws) {
          logoutUser(conn);
          return false;
        }
        return true;
      });
      updateHost();
      if (connections.length == 0) {
        getStorage("serverstats")[0].playing = false;
        isVoting = false;
      }
      let borDate = {
        sender: "server",
        title: "logoutuser"
      };
      broadcast(borDate);
    });
    ws.on("message", function(message) {
      let json = JSON.parse(message);
      switch (json.title) {
        case "setLag":
          console.log(`[LOG]LAG:${json.sender}>${json.lag}`);
          getUserByid(json.sender).lag = json.lag;
          break;
      }
    });
  });
};
function loginUser(ws) {
  id++;
  let userId = ("0000000000" + id).slice(-5);
  let newcomer = new User(ws, userId, "common");
  connections.push(newcomer);
  let data = {
    title: "welcome",
    user: newcomer,
    userId: userId,
    time: new Date().getTime(),
    playercnt: connections.length
  };
  ws.send(JSON.stringify(data));
  let borDate = {
    sender: "server",
    title: "loginuser",
    user: newcomer,
    userId: userId
  };
  broadcast(borDate);
  console.log(`[LOG]LOGIN USER:${userId}`);
  updateHost();
}
function logoutUser(logoutUser) {
  if (logoutUser.isHost) {
    hostId = -1;
  }
  console.log(`[LOG]LOGOUT USER:${logoutUser.id}`);
}
function updateHost() {
  if (hostId == -1 && connections.length > 0) {
    connections[0].isHost = true;
    hostId = connections[0].id;
    let data = {
      title: "updateHost",
      sender: "server",
      userid: hostId
    };
    connections[0].ws.send(JSON.stringify(data));
    console.log(`[LOG]UPDATE HOST:${hostId}`);
  }
}
function getUserByid(id) {
  let user;
  connections.forEach(function(con, i) {
    if (con.id == id) {
      user = con;
    }
  });
  return user;
}
/**
 * Vote
 */
let isVoting = false;
function voteStart() {
  if (!isVoting) {
    let data = {
      sender: "server",
      title: "voteStart"
    };
    connections.forEach(function(con, i) {
      con.vote = false;
    });
    isVoting = true;
    broadcast(data);
  }
}
function voteCheck() {
  let endVote = true;
  connections.forEach(function(con, i) {
    console.log(`[log]CHECK:${con.id}:${con.vote}`);
    if (!con.vote) {
      endVote = false;
    }
  });
  return endVote;
}
let timeoutObj;
wss.on("connection", function(ws) {
  ws.on("message", function(message) {
    let json = JSON.parse(message);
    switch (json.title) {
      case "voteReq":
        voteStart();
        break;
      case "voteDone":
        getUserByid(json.sender).vote = true;
        if (voteCheck()) {
          voteEnd();
        } else {
          //次のDoneまでに5秒以上掛かったらend
          timeoutObj = setTimeout(() => {
            clearTimeout(timeoutObj);
            voteEnd();
          }, 5000);
        }
        break;
    }
  });
});
function voteEnd() {
  if (isVoting) {
    clearTimeout(timeoutObj);
    let data = {
      sender: "server",
      title: "voteEnd",
      time: new Date().getTime()
    };
    isVoting = false;
    broadcast(data);
  }
}
server.listen(3000);
getStorage("serverstats").push({ playing: false });
userManagerSocket(wss);
