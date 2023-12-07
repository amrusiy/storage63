import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

app.http("GetItems", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "items/{id?}",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmosClient = new CosmosClient(connectionString);

      async function getChildUnitIds(unitId: string): Promise<string[]> {
        const {
          resource: { childUnitIds },
        } = await cosmosClient
          .database("db")
          .container("units")
          .item(unitId)
          .read<{ childUnitIds: string[] }>();
        const childUnits = await (
          await Promise.all(
            childUnitIds.map(async (unitId) => await getChildUnitIds(unitId))
          )
        ).flat();
        return [unitId, ...childUnits];
      }

      // authorization
      const userId = request.headers.get("userId");
      const password = request.headers.get("password");
      const { resource: user } = await cosmosClient
        .database("db")
        .container("users")
        .item(userId)
        .read();
      if (!user) return { status: 401 };
      if (user.password !== password) return { status: 401 };

      if (request.params.id) {
        // Get specific item
      } else {
        // Get list of items
        const unitIds = getChildUnitIds(user.unitId);

        const { resources: items } = await cosmosClient
          .database("db")
          .container("items")
          .items.query("SELECT id,sku,status FROM items")
          .fetchAll();
        return {
          status: 200,
          body: JSON.stringify(items),
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: error.message,
      };
    }
  },
});
