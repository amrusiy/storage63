import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from "../../auth";
import { Unit } from "../../types";

app.http("CreateUnit", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "units",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      await authenticate(request);
      const data = await request.json() as Unit;
      if (!data.name)
        throw { status: 400, message: 'Unit name is missing.' };
      const { resource: { id } } = await cosmos.database('db').container('users').items.create<Unit>(data);
      if (data.parentUnitId)
        cosmos.database('db').container('units').item(data.parentUnitId, data.parentUnitId).patch({
          operations: [
            { path: '/childUnitIds/-', op: 'add', value: id }
          ]
        });
      if (data.childUnitIds)
        throw { status: 400, message: `Cannot relate child units upon creation. Create the parent unit first, then create or relate child units.` }
      if (data.userIds)
        throw { status: 400, message: `Cannot relate users upon creation. Create the parent unit first, then create or relate users.` }
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
