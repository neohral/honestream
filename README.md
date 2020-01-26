# honestream

youtube をみんなでみよう

## メモ

### api キーについて

```javascript:apikey.js
export { youtubeApiKey };
const youtubeApiKey = "【apiキー】";
```

### lag の考え方
・server.time:10000
・client.time:10007
lag=client.time-server.time
→lag=7

### startTime の考え方

・server.startTime:20000
・starttime=server.starttime+lag
→startTime=20007
実際は startTime-nowTime して sec を決める
