import { useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import { Post } from "../components/Post";
import { ActionLoader } from "../components/ActionLoader";
import { Post as PostType } from "../types";

export const LIKES_QUERY = gql`
  query LIKES_QUERY($id: ID!) {
    likes(id: $id) {
      id
      user {
        id
        username
      }
    }
  }
`;

const LIKE_SUBSCRIPTION = gql`
  subscription NewLikeOnPost($id: ID!) {
    newLikeOnPost(id: $id) {
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

const subscribeToNewLikeOnPost = (subscribeToMore, postId) => {
  if (subscribeToMore) {
    subscribeToMore({
      document: LIKE_SUBSCRIPTION,
      variables: {
        id: postId,
      },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return;
        const newLike = subscriptionData.data.newLikeOnPost;
        const exists = prev.likes.find((like) => like.id === newLike.id);
        if (exists) {
          const updatedLikes = prev.likes.filter(
            (like) => like.id !== newLike.id
          );

          return Object.assign({}, { likes: [...updatedLikes] });
        }
        return Object.assign(
          {},
          {
            likes: [newLike, ...prev.likes],
          }
        );
      },
    });
  }
};

interface SinglePostProps {
  post: PostType;
}

export const SinglePost: React.FC<SinglePostProps> = ({ post }) => {
  const { data, loading, error, subscribeToMore } = useQuery(LIKES_QUERY, {
    variables: {
      id: post.id,
    },
  });

  useEffect(() => {
    if (subscribeToMore) {
      subscribeToNewLikeOnPost(subscribeToMore, post.id);
    }
  }, [subscribeToMore]);

  if (loading) return <ActionLoader />;

  if (error) return <div>Error...</div>;

  let updatedPost = { ...post };

  if (data) {
    updatedPost = { ...updatedPost, likes: data.likes };
  }

  return <Post post={updatedPost} />;
};
