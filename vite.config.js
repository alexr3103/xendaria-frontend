import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const buildVersion = Date.now().toString();

function xendariaVersionPlugin() {
  return {
    name: "xendaria-version",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ version: buildVersion }),
      });
    },
  };
}

export default defineConfig({
  define: {
    "import.meta.env.VITE_BUILD_VERSION": JSON.stringify(buildVersion),
  },
  plugins: [react(), xendariaVersionPlugin()],

  server: {
    port: 5173,
    strictPort: true,
  },
});
