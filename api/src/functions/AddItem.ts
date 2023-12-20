import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../auth";
import { Item } from "../types";

app.http("AddItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const user = await authenticate(request);

      // Parse the incoming request body to get the item data
      const itemData: Item = (await request.json()) as Item;

      // Validate required fields
      if (!["id", "unitId", "sku", "status"].every((key) => itemData[key])) {
        throw { status: 400, message: "Missing required fields." };
      } else {
        itemData.userId = user.id;
        itemData.history = [
          {
            timestamp: Date.now(),
            createdByUserId: user.id,
            type: "create",
          },
        ];
      }
      // Add the item to the Cosmos DB container
      const { resource: newItem } = await cosmos
        .database("db")
        .container("items")
        .items.create(itemData);

      return {
        status: 200,
        body: JSON.stringify(newItem),
      };
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
