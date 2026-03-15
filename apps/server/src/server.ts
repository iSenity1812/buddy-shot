import { createApp } from "./app";
import { envConfig } from "./shared/config/env.config";
import { createServer } from "http";
import { socketGateway } from "./shared/realtime/socket.gateway";

async function bootstrap() {
  const app = await createApp();
  const port = envConfig.port;
  const host = envConfig.host;
  const server = createServer(app);
  socketGateway.init(server);

  server.listen(port, host, () => {
    console.log(`Server is running on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
