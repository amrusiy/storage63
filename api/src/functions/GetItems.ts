import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

app.http("GetItems", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const cosmosClient = new CosmosClient(
      process.env.COSMOSDB_CONNECTION_STRING
    );
    const { resources: items } = await cosmosClient
      .database("db")
      .container("items")
      .items.readAll()
      .fetchAll();

    try {
      return {
        status: 200,
        body: JSON.stringify(items),
      };
    } catch (error) {
      return {
        status: 500,
        body: error.message,
      };
    }
  },
  route: "items",
});
