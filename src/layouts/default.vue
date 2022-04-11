<template>
  <div class="w-full h-full">
    <RouterView />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "../router";

const route = useRoute();

onMounted(() => {
  const auth = localStorage.getItem("auth");
  const parsed = JSON.parse(auth);
  if (!parsed) {
    router.push({
      name: "LoginView",
      path: "/login",
    });
  }
});
</script>
