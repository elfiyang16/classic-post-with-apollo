import React, { useEffect, useRef } from "react";
import { useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { gql, useMutation } from "@apollo/client";
import { Post as PostType } from "../types";
import { AuthContext } from "./Auth";
import { ErrorLoader } from "./ErrorLoader";
import { DeletePost } from "./DeletePost";
import { ALL_POSTS_QUERY } from "./Posts";
import s from "../styles/Posts.module.scss";

export const LIKE_MUTATION = gql`
  mutation LIKE_MUTATION($postId: ID!) {
    likePost(postId: $postId) {
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

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
  const { id, content, tags, likes, submittedBy, slug } = post;

  const { user } = useContext(AuthContext);

  const [like] = useMutation(LIKE_MUTATION, {
    variables: {
      postId: id,
    },
    update(cache, { data: { likePost } }) {
      const likedPost: PostType = cache.readFragment({
        id: `Post:${id}`,
        fragment: gql`
          fragment Like on Post {
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
        `,
      });
      const updatedLikes = likedPost.likes;
      const foundLike = updatedLikes.some((like) => like.id === likePost.id);

      if (!foundLike) {
        cache.evict({
          id: `Like:${likePost.id}`,
        });
      }

      const count = foundLike ? -1 : -2;

      cache.writeQuery({
        query: ALL_POSTS_QUERY,
        variables: {
          likedBy: user.id,
        },
        data: {
          posts: {
            __typename: "PostsConnection",
            totalCount: count,
            pageInfo: {
              endCursor: parseInt(likePost.createdAt),
              hasMore: true,
            },
            posts: [likedPost],
          },
        },
      });
    },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [likeError, setLikeError] = useState<boolean>(false);
  const timeoutId = useRef<number>();

  useEffect(() => {
    if (likeError) {
      timeoutId.current = window.setTimeout(function () {
        setLikeError(false);
      }, 3000);
    }

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [likeError]);

  let liked;

  if (user && likes) {
    liked = likes.some((like) => like.user.id === user.id);
  }

  let submitted;

  if (user) {
    submitted = submittedBy.id === user.id ? true : false;
  }

  const router = useRouter();

  const fetchPostWithTag = (
    e: React.MouseEvent<HTMLDivElement>,
    tagName: string
  ) => {
    e.preventDefault();
    router.push({
      pathname: "/posts",
      query: { tag: tagName },
    });
  };

  const likePost = async (e) => {
    e.preventDefault();
    try {
      await like();
    } catch (err) {
      setLikeError(true);
    }
  };

  const EditLink = ({ children, href, as, ...props }) => (
    <Link href={href} as={as}>
      <div className={s.link_button} {...props}>
        {children}
      </div>
    </Link>
  );

  return (
    <div className={s.post_container}>
      <div>
        <p>
          &#8220;<span data-testid="postContent">{content}</span>&#8221;
        </p>
      </div>
      <div>
        <div>
          {tags.map((tag) => (
            <button
              className={s.button}
              key={tag.id}
              onClick={(e: any) => fetchPostWithTag(e, tag.name)}
              data-testid="postTag"
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div>
          <div>
            <span className={s.like_text} data-testid="likeCount">
              {likes.length > 0 && likes.length}❤️
            </span>
            {likeError && <ErrorLoader />}
            {liked && !likeError ? (
              <button
                className={s.like_button}
                data-testid="unlikeButton"
                onClick={(e) => likePost(e)}
              >
                Unlike
              </button>
            ) : (
              !likeError && (
                <button
                  className={s.like_button}
                  data-testid="likeButton"
                  onClick={(e) => likePost(e)}
                >
                  Like
                </button>
              )
            )}
          </div>
          {submitted && (
            <div className={s.action_buttons}>
              <EditLink
                data-testid="editButton"
                href="/posts/[...slug]"
                as={`/posts/${slug}/edit`}
              >
                Edit
              </EditLink>

              <DeletePost id={id}>Delete</DeletePost>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
