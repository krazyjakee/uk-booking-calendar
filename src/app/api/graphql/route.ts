import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";
import { buildContext } from "@/lib/graphql/context";

const yoga = createYoga({
  schema,
  context: ({ request }) => buildContext(request),
  graphqlEndpoint: "/api/graphql",
  // Enable GraphiQL in development only
  graphiql: process.env.NODE_ENV !== "production",
  fetchAPI: {
    Response,
    Request,
  },
});

export const GET = yoga;
export const POST = yoga;
