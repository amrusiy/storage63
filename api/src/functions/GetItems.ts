import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { groupBy } from "../utils";

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
          .item(unitId, unitId)
          .read<{ childUnitIds: string[] }>();
        const childUnits = (await Promise.all(
          (childUnitIds ?? []).map(async (unitId) => await getChildUnitIds(unitId))
        )).flat();
        return [unitId, ...childUnits];
      }

      // authorization
      const userId = request.headers.get("userId");
      const password = request.headers.get("password");
      const group = request.headers.get("groupBy");
    
      if (!userId || !password) return { status: 400 }

      const { resource: user } = await cosmosClient
        .database("db")
        .container("users")
        .item(userId, userId)
        .read();
      if (!user || user.password !== password) return { status: 401 };
      
      if (request.params.id) {
        // Get specific item
        const { resource: item } = await cosmosClient
          .database("db")
          .container("items")
          .item(request.params.id, request.params.id)
          .read();
        return {
          status: item ? 200 : 404,
          body: JSON.stringify(item)
        }
      } else {
        // Get list of items
        const unitIds = await getChildUnitIds(user.unitId);
        const { resources: items } = await cosmosClient
          .database("db")
          .container("items")
          .items.query(`SELECT i.id, i.sku, i.status, i.unitId FROM items i WHERE i.unitId IN (${unitIds.map(id => `"${id}"`).join()})`)
          .fetchAll();
        return {
          status: 200,
          body: JSON.stringify(group
            ? Object
              .entries(groupBy(items, group))
              .map(_ => ({
                  [group]: _[0],
                  items: _[1]
              })
            )
            : items
          ),
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
