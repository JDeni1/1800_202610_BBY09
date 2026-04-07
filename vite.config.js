import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public/static",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "public/login.html",
        newPost: "public/newPost.html",
        profile: "public/profile.html",
        socialfeed: "public/socialfeed.html",
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
