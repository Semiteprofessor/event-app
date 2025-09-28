import { createServer } from "./app";
import http from "http";

async function main() {
  const app = await createServer();
  const port = process.env.PORT ?? 4000;
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`GraphQL server running at http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
