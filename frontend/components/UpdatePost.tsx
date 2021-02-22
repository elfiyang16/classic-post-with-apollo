import { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useContext } from "react";
import { useRouter } from "next/router";
import { ActionLoader } from "./ActionLoader";
import { AuthContext } from "./Auth";
import { Message } from "./Message";
import { useForm } from "../lib/useForm";
import s from "../styles/Posts.module.scss";

const SINGLE_POST_QUERY = gql`
  query SINGLE_POST_QUERY($slug: String!) {
    post(slug: $slug) {
      id
      content
      submittedBy {
        id
      }
      tags {
        name
      }
      slug
    }
  }
`;

const UPDATE_POST_MUTATION = gql`
  mutation UPDATE_POST_MUTATION($id: ID!, $content: String, $tags: [String]) {
    updatePost(id: $id, content: $content, tags: $tags) {
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
        user {
          username
        }
      }
      slug
    }
  }
`;

interface UpdatePostProps {
  slug: string;
}

export const UpdatePost: React.FC<UpdatePostProps> = ({ slug }) => {
  const { inputs, handleChange, updateInputs } = useForm({
    id: "",
    content: "",
    tags: [],
  });

  const { user } = useContext(AuthContext);

  const [loadingPage, setLoadingPage] = useState(true);

  const [errorMessage, setErrorMessage] = useState(null);

  const [tagInput, setTagInput] = useState("");

  const { loading, error: singlePostError } = useQuery(SINGLE_POST_QUERY, {
    variables: {
      slug,
    },
    onCompleted: (data) => {
      if (user.id !== data.post.submittedBy.id) {
        router.push({
          pathname: `/posts/${data.post.slug}`,
        });
      } else {
        const { id, content, tags } = data.post;
        const tagNames = tags.map((tag) => tag.name);
        const formInputs = {
          id,
          content,
          tags: tagNames,
        };

        updateInputs(formInputs);
        setLoadingPage(false);
      }
    },
  });

  const [updatePost, { loading: updating }] = useMutation(
    UPDATE_POST_MUTATION,
    {
      variables: { ...inputs },
    }
  );

  const router = useRouter();

  if (singlePostError) return <div>Error...</div>;

  if (loading) return <ActionLoader />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updatePost();
      const slug = res.data.updatePost.slug;
      router.push(`/posts/${slug}`);
    } catch (err) {
      const { message } = err;
      if (message === "Failed to fetch") {
        setErrorMessage("Post was unable to be updated. Please try again.");
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
    const updatedTags = [...inputs.tags];
    updatedTags.splice(index, 1);
    updateInputs({
      tags: updatedTags,
    });
  };

  const { content, tags } = inputs;

  return !loadingPage ? (
    <div>
      <div>
        <Message error={errorMessage ? true : false}>{errorMessage}</Message>
        <form className={s.form} onSubmit={handleSubmit}>
          <title>Edit post</title>
          <fieldset
            className={s.form_row}
            disabled={updating}
            aria-busy={updating}
          >
            <label htmlFor="updateContent">Content:</label>
            <textarea
              className={s.input_area}
              id="updateContent"
              name="content"
              placeholder="Any post you like"
              rows={4}
              value={content}
              onChange={handleChange}
              onFocus={() => setErrorMessage(null)}
            />
            <label>Tags:</label>
            <div className="input__group">
              <input
                id="updateTag"
                type="text"
                name="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onFocus={() => setErrorMessage(null)}
              />
              <button
                className={s.button}
                data-testid="updateTags"
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  addTag();
                }}
              >
                Update
              </button>
            </div>
            <div>
              {tags.map((tag, i) => {
                return (
                  <button
                    className={s.button}
                    key={`${tag}-${i}`}
                    onClick={() => {
                      setErrorMessage(null);
                      removeTag(i);
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {updating ? (
              <ActionLoader />
            ) : (
              <input className={s.action_button} type="submit" value="Update" />
            )}
          </fieldset>
        </form>
      </div>
    </div>
  ) : (
    <div>
      <ActionLoader />
    </div>
  );
};
