import { createApp } from "vue";
import router from "@/router";
import App from "./App.vue";
import "./assets/css/tailwind.css";

const ws = new WebSocket("ws://localhost:8080");

const app = createApp(App);
app.use(router);
app.mount("#app");
