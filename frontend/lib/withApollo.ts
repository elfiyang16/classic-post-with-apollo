import { useMemo } from "react";
import {
  ApolloClient,
  split,
  InMemoryCache,
  NormalizedCacheObject,
  createHttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";
import { DEV_ENDPOINT, DEV_WS_ENDPOINT } from "../config";
import { Like as LikeType } from "../types";

export const NEW_POST = "NEW_POST";
export const NEW_LIKE = "NEW_LIKE";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

function decodeCursor(encodedCursor: string) {
  return Buffer.from(encodedCursor, "base64").toString("ascii");
}

function encodeCursor(date: number) {
  return Buffer.from(date.toString()).toString("base64");
}

const httpLink = createHttpLink({
  uri:
    process.env.NODE_ENV === "development"
      ? DEV_ENDPOINT
      : process.env.NEXT_PUBLIC_PROD_ENDPOINT, // Server URL (must be absolute)
  fetchOptions: {
    credentials: "include", // Additional fetch() options like `credentials` or `headers`,
  },
});

const wsLink = process.browser
  ? new WebSocketLink({
      // if you instantiate in the server, the error will be thrown
      uri:
        process.env.NODE_ENV === "development"
          ? DEV_WS_ENDPOINT
          : process.env.NEXT_PUBLIC_PROD_WS_ENDPOINT,
      options: {
        reconnect: true,
        minTimeout: 10000,
        timeout: 30000,
        lazy: true,
      },
    })
  : null;

const terminalLink = process.browser
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: terminalLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            posts: {
              keyArgs: ["tag", "submittedBy", "likedBy"],
              merge: (
                existing = {
                  __typename: "PostsConnection",
                  totalCount: 0,
                  pageInfo: {
                    endCursor: null,
                    hasMore: true,
                  },
                  posts: [],
                },
                incoming,
                { args }
              ) => {
                if (args.likedBy) {
                  if (existing.posts.length === 0) {
                    if (incoming.totalCount === -2) {
                      return existing;
                    }

                    if (incoming.totalCount === -1) {
                      return {
                        ...incoming,
                        totalCount: 1,
                        pageInfo: {
                          endCursor: encodeCursor(incoming.pageInfo.endCursor),
                          hasMore: true,
                        },
                      };
                    }

                    return incoming;
                  }

                  if (incoming.totalCount === -2) {
                    const exists = existing.posts.some(
                      (post) => post.__ref === incoming.posts[0].__ref
                    );

                    let updatedPosts;

                    if (exists) {
                      updatedPosts = existing.posts.filter(
                        (post) => post.__ref !== incoming.posts[0].__ref
                      );
                    } else {
                      updatedPosts = existing.posts;
                    }

                    return {
                      ...existing,
                      posts: [...updatedPosts],
                    };
                  }

                  if (incoming.totalCount === -1) {
                    const updatedPosts = [incoming.posts[0], ...existing.posts];

                    return {
                      ...existing,
                      posts: [...updatedPosts],
                    };
                  }

                  return {
                    ...incoming,
                    posts: [...existing.posts, ...incoming.posts],
                  };
                }

                let existingCursor;
                let incomingCursor;

                if (
                  existing.pageInfo.endCursor &&
                  incoming.pageInfo.endCursor !== NEW_POST
                ) {
                  existingCursor = decodeCursor(existing.pageInfo.endCursor);

                  incomingCursor = decodeCursor(incoming.pageInfo.endCursor);
                }

                if (incomingCursor > existingCursor) {
                  return existing;
                }

                const newPosts = incoming.posts;

                let update;

                if (incoming.pageInfo.endCursor === NEW_POST) {
                  update = {
                    pageInfo: existing.pageInfo,
                    posts: [...newPosts, ...existing.posts],
                    totalCount: incoming.totalCount,
                  };
                } else {
                  update = {
                    posts: [...existing.posts, ...newPosts],
                  };
                }

                return newPosts.length > 0
                  ? {
                      ...incoming,
                      ...update,
                    }
                  : existing;
              },
            },
            likes: {
              keyArgs: ["id"],
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              merge(existing = [], incoming: LikeType[]) {
                return incoming;
              },
            },
          },
        },
        Post: {
          fields: {
            likes: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              merge(existing = [], incoming: LikeType[]) {
                return incoming;
              },
            },
          },
        },
      },
    }),
  });
}

export function initializeApollo(
  initialState: NormalizedCacheObject = null
): ApolloClient<NormalizedCacheObject> | null {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(
  initialState: NormalizedCacheObject | null
): ApolloClient<NormalizedCacheObject> | null {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
