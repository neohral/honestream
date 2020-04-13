import {
  player,
  ableStateChange,
  IntroState,
  PlayerState,
  state,
  startPlayer,
} from "./player";
import { youtubeSearchApi, youtubeDataApi } from "./youtube";
import { ws, send } from "./websoket";
import { user, receive } from "./userClient";
import {
  getStorage,
  pushStorage,
  removeStorage,
  updateStorage,
  clearStorage,
  setStorage,
} from "./storage";
import { getParam, getSec } from "./commonLib";
/*デバッグ用
import { setfavurl } from "./test";
setfavurl();
*/
class Code {
  constructor(_pid, _code, _title, _search, _startSec) {
    this.code = _code;
    this.pid = _pid;
    this.title = _title;
    this.search = _search;
    this.startSec = _startSec;
  }
}
const msg = document.getElementById("btn");
const st = document.getElementById("startbtn");
const reset = document.getElementById("resetbtn");
const roop = document.getElementById("roop");
const hostUi = document.getElementById("hostUi");
hostUi.style.visibility = "hidden";
st.style.visibility = "hidden";
let playing = false;
//途中loadキャンセルフラグ
let tloadflg = false;
let endev;
receive(ws);
ws.addEventListener("message", () => {
  let json = JSON.parse(event.data);
  //console.log(`[LOG}message:${json.title}`);
  switch (json.title) {
    case "updateHost":
      voteStartCheck();
      hostUi.style.visibility = "visible";
      st.style.visibility = "visible";
      break;
    case "voteStart":
      if (playing) {
        playing = false;
        if (endev != undefined) {
          player.youtube.off(endev);
        }
      }
      let ev = player.youtube.on("stateChange", (event) => {
        if (
          event.data == PlayerState.PAUSED ||
          event.data == PlayerState.UNSTARTED
        ) {
          let data = {
            sender: user.id,
            title: "voteDone",
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
      setTweetButton(`${getStorage("video")[0].title}`);
      playerStart(startTime);
      if (user.isHost || getStorage("video")[0].pid == user.id) {
        st.style.visibility = "visible";
      } else {
        st.style.visibility = "hidden";
      }
      if (user.isHost) {
        let store = {
          video: getStorage("video")[0],
          startTime: startTime - user.lag,
          playing: true,
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
        console.log(
          `TLOAD:${getStorage("serverstats")[0].video.code},${startSec}`
        );
        player.youtube.loadVideoById(
          getStorage("serverstats")[0].video.code,
          startSec
        );
        tloadflg = true;
        let ev = player.youtube.on("stateChange", (event) => {
          if (
            event.data == PlayerState.PAUSED ||
            event.data == PlayerState.UNSTARTED
          ) {
            if (tloadflg) {
              setTweetButton(getStorage("serverstats")[0].video.title);
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
    case "skipReq":
      if (user.isHost) {
        skipVideo();
      }
  }
});
function viewVideoList() {
  let mesdocument = document.getElementById("messages");
  mesdocument.innerHTML = "";
  getStorage("videoLog").forEach(function (log, i) {
    if (i == getStorage("videoLog").length - 1) {
      mesdocument.innerHTML += `<div><B>PLAYING</B>→<a href= "https://www.youtube.com/watch?v=${log.code}" target="_blank">${log.title}</a> 🦴${log.search}🦴</div>`;
    } else {
      mesdocument.innerHTML += `<div><a href= "https://www.youtube.com/watch?v=${log.code}" target="_blank">${log.title}</a> 🦴${log.search}🦴</div>`;
    }
  });
  getStorage("video").forEach(function (log, i) {
    mesdocument.innerHTML += `<div><a href= "https://www.youtube.com/watch?v=${log.code}" target="_blank">${log.title}</a>🦴${log.search}🦴</div>`;
  });
  mesdocument.scrollTop = 24 * (getStorage("videoLog").length - 1);
}
function playerStart(time) {
  ableStateChange(IntroState.PLAYING);
  endev = player.youtube.on("stateChange", (event) => {
    //プレイヤー終了
    if (event.data == PlayerState.ENDED) {
      ableStateChange(IntroState.MUTE);
      playing = false;
      if (user.isHost) {
        let store = {
          playing: false,
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

let re = /^( |　)*$/g;
msg.addEventListener(
  "click",
  () => {
    let codeValue = document.getElementById("msg").value;
    ////startSec=0だと読み込んだ時に続きから始まる対策
    if (codeValue != "" && !re.test(codeValue)) {
      if (getParam("v", codeValue) != null) {
        youtubeDataApi(getParam("v", codeValue)).then((api) => {
          sendCode(
            api,
            `https://www.youtube.com/watch?v=${getParam("v", codeValue)}`,
            getParam("v", codeValue)
          );
        });
      } else {
        youtubeSearchApi(codeValue).then((api) => {
          sendCode(api, codeValue);
        });
      }
    } else {
      alert(`ふええリンクか検索ワードを入れてよお`);
    }
    document.getElementById("msg").value = "";
  },
  false
);

function sendCode(apiResult, codeValue, videoId = null) {
  let startSec = getSec(document.getElementById("ssec").value);
  startSec += 0.0001;
  if (apiResult.items.length != 0) {
    if (videoId == null) {
      videoId = apiResult.items[0].id.videoId;
    }
    pushStorage(
      "video",
      new Code(
        user.id,
        videoId,
        apiResult.items[0].snippet.title,
        codeValue,
        startSec
      )
    );
  } else {
    alert(`ふええ一件もヒットしないよう[${codeValue}]`);
  }
  document.getElementById("ssec").value = "";
}
st.addEventListener("click", skipVideo, false);
player.youtube.on("error", (event) => {
  console.log(`[LOG]:playerError->${event.data}`);
  skipVideo();
});
function skipVideo() {
  if (user.isHost) {
    playing = false;
    if (endev != undefined) {
      player.youtube.off(endev);
    }
    let store = {
      playing: false,
    };
    setStorage("serverstats", store);
    voteStartCheck();
  } else if (getStorage("serverstats")[0].playing) {
    if (user.id == getStorage("serverstats")[0].video.pid) {
      let data = {
        sender: user.id,
        title: "skipReq",
      };
      send(data);
    }
  }
}
reset.addEventListener(
  "click",
  () => {
    if (user.isHost) {
      clearStorage("videoLog");
      clearStorage("video");
    }
  },
  false
);
function voteStartCheck() {
  if (!playing) {
    if (getStorage("video").length == 0 && roop.checked) {
      getStorage("videoLog").forEach(function (log, i) {
        pushStorage("video", log);
      });
      clearStorage("videoLog");
    }
    if (getStorage("video").length != 0) {
      let data = {
        sender: user.id,
        title: "voteReq",
      };
      send(data);
    }
  }
}
/**
 * ツイートボタンを作成する
 * @param {ツイートする際のメッセージ} text
 */
function setTweetButton(text) {
  let as = document.getElementById("tweet-area");
  while (as.firstChild) {
    as.removeChild(as.firstChild);
  }
  twttr.widgets.createShareButton(
    "http://honepr.f5.si",
    document.getElementById("tweet-area"),
    {
      size: "nomal",
      text: text,
      hashtags: "ほねすとり～む",
    }
  );
}
