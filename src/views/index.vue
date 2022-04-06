<template>
  <div class="w-full flex items-center justify-center">
    <span>WebRTC example project</span>
    <button class="bg-green p-6" @click="sayHello">
      Say Hello To Everyone
    </button>
    <button @click="startCall">Start Local Stream</button>
    <div class="flex w-full items-center justify-center">
      <span>Local</span>
      <video ref="localVideo" class="w-1/2 h-1/2" autoplay playsinline></video>
      <span>Remote</span>
      <div ref="videoEls"></div>
    </div>
  </div>
</template>

<script setup>
import { useRTCPeerConnection } from "@/composables/rtcpeerconnection.js";
import { useWebSocket } from "@/composables/websocket.js";
import { computed } from "@vue/reactivity";
import { nextTick, onMounted, ref, watch } from "vue";

const { ws, sendData } = useWebSocket();

const localVideo = ref();
const remoteVideos = ref([]);

const videoEls = ref();

const clients = ref([]);

const you = ref();

const pcs = ref([]);

const localStream = async () => {
  return await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
};

const msgs = ref([]);

ws.value.onmessage = function (data) {
  const payload = JSON.parse(data.data);

  if (payload.type === "message") {
    msgs.value.push(payload.data);
  }
  if (payload.type === "offer") {
    onOffer(payload.peer, payload.offer);
  }
  if (payload.type === "answer") {
    onAnswer(payload.peer, payload.answer);
  }
  if (payload.type === "candidate") {
    onCandidate(payload.peer, payload.candidate);
  }
  if (payload.type === "metadata") {
    you.value = payload.client;
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
  if (payload.type === "client-disconnected") {
    const index = clients.value.reduce((acc, curValue, curIndex) => {
      if (curValue.id === payload.client.id) {
        return curIndex;
      }
      return acc;
    }, -1);
    if (index >= 0) {
      clients.value.splice(index, 1);
      removePcs(payload.client);
    }
  }
};

function checkIfExists(arr, client) {
  return arr.reduce((acc, curValue) => {
    if (curValue.id === client.id) {
      return true;
    }
    return acc;
  }, false);
}

function setPcs(client) {
  const { pc } = useRTCPeerConnection();

  pcs.value.push({
    client,
    pc: pc.value,
  });

  addLocalStreamToAllPeerConnections(pc.value);

  pc.value.onicecandidate = function (event) {
    if (event.candidate) {
      sendData({
        type: "candidate",
        candidate: event.candidate,
        peer: you.value,
        to: client,
      });
    }
  };

  let tracked = false;

  pc.value.ontrack = function (event) {
    if (!tracked) {
      const stream = new MediaStream();
      if (event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          stream.addTrack(track);
        });
      }
      const el = document.createElement("video");
      el.classList.add(`index-${client.id}`);
      el.style.width = "100%";
      el.style.height = "100%";
      el.playsInline = true;
      el.autoplay = true;
      el.srcObject = stream;
      videoEls.value.appendChild(el);
      tracked = true;
    }
  };
}

function removePcs(client) {
  const index = pcs.value.reduce((acc, curValue, curIndex) => {
    if (curValue.client.id === client.id) {
      return curIndex;
    }
    return acc;
  }, -1);
  if (index >= 0) {
    pcs.value[index].pc.close();
    pcs.value.splice(index, 1);
  }
}

function sayHello() {
  const payload = {
    type: "message",
    message: "Message",
  };
  sendData(payload);
}

async function startCall() {
  for (let i = 0; i < pcs.value.length; i++) {
    await addLocalStreamToAllPeerConnections(pcs.value[i].pc);
    await createOffer(pcs.value[i]);
  }
}

async function addLocalStreamToAllPeerConnections(pc) {
  const stream = await localStream();
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

async function startLocalStream() {
  localVideo.value.srcObject = await localStream();
}

async function createOffer(data) {
  const offer = await data.pc.createOffer();
  const payload = {
    type: "offer",
    offer,
    peer: you.value,
    to: data.client,
  };
  sendData(payload);

  data.pc.setLocalDescription(offer);
}

async function onOffer(client, offer) {
  try {
    const index = getPC(pcs.value, client);
    let pc = index >= 0 ? pcs.value[index].pc : null;
    pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);

    const payload = {
      type: "answer",
      answer,
      peer: you.value,
      to: client,
    };

    sendData(payload);
  } catch (err) {
    console.log(err);
  }
}

function onAnswer(client, answer) {
  try {
    const index = getPC(pcs.value, client);
    let pc = index >= 0 ? pcs.value[index].pc : null;
    pc.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (err) {
    console.log(err);
  }
}

function onCandidate(client, candidate) {
  try {
    const index = getPC(pcs.value, client);
    let pc = index >= 0 ? pcs.value[index].pc : null;
    pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.log(err);
  }
}

function getPC(arr, client) {
  return arr.reduce((acc, curValue, curIndex) => {
    if (curValue.client.id === client.id) {
      return curIndex;
    }
    return acc;
  }, -1);
}

onMounted(() => {
  startLocalStream().then(() => {
    startCall();
  });
});
</script>
