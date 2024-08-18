// vite.config.js
import { vitePlugin as remix } from "file:///D:/Shopify/Recommendation-app/recommendation-app/node_modules/@remix-run/dev/dist/index.js";
import { defineConfig } from "file:///D:/Shopify/Recommendation-app/recommendation-app/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///D:/Shopify/Recommendation-app/recommendation-app/node_modules/vite-tsconfig-paths/dist/index.mjs";
if (process.env.HOST && (!process.env.SHOPIFY_APP_URL || process.env.SHOPIFY_APP_URL === process.env.HOST)) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}
var host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost").hostname;
var hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host,
    port: parseInt(process.env.FRONTEND_PORT) || 8002,
    clientPort: 443
  };
}
var vite_config_default = defineConfig({
  server: {
    port: Number(process.env.PORT || 3e3),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"]
    }
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"]
    }),
    tsconfigPaths()
  ],
  build: {
    assetsInlineLimit: 0
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxTaG9waWZ5XFxcXFJlY29tbWVuZGF0aW9uLWFwcFxcXFxyZWNvbW1lbmRhdGlvbi1hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFNob3BpZnlcXFxcUmVjb21tZW5kYXRpb24tYXBwXFxcXHJlY29tbWVuZGF0aW9uLWFwcFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovU2hvcGlmeS9SZWNvbW1lbmRhdGlvbi1hcHAvcmVjb21tZW5kYXRpb24tYXBwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gXCJAcmVtaXgtcnVuL2RldlwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xyXG5cclxuLy8gUmVsYXRlZDogaHR0cHM6Ly9naXRodWIuY29tL3JlbWl4LXJ1bi9yZW1peC9pc3N1ZXMvMjgzNSNpc3N1ZWNvbW1lbnQtMTE0NDEwMjE3NlxyXG4vLyBSZXBsYWNlIHRoZSBIT1NUIGVudiB2YXIgd2l0aCBTSE9QSUZZX0FQUF9VUkwgc28gdGhhdCBpdCBkb2Vzbid0IGJyZWFrIHRoZSByZW1peCBzZXJ2ZXIuIFRoZSBDTEkgd2lsbCBldmVudHVhbGx5XHJcbi8vIHN0b3AgcGFzc2luZyBpbiBIT1NULCBzbyB3ZSBjYW4gcmVtb3ZlIHRoaXMgd29ya2Fyb3VuZCBhZnRlciB0aGUgbmV4dCBtYWpvciByZWxlYXNlLlxyXG5pZiAoXHJcbiAgcHJvY2Vzcy5lbnYuSE9TVCAmJlxyXG4gICghcHJvY2Vzcy5lbnYuU0hPUElGWV9BUFBfVVJMIHx8XHJcbiAgICBwcm9jZXNzLmVudi5TSE9QSUZZX0FQUF9VUkwgPT09IHByb2Nlc3MuZW52LkhPU1QpXHJcbikge1xyXG4gIHByb2Nlc3MuZW52LlNIT1BJRllfQVBQX1VSTCA9IHByb2Nlc3MuZW52LkhPU1Q7XHJcbiAgZGVsZXRlIHByb2Nlc3MuZW52LkhPU1Q7XHJcbn1cclxuXHJcbmNvbnN0IGhvc3QgPSBuZXcgVVJMKHByb2Nlc3MuZW52LlNIT1BJRllfQVBQX1VSTCB8fCBcImh0dHA6Ly9sb2NhbGhvc3RcIilcclxuICAuaG9zdG5hbWU7XHJcbmxldCBobXJDb25maWc7XHJcblxyXG5pZiAoaG9zdCA9PT0gXCJsb2NhbGhvc3RcIikge1xyXG4gIGhtckNvbmZpZyA9IHtcclxuICAgIHByb3RvY29sOiBcIndzXCIsXHJcbiAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxyXG4gICAgcG9ydDogNjQ5OTksXHJcbiAgICBjbGllbnRQb3J0OiA2NDk5OSxcclxuICB9O1xyXG59IGVsc2Uge1xyXG4gIGhtckNvbmZpZyA9IHtcclxuICAgIHByb3RvY29sOiBcIndzc1wiLFxyXG4gICAgaG9zdDogaG9zdCxcclxuICAgIHBvcnQ6IHBhcnNlSW50KHByb2Nlc3MuZW52LkZST05URU5EX1BPUlQpIHx8IDgwMDIsXHJcbiAgICBjbGllbnRQb3J0OiA0NDMsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IE51bWJlcihwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDApLFxyXG4gICAgaG1yOiBobXJDb25maWcsXHJcbiAgICBmczoge1xyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9zZXJ2ZXItb3B0aW9ucy5odG1sI3NlcnZlci1mcy1hbGxvdyBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAgICBhbGxvdzogW1wiYXBwXCIsIFwibm9kZV9tb2R1bGVzXCJdLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlbWl4KHtcclxuICAgICAgaWdub3JlZFJvdXRlRmlsZXM6IFtcIioqLy4qXCJdLFxyXG4gICAgfSksXHJcbiAgICB0c2NvbmZpZ1BhdGhzKCksXHJcbiAgXSxcclxuICBidWlsZDoge1xyXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDAsXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFUsU0FBUyxjQUFjLGFBQWE7QUFDOVcsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxtQkFBbUI7QUFLMUIsSUFDRSxRQUFRLElBQUksU0FDWCxDQUFDLFFBQVEsSUFBSSxtQkFDWixRQUFRLElBQUksb0JBQW9CLFFBQVEsSUFBSSxPQUM5QztBQUNBLFVBQVEsSUFBSSxrQkFBa0IsUUFBUSxJQUFJO0FBQzFDLFNBQU8sUUFBUSxJQUFJO0FBQ3JCO0FBRUEsSUFBTSxPQUFPLElBQUksSUFBSSxRQUFRLElBQUksbUJBQW1CLGtCQUFrQixFQUNuRTtBQUNILElBQUk7QUFFSixJQUFJLFNBQVMsYUFBYTtBQUN4QixjQUFZO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUNGLE9BQU87QUFDTCxjQUFZO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDVjtBQUFBLElBQ0EsTUFBTSxTQUFTLFFBQVEsSUFBSSxhQUFhLEtBQUs7QUFBQSxJQUM3QyxZQUFZO0FBQUEsRUFDZDtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLElBQ04sTUFBTSxPQUFPLFFBQVEsSUFBSSxRQUFRLEdBQUk7QUFBQSxJQUNyQyxLQUFLO0FBQUEsSUFDTCxJQUFJO0FBQUE7QUFBQSxNQUVGLE9BQU8sQ0FBQyxPQUFPLGNBQWM7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLG1CQUFtQixDQUFDLE9BQU87QUFBQSxJQUM3QixDQUFDO0FBQUEsSUFDRCxjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLG1CQUFtQjtBQUFBLEVBQ3JCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
