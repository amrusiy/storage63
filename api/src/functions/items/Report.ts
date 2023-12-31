import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../../auth";
import { ItemEvent } from "../../types";

app.http("Report", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items/{id}/report",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const user = await authenticate(request);
      const status = await request.text();
      if (!["active", "faulty", "lost"].some((_) => status === _))
        throw {
          status: 400,
          message: `Body should contain a valid status: active, faulty, lost. Found: '${status}'`,
        };
      const now = Date.now();
      await cosmos
        .database("db")
        .container("items")
        .item(request.params.id, request.params.id)
        .patch({
          operations: [
            {
              path: "/history/-",
              op: "add",
              value: {
                timestamp: now,
                createdByUserId: user.id,
                type: "report",
                status,
              } as ItemEvent,
            },
            {
              path: "/status",
              op: "replace",
              value: status,
            },
            {
              path: "/lastUpdate",
              op: "replace",
              value: now,
            },
          ],
        });
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
