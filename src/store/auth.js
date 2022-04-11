import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const auth = useLocalStorage("auth", "null");

  function setName(name) {
    const json = JSON.stringify({
      name: name,
    });
    auth.value = json;
  }

  return { auth, setName };
});
