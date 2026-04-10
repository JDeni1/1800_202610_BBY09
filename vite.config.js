import { defineConfig } from "vite";

//Reads when running "npm run build"
export default defineConfig({
  publicDir: "public/static",
  build: {
    rollupOptions: {
      //Defines entry points within HTML Pages
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
