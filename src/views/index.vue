<template>
  <div class="w-full flex items-center justify-center">
    <span>WebRTC example project</span>
    <button class="bg-green p-6" @click="sayHello">
      Say Hello To Everyone
    </button>
    <button @click="startCall">Start Local Stream</button>
    <div class="flex w-full items-center justify-center">
      <span>Local</span>
      <video
        ref="localVideo"
        class="w-full h-full"
        autoplay
        playsinline
      ></video>
      <span>Remote</span>
      <video
        ref="remoteVideo"
        class="w-full h-full"
        autoplay
        playsinline
      ></video>
    </div>
  </div>
</template>

<script setup>
import { useRTCPeerConnection } from "@/composables/rtcpeerconnection.js";
import { useWebSocket } from "@/composables/websocket.js";
import { onMounted, ref } from "vue";

const { ws, sendData } = useWebSocket();
const { pc } = useRTCPeerConnection();

const localVideo = ref();
const remoteVideo = ref();

let localStream = null;
let remoteStream = null;

const msgs = ref([]);

ws.value.onmessage = function (data) {
  const payload = JSON.parse(data.data);

  console.log(payload);

  if (payload.type === "message") {
    msgs.value.push(payload.data);
  }
  if (payload.type === "offer") {
    onOffer(payload.offer);
  }
  if (payload.type === "answer") {
    onAnswer(payload.answer);
  }
  if (payload.type === "candidate") {
    onCandidate(payload.candidate);
  }
};

pc.value.onicecandidate = function (event) {
  if (event.candidate) {
    sendData({
      type: "candidate",
      candidate: event.candidate,
    });
  }
};
remoteStream = new MediaStream();

pc.value.ontrack = function (event) {
  event.streams[0].getTracks().forEach((track) => {
    remoteStream.addTrack(track);
  });
  remoteVideo.value.srcObject = remoteStream;
};

function sayHello() {
  const payload = {
    type: "message",
    message: "Message",
  };
  sendData(payload);
}

function startCall() {
  createOffer();
}

async function startLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localStream.getTracks().forEach((track) => {
    pc.value.addTrack(track, localStream);
  });

  localVideo.value.srcObject = localStream;
}

async function createOffer() {
  const offer = await pc.value.createOffer();
  const payload = {
    type: "offer",
    offer,
  };
  console.log(payload);
  sendData(payload);

  pc.value.setLocalDescription(offer);
}

async function onOffer(offer) {
  pc.value.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.value.createAnswer();
  pc.value.setLocalDescription(answer);

  const payload = {
    type: "answer",
    answer,
  };

  sendData(payload);
}

function onAnswer(answer) {
  pc.value.setRemoteDescription(new RTCSessionDescription(answer));
}

function onCandidate(candidate) {
  pc.value.addIceCandidate(new RTCIceCandidate(candidate));
}

onMounted(() => {
  startLocalStream();
});
</script>
