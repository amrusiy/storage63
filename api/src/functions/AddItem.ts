import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { groupBy } from "../utils";

app.http("AddItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "additem",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmosClient = new CosmosClient(connectionString);

      // authorization
      const userId = request.headers.get("userId");
      const password = request.headers.get("password");

      if (!userId || !password) return { status: 401 };

      const { resource: user } = await cosmosClient
        .database("db")
        .container("users")
        .item(userId, userId)
        .read();
      if (!user || user.password !== password) return { status: 401 };

      // Parse the incoming request body to get the item data
      const itemData = request.body;

      // Validate required fields
      if (
        !itemData.userId ||
        !itemData.unitId ||
        !itemData.sku ||
        !itemData.status
      ) {
        return { status: 400, body: "Missing required fields." };
      }

      // Add the item to the Cosmos DB container
      const { resource: newItem } = await cosmosClient
        .database("db")
        .container("items")
        .items.create(itemData);

      return {
        status: 200,
        body: newItem,
      };
    } catch (error) {
      return {
        status: 500,
        body: error.message,
      };
    }
  },
});
