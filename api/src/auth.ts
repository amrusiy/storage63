import { CosmosClient } from "@azure/cosmos";
import { HttpRequest } from "@azure/functions";

export async function authenticate(request: HttpRequest) {
  const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
  const cosmosClient = new CosmosClient(connectionString);

  const password = request.headers.get("password");
  const username = request.headers.get("username");

  if (!username || !password) throw { status: 401 };

  const { resource: user } = await cosmosClient
    .database("db")
    .container("users")
    .item(username, username)
    .read();
  //   if (!user || user.password !== password)
  if (!user)
    throw {
      status: 404,
    };
  return user;
}
