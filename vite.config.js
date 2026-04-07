import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "public/login.html"),
        newPost: resolve(__dirname, "public/newPost.html"),
        profile: resolve(__dirname, "public/profile.html"),
        socialfeed: resolve(__dirname, "public/socialfeed.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
