import { ref } from "vue";

export function useRTCPeerConnection() {
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = ref();

  pc.value = new RTCPeerConnection(servers);

  return {
    pc,
  };
}
