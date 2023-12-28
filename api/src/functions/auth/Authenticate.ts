import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

app.http("Authenticate", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const { resources } = await cosmos
        .database("db")
        .container("users")
        .items.query(
          `SELECT u.id FROM users u WHERE u.username = "${request.headers.get(
            "username"
          )}" AND u.password = "${request.headers.get(
            "password"
          )}" OFFSET 0 LIMIT 1`
        )
        .fetchAll();

      return {
        status: resources.length ? 200 : 403,
        body: resources?.[0]?.id,
      };
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
