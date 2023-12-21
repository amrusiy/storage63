import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../../auth";
import { SKU } from "../../types";

app.http("CreateSKU", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "skus",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      await authenticate(request);
      const data = await request.json() as SKU;
      if (!data.sku)
        throw { status: 400, message: 'SKU is missing.' };
      const { resource: { id } } = await cosmos.database('db').container('skus').items.create<SKU>(data);
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
