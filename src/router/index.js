import { createRouter, createWebHistory } from "vue-router";
import DefaultLayout from "@/layouts/default.vue";
import MeshVersionView from "@/views/mesh-version.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: DefaultLayout,
      children: [
        {
          path: "",
          name: "MeshVersionView",
          component: MeshVersionView,
        },
        {
          path: "sfu",
          name: "SFUVersionView",
          component: () => import("../views/sfu-version.vue"),
        },
      ],
    },
    {
      path: "/login",
      name: "LoginView",
      component: () => import("../views/login.vue"),
    },
  ],
});

router.beforeEach

export default router;
