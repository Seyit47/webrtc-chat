import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "MeshVersionView",
      component: () => import("../views/mesh-version.vue"),
    },
    {
      path: "/sfu",
      name: "SFUVersionView",
      component: () => import("../views/sfu-version.vue"),
    },
  ],
});

export default router;
