import { createServer } from "vite";

(async () => {
  const server = await createServer({
    server: {
      host: "0.0.0.0",
      port: 5000,
      proxy: {},
      allowedHosts: true,
    },
  });
  await server.listen();
  server.printUrls();
})();
