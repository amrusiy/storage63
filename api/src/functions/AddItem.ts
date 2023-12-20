import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../auth";

// Define the interface for the item data
interface ItemData {
  userId: string;
  unitId: string;
  sku: string;
  status: string;
  history: {
    timestamp: number;
    status: "active" | "faulty" | "lost";
    type: string;
  }[]; // adjust the type of history as needed
}

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
      const itemData: ItemData = (await request.json()) as any;

      // Validate required fields
      if (!["unitId", "sku", "status"].every((key) => itemData[key])) {
        throw { status: 400, body: "Missing required fields." };
      } else {
        itemData.userId = user.id;
        itemData.history = [
          {
            timestamp: Date.now(),
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
        body: newItem,
      };
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
  body: (item) => {},
});
