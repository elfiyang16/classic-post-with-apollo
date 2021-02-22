import React from "react";
import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "../lib/useForm";
import { Message } from "./Message";
import s from "../styles/Posts.module.scss";

export const CREATE_POST_MUTATION = gql`
  mutation CREATE_POST_MUTATION($content: String!, $tags: [String]) {
    createPost(content: $content, tags: $tags) {
      id
      content
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
      }
      slug
    }
  }
`;

export const PostNew: React.FC = () => {
  const { inputs, handleChange, updateInputs } = useForm({
    content: "",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const { content, tags } = inputs;

  const router = useRouter();

  // TODO: refetch all posts after mutation
  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION, {
    variables: inputs,
    update(cache, { data: { createPost } }) {
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
            const newPostRef = cache.writeFragment({
              data: createPost,
              fragment: gql`
                fragment NewPost on Post {
                  id
                  content
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
                  }
                  slug
                }
              `,
            });

            if (
              existing.posts.some(
                (ref) => readField("id", ref) === createPost.id
              )
            ) {
              return existing;
            }

            return {
              ...existing,
              posts: [newPostRef, ...existing.posts],
            };
          },
        },
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createPost();
      const slug = res.data.createPost.slug;
      router.push("/posts/[slug]", `/posts/${slug}`);
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setErrorMessage("Post was unable to be created. Please try again.");
      } else {
        setErrorMessage(err.message);
      }
    }
  };

  const addTag = () => {
    const tagName = tagInput.toLowerCase();
    if (!tags.includes(tagName)) {
      updateInputs({
        tags: [...tags, tagName],
      });
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1);
    updateInputs({
      tags: updatedTags,
    });
  };

  return (
    <div>
      <Message error={errorMessage ? true : false}>{errorMessage}</Message>
      <form className={s.form} onSubmit={handleSubmit}>
        <title>Submit a new post</title>
        <fieldset className={s.form_row} disabled={loading} aria-busy={loading}>
          <label htmlFor="content">Content: </label>
          <textarea
            className={s.input_area}
            id="content"
            name="content"
            placeholder="Create any post you like"
            rows={4}
            value={content}
            onChange={handleChange}
            onFocus={() => setErrorMessage(null)}
          />
          <label htmlFor="tag">Tags: </label>
          <div className="input__group">
            <input
              id="tag"
              name="tag"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onFocus={() => setErrorMessage(null)}
              placeholder="power"
            />
            <button
              className={s.button}
              data-testid="addTag"
              onClick={() => addTag()}
            >
              Add Tag
            </button>
          </div>
          <div>
            {tags.length > 0 &&
              tags.map((tag, i) => {
                return (
                  <button
                    className={s.button}
                    key={`${tag}-${i}`}
                    onClick={() => removeTag(i)}
                  >
                    {tag}
                  </button>
                );
              })}
          </div>
          <input className={s.action_button} type="submit" value="Submit" />
        </fieldset>
      </form>
    </div>
  );
};
