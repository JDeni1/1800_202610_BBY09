import { defineConfig } from "vite";

//Reads when running "npm run build"
export default defineConfig({
  publicDir: "public/static",
  build: {
    rollupOptions: {
      //Defines entry points within HTML Pages
      input: {
        main: "index.html",
        login: "login.html",
        newPost: "newPost.html",
        profile: "profile.html",
        socialfeed: "socialfeed.html",
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
