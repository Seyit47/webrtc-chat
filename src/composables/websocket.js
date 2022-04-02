import { ref, watch } from "vue";

export function useWebSocket() {
  let timer;
  const ws = ref();

  ws.value = connectToWS();

  function connectToWS() {
    return new WebSocket("ws://localhost:8080");
  }

  function reconnectToWS() {
    let newWS = connectToWS();

    newWS.onopen = function () {
      ws.value = connectToWS();
      clearTimeout(timer);
    };

    newWS.onerror = function (err) {
      console.error("Got error: ", err);
      timer = setTimeout(reconnectToWS, 1000);
    };
  }

  function sendData(payload) {
    ws.value.send(JSON.stringify(payload));
  }

  ws.value.onopen = function () {
    if (timer) {
      clearTimeout(timer);
    }
    console.log("Connected");
  };

  ws.value.onerror = function (err) {
    console.error("Got error: ", err);
    timer = setTimeout(reconnectToWS, 1000);
  };

  ws.value.onclose = function () {
    console.log("Connection closed");
    timer = setTimeout(reconnectToWS, 1000);
  };

  watch(ws, (val) => {
    if (val.onopen === null && val.readyState === 1) {
      ws.value = connectToWS();
    }
  });

  return {
    ws,
    sendData,
  };
}
