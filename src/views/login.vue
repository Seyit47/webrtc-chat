<template>
  <div class="w-[100vw] h-screen flex justify-center items-center">
    <form @submit.prevent="onSubmit">
      <div
        class="
          w-[30vw]
          h-[30vh]
          bg-white
          shadow-xl
          flex flex-col
          items-center
          justify-center
        "
      >
        <span class="text-2xl font-medium pb-4">Login into meet app</span>
        <div class="flex flex-col justify-center items-center">
          <span> Your name </span>
          <input
            type="text"
            v-model="name"
            class="border shadow rounded focus:outline-none px-2 py-1"
            :style="{ borderColor: error ? 'rgb(239, 68, 68)' : '' }"
          />
        </div>
        <button class="mt-[5vh] rounded bg-blue-500 text-white px-4 py-2">
          Login
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed } from "@vue/reactivity";
import { ref, watch } from "vue";
import { useWebSocket } from "../composables/websocket";
import router from "../router";
import { useAuthStore } from "../store/auth";

const { setName } = useAuthStore();
const { ws, sendData } = useWebSocket();

ws.value.onmessage = function (data) {
  const payload = JSON.parse(data.data);
  if (payload.type === "login-success") {
    setName(payload.data);
    router.push({
      path: "/",
    });
  }
};

const auth = localStorage.getItem("auth");
const isAuthenticated = JSON.parse(auth);

if (isAuthenticated) {
  router.push({
    path: "/",
  });
}

const name = ref("");

const typed = ref(false);

watch(name, () => {
  typed.value = true;
});

const error = computed(() => {
  if (name.value.length < 6 && typed.value) {
    return true;
  }
  return false;
});

function onSubmit() {
  if (name.value.length < 6) {
    return;
  }
  sendData({
    type: "login",
    data: {
      name: name.value,
    },
  });
}
</script>
