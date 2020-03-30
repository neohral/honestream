import { send } from "./websoket";
import { user } from "./userClient";
import { youtubeApiKey } from "./apikey";
const youtubeDataApi = async code => {
  try {
    const api = await fetch(
      `https://www.googleapis.com/youtube/v3/search?type=video&part=snippet&q=${code}&key=${youtubeApiKey}`
    ).then(res => res.json());
    return api;
  } catch (e) {
    console.error(e);
  }
};

//youtubeDataApi('HWiyRHY-UsU');
export { youtubeDataApi, send };
