const favVideo = [
  "https://www.youtube.com/watch?v=WlRKXA5c0Kg",
  "https://www.youtube.com/watch?v=07wI9lB_9zk",
  "https://www.youtube.com/watch?v=N5hInoyU-WY",
  "https://www.youtube.com/watch?v=_2Y6XSZdQqM",
  "https://www.youtube.com/watch?v=fdrni61hbm8",
  "https://www.youtube.com/watch?v=FzqIL3vcdhQ",
  "https://www.youtube.com/watch?v=76XVyEdl3oQ"
];
const favRnd = Math.floor(Math.random() * favVideo.length);
const setfavurl = () => {
  document.getElementById("msg").value = favVideo[favRnd];
};
export { setfavurl };
