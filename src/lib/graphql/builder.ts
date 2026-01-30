import SchemaBuilder from "@pothos/core";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import type { JwtPayload } from "@/lib/auth/types";

export interface GraphQLContext {
  user: JwtPayload | null;
}

const builder = new SchemaBuilder<{
  Context: GraphQLContext;
}>({
  plugins: [SimpleObjectsPlugin],
});

builder.queryType({});
builder.mutationType({});

export default builder;
