import React, { useContext, useEffect, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import { Waypoint } from "react-waypoint";
import { ActionLoader } from "./ActionLoader";
import { Post } from "../components/Post";
import { AuthContext } from "./Auth";
import { Message } from "./Message";
import { NEW_POST } from "../lib/withApollo";
import s from "../styles/Posts.module.scss";

export const ALL_POSTS_QUERY = gql`
  query ALL_POSTS_QUERY(
    $tag: String
    $limit: Int
    $cursor: String
    $submittedBy: ID
    $likedBy: ID
  ) {
    posts(
      tag: $tag
      limit: $limit
      cursor: $cursor
      submittedBy: $submittedBy
      likedBy: $likedBy
    ) {
      totalCount
      pageInfo {
        endCursor
        hasMore
      }
      posts {
        id
        content
        submittedBy {
          id
        }
        tags {
          id
          name
        }
        likes {
          id
          user {
            id
            username
          }
          createdAt
        }
        slug
      }
    }
  }
`;

const POSTS_SUBSCRIPTION = gql`
  subscription NewPost {
    newPost {
      id
      content
      submittedBy {
        id
      }
      tags {
        id
        name
      }
      likes {
        id
        user {
          id
          username
        }
        createdAt
      }
      slug
    }
  }
`;
//eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscribeToNewPosts = (subscribeToMore: any) => {
  if (subscribeToMore) {
    subscribeToMore({
      document: POSTS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return;
        const newPost = subscriptionData.data.newPost;
        const exists = prev.posts.posts.find(({ id }) => id === newPost.id);
        if (exists) return;

        return Object.assign(
          {},
          {
            posts: {
              pageInfo: {
                ...prev.posts.pageInfo,
                endCursor: NEW_POST,
              },
              posts: [newPost],
              totalCount: prev.posts.totalCount + 1,
              __typename: prev.posts.__typename,
            },
          }
        );
      },
    });
  }
};

const LIKES_SUBSCRIPTION = gql`
  subscription NewLike {
    newLike {
      id
      post {
        id
        likes {
          id
          user {
            id
            username
          }
        }
      }
      user {
        id
        username
      }
      createdAt
    }
  }
`;

const subscribeToNewLikes = (subscribeToMore) => {
  if (subscribeToMore) {
    subscribeToMore({
      document: LIKES_SUBSCRIPTION,
    });
  }
};

interface PostsProps {
  tag?: string;
  limit?: number;
  cursor?: string;
  submittedBy?: string;
  likedBy?: string;
}

export const Posts: React.FC<PostsProps> = ({
  tag,
  limit,
  cursor,
  submittedBy,
  likedBy,
}) => {
  const [prevCursor, setPrevCursor] = useState(null);
  const [message, setMessage] = useState(null);
  const { data, loading, error, fetchMore, subscribeToMore } = useQuery(
    ALL_POSTS_QUERY,
    {
      variables: { tag, limit, cursor, submittedBy, likedBy },
    }
  );

  useEffect(() => {
    if (subscribeToMore) {
      subscribeToNewPosts(subscribeToMore);
      subscribeToNewLikes(subscribeToMore);
    }
  }, [subscribeToMore]);

  const router = useRouter();

  const { user } = useContext(AuthContext);

  if (submittedBy) {
    if (submittedBy !== user.id) {
      router.push("/posts");
    }
  }

  if (likedBy) {
    if (likedBy !== user.id) {
      router.push("/posts");
    }
  }

  const timeoutId = useRef<number>();

  useEffect(() => {
    if (router.query.delete === "success") {
      setMessage("Post successfully deleted");
    }

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [router.query]);

  useEffect(() => {
    if (message) {
      timeoutId.current = window.setTimeout(function () {
        setMessage(null);
        router.push("/posts");
      }, 3000);
    }
  }, [message]);

  const loadMore = async () => {
    const { endCursor } = data.posts.pageInfo;

    if (endCursor == prevCursor) {
      return;
    }

    setPrevCursor(endCursor);

    fetchMore({
      variables: {
        cursor: endCursor,
        limit,
        tag,
      },
    });
  };

  if (loading) return <ActionLoader />;

  if (error) return <div>Error...</div>;

  let posts;

  let hasMore;

  if (data) {
    posts = data.posts.posts;
    hasMore = data.posts.pageInfo.hasMore;
  }

  return (
    <div className={s.container}>
      <Message>{message}</Message>
      <div>
        {posts?.length > 0 &&
          posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <Link href="/posts/[...slug]" as={`/posts/${post.slug}`}>
                <a>
                  <Post post={post} />
                </a>
              </Link>
              {hasMore && index === posts.length - 2 && (
                <Waypoint
                  onEnter={() => {
                    loadMore();
                  }}
                />
              )}
            </React.Fragment>
          ))}
        {posts.length === 0 && likedBy && <Message>No posts liked</Message>}
        {posts.length === 0 && submittedBy && (
          <Message>No posts submitted</Message>
        )}
      </div>
    </div>
  );
};
