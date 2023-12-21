import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../../auth";

export async function getChildUnitIds(unitId: string): Promise<string[]> {
  const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
  const cosmos = new CosmosClient(connectionString);
  const {
    resource: { childUnitIds },
  } = await cosmos
    .database("db")
    .container("units")
    .item(unitId, unitId)
    .read<{ childUnitIds: string[] }>();
  const childUnits = (await Promise.all(
    (childUnitIds ?? []).map(async (unitId) => await getChildUnitIds(unitId))
  )).flat();
  return [unitId, ...childUnits];
}

app.http("GetUnits", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "units/{id?}",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      const user = await authenticate(request);
      
      if (request.params.id) {
        // Get specific item
        const { resource: item } = await cosmos
          .database("db")
          .container("units")
          .item(request.params.id, request.params.id)
          .read();
        return {
          status: item ? 200 : 404,
          body: item ? JSON.stringify(item) : `unit with the id ${request.params.id} was not found.`
        }
      } else {
        // Get list of items
        const { resources: items } = await cosmos
          .database("db")
          .container("units")
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
