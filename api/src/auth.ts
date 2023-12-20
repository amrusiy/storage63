import { CosmosClient } from "@azure/cosmos";
import { HttpRequest } from "@azure/functions";

export async function authenticate(request: HttpRequest) {
    const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
    const cosmosClient = new CosmosClient(connectionString);

    const userId = request.headers.get("userId");
    const password = request.headers.get("password");

    if (!userId || !password) throw { status: 401 }

    const { resource: user } = await cosmosClient
        .database("db")
        .container("users")
        .item(userId, userId)
        .read();
    if (!user || user.password !== password) throw { status: 401 };
    return user;
}