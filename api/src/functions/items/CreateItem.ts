import { app } from "@azure/functions";
import { CosmosClient, ItemDefinition } from "@azure/cosmos";
import { authenticate } from "../../auth";
import { Item, SKU, Unit } from "../../types";

app.http("CreateItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const user = await authenticate(request);

      // Parse the incoming request body to get the item data
      const itemData: Item = (await request.json()) as any;

      // Validate required properties
      if (!["unitId", "skuId", "status"].every((key) => itemData[key])) {
        throw { status: 400, body: "Missing required properties." };
      } else {
        itemData.userId = user.id;
        itemData.unitName = (
          await cosmos
            .database("db")
            .container("units")
            .item(itemData.skuId)
            .read<Unit>()
        ).resource.name;
        itemData.sku = (
          await cosmos
            .database("db")
            .container("skus")
            .item(itemData.skuId)
            .read<SKU>()
        ).resource.sku;
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
        body: newItem,
      };
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
