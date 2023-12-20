import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { groupBy } from "../utils";
import { authenticate } from "../auth";

app.http("Report", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items/{id?}/report",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmosClient = new CosmosClient(connectionString);

      const user = await authenticate(request);
      cosmosClient.database('db').container('items').item(request.params.id).patch({
        operations: [
          { path: '/history', op: 'add', value: {
            timestamp: Date.now(),
            userId: user.id,
            status: (await request.json() as any)?.status,
            type: (await request.json() as any)?.type,
            transferedToUserId: "8271234"
          } }
        ]
      })

    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
