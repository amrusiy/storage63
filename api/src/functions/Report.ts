import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { groupBy } from "../utils";
import { authenticate } from "../auth";

app.http("Report", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items/{id}/report",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmosClient = new CosmosClient(connectionString);

      const user = await authenticate(request);
      const status = await request.text();
      if (!['active', 'faulty', 'lost'].some(_ => status === _))
        throw { status: 400, message: `Body should contain a valid status: active, faulty, lost. Found: '${status}'` }
      cosmosClient.database('db').container('items').item(request.params.id).patch({
        operations: [
          {
            path: '/history',
            op: 'add',
            value: {
              timestamp: Date.now(),
              userId: user.id,
              type: 'report',
              status,
            }
          },
          {
            path: '/status',
            op: 'replace',
            value: status
          }
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
