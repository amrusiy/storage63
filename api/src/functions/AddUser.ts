import { app } from "@azure/functions";
import { CosmosClient, ItemDefinition } from "@azure/cosmos";
import { authenticate } from "../auth";
import { User } from "../types";

app.http("AddUser", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);

      await authenticate(request);
      const data = await request.json() as User;
      if (!['id', 'unitId', 'username', 'password', 'permission'].every(key => data[key]))
        throw { status: 400, message: 'Missing user properties' };
      if (!['admin', 'user'].some(_ => data[_]))
        throw { status: 400, message: 'Invalid permission. Expected: admin, user.' };

      cosmos.database('db').container('users').items.create<User>(data);
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
