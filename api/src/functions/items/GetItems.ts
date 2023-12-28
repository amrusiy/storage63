import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { groupBy } from "../../utils";
import { authenticate } from "../../auth";
import { getChildUnitIds } from "../units/GetUnits";
import moment = require("moment");

app.http("GetItems", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "items/{id?}",
  handler: async (request, context) => {
    try {
      const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
      const cosmos = new CosmosClient(connectionString);
      const user = await authenticate(request);

      if (request.params.id) {
        // Get specific item
        const { resource: item } = await cosmos
          .database("db")
          .container("items")
          .item(request.params.id, request.params.id)
          .read();
        return {
          status: item ? 200 : 404,
          body: item
            ? JSON.stringify(item)
            : `item with the id ${request.params.id} was not found.`,
        };
      } else {
        // Get list of items
        const unitIds = await getChildUnitIds(user.unitId);
        const filter = ["unitId", "skuId", "status"]
          .map((key) =>
            request.query.get(key)
              ? ` AND i.${key} = ${request.query.get(key)}`
              : ""
          )
          .join("");
        const order = request.query.get("orderBy")
          ? ` ORDER BY i.${request.query.get("orderBy")} ASC`
          : "";
        const group = request.query.get("groupBy");
        const { resources: items } = await cosmos
          .database("db")
          .container("items")
          .items.query(
            `SELECT i.id, i.skuId, i.sku, i.status, i.unitId, i.unitName FROM items i WHERE i.unitId IN (${unitIds
              .map((id) => `"${id}"`)
              .join()})${filter}${order}`
          )
          .fetchAll();
        return {
          status: 200,
          body: JSON.stringify(
            group
              ? Object.entries(
                  groupBy(
                    items.map((item) => ({
                      ...item,
                      reported: moment(item.lastUpdate).isSameOrAfter(
                        moment(),
                        "day"
                      ),
                    })),
                    group
                  )
                ).map((_) => ({
                  [group]: _[0],
                  items: _[1],
                }))
              : items
          ),
        };
      }
    } catch (error) {
      return {
        status: error.status ?? 500,
        body: error.message,
      };
    }
  },
});
