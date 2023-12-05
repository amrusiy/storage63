import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

export async function GetItems(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const cosmosClient = new CosmosClient(process.env.COSMOSDB_CONNECTION_STRING);
  const { resources: items } = await cosmosClient
    .database("db")
    .container("items")
    .items.readAll()
    .fetchAll();

  try {
    return {
      status: 200,
      body: JSON.stringify(items),
    };
  } catch (error) {
    return {
      status: 500,
      body: error.message,
    };
  }
}

app.http("GetItems", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: GetItems,
  route: "/items",
});
