import {
  player,
  ableStateChange,
  IntroState,
  PlayerState,
  state,
  startPlayer
} from "./player";
import { youtubeDataApi } from "./youtube";
import { ws, send } from "./websoket";
import { user, receive } from "./userClient";
import {
  getStorage,
  pushStorage,
  removeStorage,
  updateStorage,
  clearStorage,
  setStorage
} from "./storage";
/*デバッグ用
import { setfavurl } from "./test";
setfavurl();
*/
class Code {
  constructor(_pid, _code, _title, _startSec) {
    this.code = _code;
    this.pid = _pid;
    this.title = _title;
    this.startSec = _startSec;
  }
}
const msg = document.getElementById("btn");
const st = document.getElementById("startbtn");
let playing = false;
//途中loadキャンセルフラグ
let tloadflg = false;
let endev;
receive(ws);
ws.addEventListener("message", () => {
  let json = JSON.parse(event.data);
  console.log(`[LOG}message:${json.title}`);
  switch (json.title) {
    case "updateHost":
      voteStartCheck();
      break;
    case "sendCode":
      document.getElementById(
        "messages"
      ).innerHTML += `<div>${json.videoTitle}</div>`;
      break;
    case "voteStart":
      if (playing) {
        playing = false;
        player.youtube.off(endev);
      }
      let ev = player.youtube.on("stateChange", event => {
        if (
          event.data == PlayerState.PAUSED ||
          event.data == PlayerState.UNSTARTED
        ) {
          let data = {
            sender: user.id,
            title: "voteDone"
          };
          send(data);
          player.youtube.off(ev);
        }
      });
      ableStateChange(IntroState.MUTE);
      console.log(
        `LOAD:${getStorage("video")[0].code},${getStorage("video")[0].startSec}`
      );
      player.youtube.loadVideoById(
        getStorage("video")[0].code,
        getStorage("video")[0].startSec
      );
      tloadflg = false;
      break;
    case "voteEnd":
      let startTime = new Date(json.time).getTime() + user.lag;
      startTime = startTime - getStorage("video")[0].startSec * 1000;
      playerStart(startTime);
      console.log(`START:${startTime}`);
      if (user.isHost) {
        let code = getStorage("video")[0].code;
        let store = {
          playing: true,
          code: code,
          startTime: startTime - user.lag
        };
        setStorage("serverstats", store);
        pushStorage("videoLog", getStorage("video")[0]);
        removeStorage("video", 0);
      }
      break;
    case "sync_storage":
      viewVideoList();
      if (!playing & getStorage("serverstats")[0].playing) {
        let startTime =
          new Date(getStorage("serverstats")[0].startTime).getTime() + user.lag;
        let startSec = (new Date().getTime() - startTime) / 1000;
        console.log(`TLOAD:${getStorage("serverstats")[0].code},${startSec}`);
        player.youtube.loadVideoById(
          getStorage("serverstats")[0].code,
          startSec
        );
        tloadflg = true;
        let ev = player.youtube.on("stateChange", event => {
          if (
            event.data == PlayerState.PAUSED ||
            event.data == PlayerState.UNSTARTED
          ) {
            if (tloadflg) {
              playerStart(startTime);
            }
            player.youtube.off(ev);
          }
        });
      }
      if (user.isHost) {
        voteStartCheck();
      }
      break;
  }
});
function viewVideoList() {
  document.getElementById("messages").innerHTML = "";
  getStorage("videoLog").forEach(function(log, i) {
    document.getElementById(
      "messages"
    ).innerHTML += `<div><a href= "https://www.youtube.com/watch?v=${log.code}" target="_blank">${log.title}</a></div>`;
  });
  getStorage("video").forEach(function(log, i) {
    if (i == 0) {
      document.getElementById(
        "messages"
      ).innerHTML += `<div><B>NEXT</B>→<a href= "https://www.youtube.com/watch?v=${log.code}" target="_blank">${log.title}</a></div>`;
    } else {
      document.getElementById(
        "messages"
      ).innerHTML += `<div><a href= "https://www.youtube.com/watch?v=${log.code}" target="_blank">${log.title}</a></div>`;
    }
  });
}
function playerStart(time) {
  ableStateChange(IntroState.PLAYING);
  endev = player.youtube.on("stateChange", event => {
    //プレイヤー終了
    if (event.data == PlayerState.ENDED) {
      ableStateChange(IntroState.MUTE);
      playing = false;
      if (user.isHost) {
        let store = {
          playing: false
        };
        setStorage("serverstats", store);
      }
      if (user.isHost) {
        voteStartCheck();
      }
      player.youtube.off(endev);
    }
  });
  startPlayer(time);
  playing = true;
}
msg.addEventListener(
  "click",
  () => {
    let codeValue = document.getElementById("msg").value;
    if (getParam("v", codeValue) != null) {
      let startSec = getSec(document.getElementById("ssec").value);
      ////startSec=0だと読み込んだ時に続きから始まる対策
      startSec += 0.0001;
      youtubeDataApi(getParam("v", codeValue)).then(api => {
        pushStorage(
          "video",
          new Code(
            user.id,
            api.items[0].id,
            api.items[0].snippet.title,
            startSec
          )
        );
      });
      document.getElementById("msg").value = "";
      document.getElementById("ssec").value = "";
    }
  },
  false
);
st.addEventListener(
  "click",
  () => {
    if (user.isHost) {
      playing = false;
      player.youtube.off(endev);
      let store = {
        playing: false
      };
      setStorage("serverstats", store);
      voteStartCheck();
    }
  },
  false
);
function voteStartCheck() {
  console.log(getStorage("video"));
  if (!playing) {
    if (
      getStorage("video").length == 0 &&
      document.getElementById("roop").checked
    ) {
      getStorage("videoLog").forEach(function(log, i) {
        pushStorage("video", log);
      });
      clearStorage("videoLog");
    }
    if (getStorage("video").length != 0) {
      let data = {
        sender: user.id,
        title: "voteReq"
      };
      send(data);
    }
  }
}
/**
 * Common
 */
function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function getSec(str) {
  let splitTime = str.split(":").reverse();
  const persec = [1, 60, 3600, 86400];
  let result = 0;
  for (let i = 0; i < splitTime.length; i++) {
    if (parseFloat(splitTime[i]) == NaN) {
      splitTime[i] = 0;
    }
    result += splitTime[i] * persec[i];
  }
  return parseFloat(result);
}
