import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../auth";
import { ItemEvent } from "../types";

app.http("Transfer", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items/{id}/transfer",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const user = await authenticate(request);
      const transferToUserId = await request.text();
      if ((await cosmos.database('db').container('users').item(transferToUserId).read()).statusCode === 404)
        throw { status: 404, message: `User with the specified was not found.` }
      cosmos.database('db').container('items').item(request.params.id).patch({
        operations: [
          {
            path: '/history',
            op: 'add',
            value: {
              timestamp: Date.now(),
              userId: user.id,
              type: 'transfer',
              transferToUserId,
            } as ItemEvent
          },
          {
            path: '/userId',
            op: 'replace',
            value: transferToUserId
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
