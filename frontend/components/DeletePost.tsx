import React from "react";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { ActionLoader } from "./ActionLoader";
import { ErrorLoader } from "./ErrorLoader";
import s from "../styles/Posts.module.scss";

const DELETE_POST_MUTATION = gql`
  mutation DELETE_POST_MUTATION($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`;

interface DeletePostProps {
  id: string;
}

export const DeletePost: React.FC<DeletePostProps> = ({ id, children }) => {
  const [deletePost, { error, loading }] = useMutation(DELETE_POST_MUTATION, {
    variables: { id },
    update(cache, { data: { deletePost } }) {
      cache.modify({
        fields: {
          posts(
            existing = {
              __typename: "PostsConnection",
              totalCount: 0,
              pageInfo: {
                endCursor: null,
                hasMore: true,
              },
              posts: [],
            },
            { readField }
          ) {
            const updatedPosts = existing.posts.filter(
              (postRef) => readField("id", postRef) !== deletePost.id
            );
            return {
              ...existing,
              posts: [...updatedPosts],
            };
          },
        },
      });
    },
  });

  if (loading) return <ActionLoader />;
  if (error) return <ErrorLoader />;

  const router = useRouter();

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      await deletePost();
      router.push({
        pathname: "/posts",
        query: { delete: "success" },
      });
    } catch (err) {
      return <ErrorLoader />;
    }
  };

  return (
    <div
      data-testid="deleteButton"
      className={s.link_button}
      onClick={(e) => {
        if (confirm("Please confirm you want to delete this post.")) {
          handleClick(e);
        }
      }}
    >
      {children}
    </div>
  );
};
