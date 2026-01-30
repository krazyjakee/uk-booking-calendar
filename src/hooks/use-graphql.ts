"use client";

import { useCallback } from "react";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export function useGraphQL() {
  const query = useCallback(
    async <T>(gql: string, variables?: Record<string, unknown>): Promise<T> => {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: gql, variables }),
      });

      const json = (await res.json()) as GraphQLResponse<T>;

      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message);
      }

      if (!json.data) {
        throw new Error("No data returned.");
      }

      return json.data;
    },
    [],
  );

  return { query };
}
