<template>
  <div class="w-full flex items-center justify-center">
    <span>WebRTC example project</span>
    <button class="bg-green p-6" @click="sayHello">
      Say Hello To Everyone
    </button>
    <button @click="startLocalStream">Start Local Stream</button>
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
import { ref } from "vue";

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

function sayHello() {
  const payload = {
    type: "message",
    message: "Message",
  };
  sendData(payload);
}

async function startLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  remoteStream = new MediaStream();

  localStream.getTracks().forEach((track) => {
    pc.value.addTrack(track, localStream);
  });

  pc.value.ontrack = function (event) {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  localVideo.value.srcObject = localStream;
  remoteVideo.value.srcObject = remoteStream;

  createOffer();
}

function createOffer() {
  pc.value.createOffer((offer) => {
    const payload = {
      type: "offer",
      offer,
    };
    console.log(payload);
    sendData(payload);

    pc.value.setLocalDescription(offer);
  });
}

function onOffer(offer) {
  pc.value.setRemoteDescription(new RTCSessionDescription(offer));

  pc.value.createAnswer((answer) => {
    pc.value.setLocalDescription(answer);

    const payload = {
      type: "answer",
      answer,
    };

    sendData(payload);
  });
}

function onAnswer(answer) {
  pc.value.setRemoteDescription(new RTCSessionDescription(answer));
}

function onCandidate(candidate) {
  pc.value.addIceCandidate(new RTCIceCandidate(candidate));
}
</script>
