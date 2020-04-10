/**
 * URLからパラメータの値を取得する
 * @param {取得するパラメータ} name
 * @param {URL} url
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
/**
 * コンマ区切りの時間から秒を出力
 * @param {:区切りの時間} str
 */
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
export { getParam, getSec };
