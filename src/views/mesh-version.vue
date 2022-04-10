<template>
  <div
    class="w-full min-h-screen flex items-center justify-center bg-custom-black"
  >
    <div
      class="w-full flex flex-wrap items-center justify-center mb-[6vh]"
      ref="videoEls"
    >
      <div class="mx-[1vw] my-[1vh] relative">
        <video ref="localVideo" class="rounded-xl" autoplay playsinline></video>
        <span
          class="absolute bottom-[1vw] left-[1vw] text-white font-bold"
          style="text-shadow: 2px 2px rgba(0, 0, 0, 0.4)"
          >You</span
        >
      </div>
    </div>
    <div
      class="
        fixed
        bottom-0
        w-full
        flex
        items-center
        justify-center
        py-4
        bg-custom-black
      "
    >
      <span
        ref="clock"
        class="absolute text-white font-medium left-[2vw]"
      ></span>
      <button
        class="bg-custom-gray rounded-full p-2 mr-4"
        :style="{
          'background-color': !audioEnabled ? 'rgb(239, 68, 68)' : '',
        }"
        @click="toggleAudio"
      >
        <IconMicrophone />
      </button>
      <button
        class="rounded-full p-2 bg-custom-gray mr-4"
        :style="{
          'background-color': !videoEnabled ? 'rgb(239, 68, 68)' : '',
        }"
        @click="toggleVideo"
      >
        <IconCamera />
      </button>
      <button class="bg-red-500 rounded-full p-2" @click="closeWindow">
        <IconPhone />
      </button>
    </div>
  </div>
</template>

<script setup>
import IconPhone from "@/components/icons/IconPhone.vue";
import IconCamera from "@/components/icons/IconCamera.vue";
import IconMicrophone from "@/components/icons/IconMicrophone.vue";
import { useRTCPeerConnection } from "@/composables/rtcpeerconnection.js";
import { useWebSocket } from "@/composables/websocket.js";
import { onMounted, ref } from "vue";

const { ws, sendData } = useWebSocket();

const localVideo = ref();

const videoEnabled = ref(false);
const audioEnabled = ref(false);

const videoEls = ref();

const clients = ref([]);

const you = ref();

const pcs = ref([]);
const clock = ref();

const remoteVideos = ref([]);

const localStream = ref();

function setClock() {
  var date = new Date();
  var h = date.getHours();
  var m = date.getMinutes();
  var session = "AM";

  if (h == 0) {
    h = 12;
  }

  if (h > 12) {
    h = h - 12;
    session = "PM";
  }

  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;

  var time = h + ":" + m + " " + session;

  clock.value.innerText = time;
}

function closeWindow() {
  window.close();
}

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
  if (payload.type === "video-toggle") {
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
    const el = document.querySelector(`.index-${payload.client.id}`);
    videoEls.value.removeChild(el);
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
      let count = pcs.value.length + 1;
      if (event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          stream.addTrack(track);
        });
      }
      if (count > 4) {
        count = 4;
      }
      const con = 100 / count - 2;
      pcs.value.forEach((peer) => {
        if (client.id !== peer.client.id) {
          const el = document.querySelector(`.index-${peer.client.id}`);
          if (el) {
            el.style.width = con + "vw";
          }
        }
      });

      localVideo.value.style.width = con + "vw";
      const el = document.createElement("video");
      el.style.width = con + "vw";
      el.classList.add(`index-${client.id}`);
      el.classList.add("rounded-xl");
      el.classList.add("mx-[1vw]");
      el.classList.add("my-[1vh]");
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
    let count = pcs.value.length + 1;
    if (count === 1) {
      localVideo.value.style.width = "auto";
    } else {
      const con = 100 / count - 2;
      pcs.value.forEach((peer) => {
        if (client.id !== peer.client.id) {
          const el = document.querySelector(`.index-${peer.client.id}`);
          if (el) {
            el.style.width = con + "vw";
          }
        }
      });
      localVideo.value.style.width = con + "vw";
    }
  }
}

async function startCall() {
  for (let i = 0; i < pcs.value.length; i++) {
    await addLocalStreamToAllPeerConnections(pcs.value[i].pc);
    await createOffer(pcs.value[i]);
  }
}

async function addLocalStreamToAllPeerConnections(pc) {
  const stream = localStream.value;
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

async function startLocalStream() {
  localVideo.value.srcObject = localStream.value;
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
  setClock();
  setInterval(setClock, 1000);
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      localStream.value = stream;
      videoEnabled.value = true;
      audioEnabled.value = true;
      startLocalStream().then(() => {
        startCall();
      });
    });
});
</script>
