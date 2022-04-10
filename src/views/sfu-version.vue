<template>
  <div class="w-full flex items-center justify-center">
    <span>WebRTC example project</span>
    <button @click="toggleVideo">
      {{ videoEnabled ? "Disable video" : "Enable video" }}
    </button>
    <button @click="toggleAudio">
      {{ audioEnabled ? "Disable audio" : "Enable audio" }}
    </button>
    <div class="flex w-full items-center justify-center">
      <span>Local</span>
      <video ref="localVideo" class="w-1/2 h-1/2" autoplay playsinline></video>
      <span>Remote</span>
      <div ref="videoEls">
        <video ref="remoteVideo" class="w-full h-full" autoplay></video>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "@vue/reactivity";
import { onMounted, ref, watch } from "vue";
import { useWebSocket } from "../composables/websocket";

const { ws, sendData } = useWebSocket();

const localStream = ref();
const localVideo = ref();

const videoEnabled = ref(false);
const audioEnabled = ref(false);

const mediaSource = ref();

const videoEls = ref();

const remoteVideo = ref();

const clients = ref([]);

const videoBuffer = ref();

ws.value.onmessage = function (data) {
  const payload = JSON.parse(data.data);
  console.log(payload);

  if (payload.type === "call-stream") {
    const arrayBuffer = atob(payload.stream);
    videoBuffer.value.appendBuffer(arrayBuffer);
  }

  if (payload.type === "new-client") {
    let pushed = false;
    if (clients.value.length === 0) {
      clients.value.push(payload.client);
      setPcs(payload.client);
      pushed = true;
    }
    if (!checkIfExists(clients.value, payload.client) && !pushed) {
      clients.value.push(payload.client);
      setPcs(payload.client);
    }
  }
};

function toggleVideo() {
  const stream = localStream.value;
  const enabled = stream.getVideoTracks()[0].enabled;
  if (enabled) {
    stream.getVideoTracks()[0].enabled = false;
    videoEnabled.value = false;
  } else {
    stream.getVideoTracks()[0].enabled = true;
    videoEnabled.value = true;
  }
}

function toggleAudio() {
  const stream = localStream.value;
  const enabled = stream.getAudioTracks()[0].enabled;
  if (enabled) {
    stream.getAudioTracks()[0].enabled = false;
    audioEnabled.value = false;
  } else {
    stream.getAudioTracks()[0].enabled = true;
    audioEnabled.value = true;
  }
}

async function startLocalStream() {
  localVideo.value.srcObject = localStream.value;
  localStream.value.onstarted = function (e) {
    console.log(e);
  };
}

let recorder = null;

const onsuccess = (stream) => {
  recorder = new MediaRecorder(stream, {
    mimeType: "video/webm",
  });

  recorder.ondataavailable = (e) => {
    let reader = new FileReader();
    let arrayBuffer;

    reader.onloadend = () => {
      arrayBuffer = reader.result;
      sendData({
        type: "stream",
        stream: btoa(reader.result),
      });
    };

    reader.readAsArrayBuffer(e.data);
  };

  recorder.start();

  setInterval(() => {
    recorder.requestData();
  }, 1000);
};

onMounted(() => {
  // navigator.mediaDevices
  //   .getUserMedia({
  //     video: true,
  //     audio: true,
  //   })
  //   .then((stream) => {
  //     localStream.value = stream;
  //     localStream.value.getVideoTracks().forEach((track) => {
  //       sendData({
  //         type: "stream",
  //         track,
  //       });
  //     });
  //     audioEnabled.value = true;
  //     videoEnabled.value = true;
  //     startLocalStream();
  //   });
  mediaSource.value = new MediaSource();
  remoteVideo.value.src = URL.createObjectURL(mediaSource.value);
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then(onsuccess);
});
</script>
