import { send } from "./websoket";
import { user } from "./userClient";
import { youtubeApiKey } from "./apikey";
const youtubeSearchApi = async (search) => {
  try {
    const api = await fetch(
      `https://www.googleapis.com/youtube/v3/search?type=video&part=snippet&q=${search}&key=${youtubeApiKey}`
    ).then((res) => res.json());
    return api;
  } catch (e) {
    console.error(e);
  }
};
const youtubeDataApi = async (code) => {
  try {
    const api = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${code}&part=snippet&key=${youtubeApiKey}`
    ).then((res) => res.json());
    return api;
  } catch (e) {
    console.error(e);
  }
};
const youtubePlayListApi = async (code) => {
  try {
    const api = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${code}&maxResults=50&part=snippet&key=${youtubeApiKey}`
    ).then((res) => res.json());
    return api;
  } catch (e) {
    console.error(e);
  }
};
//youtubeDataApi('HWiyRHY-UsU');
export { youtubeSearchApi, youtubeDataApi, youtubePlayListApi, send };
