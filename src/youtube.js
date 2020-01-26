import { send } from "./websoket";
import { user } from "./userClient";
import { youtubeApiKey } from "./apikey";
const youtubeDataApi = async code => {
  try {
    const api = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${code}&key=${youtubeApiKey}&part=snippet,contentDetails`
    ).then(res => res.json());
    let data = {
      sender: user.id,
      title: "sendCode",
      videoTitle: api.items[0].snippet.title,
      code: api.items[0].id
    };
    send(data);
    return api;
  } catch (e) {
    console.error(e);
  }
};

//youtubeDataApi('HWiyRHY-UsU');
export { youtubeDataApi, send };
