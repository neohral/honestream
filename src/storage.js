import { user } from "./userClient";
import { ws, send } from "./websoket";

//Storage
class Storage {
  constructor(id, obj) {
    this.id = id;
    this.obj = obj;
  }
}
let storages = [];
function getStorage(id) {
  let storage = null;
  storages.forEach(function (con, i) {
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
function pushStorage(id, object) {
  getStorage(id).push(object);
  updateStorage(id);
}
function pushStorages(id, object) {
  object.forEach(function (video, i) {
    getStorage(id).push(video);
  });
  updateStorage(id);
}
function setStorage(id, object) {
  getStorage(id)[0] = object;
  updateStorage(id);
}
function removeStorage(id, num) {
  getStorage(id).splice(num, 1);
  updateStorage(id);
}
function clearStorage(id) {
  getStorage(id).splice(0, getStorage(id).length);
  updateStorage(id);
}
function updateStorage(id) {
  let data = {
    title: "storage_update",
    sender: user.id,
    id: id,
    storages: JSON.stringify(storages),
  };
  send(data);
}
ws.addEventListener("message", () => {
  let json = JSON.parse(event.data);
  switch (json.title) {
    case "sync_storage":
      storages = JSON.parse(json.storages);
      break;
  }
});
export {
  getStorage,
  pushStorage,
  removeStorage,
  updateStorage,
  setStorage,
  clearStorage,
  pushStorages,
  storages,
};
