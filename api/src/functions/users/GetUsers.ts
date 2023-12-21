import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { groupBy } from "../../utils";
import { authenticate } from "../../auth";

app.http("GetUsers", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/{id?}",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const user = await authenticate(request);
      
      if (request.params.id) {
        // Get specific item
        const { resource: item } = await cosmos
          .database("db")
          .container("users")
          .item(request.params.id, request.params.id)
          .read();
        return {
          status: item ? 200 : 404,
          body: JSON.stringify(item)
        }
      } else {
        // Get list of items
        const { resources: items } = await cosmos
          .database("db")
          .container("items")
          .items.readAll()
          .fetchAll();
        return {
          status: 200,
          body: JSON.stringify(items),
        };
      }
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message
      };
    }
  },
});
