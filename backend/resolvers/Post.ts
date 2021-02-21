import { pubsub } from "../index";
import Post from "../models/Post";

const NEW_POST = "NEW_POST";

export const resolvers = {
  Subscription: {
    newPost: {
      subscribe: () => pubsub.asyncIterator([NEW_POST]),
    },
  },
  Query: {
    likes: async (parent, { id }, { dataSources }) => {
      const likes = await dataSources.postAPI.fetchLikesForPost(id);
      return likes;
    },
    paths: async (parent, args, { dataSources }) => {
      const paths = await dataSources.postAPI.fetchPaths();
      return paths;
    },
    post: async (parent, { slug }, { dataSources }) => {
      const post = await dataSources.postAPI.fetchPost({
        slug,
      });
      return post;
    },
    posts: async (
      parent,
      { tag, limit, cursor, submittedBy, likedBy },
      { dataSources }
    ) => {
      const posts = await dataSources.postAPI.fetchPosts({
        tag,
        limit,
        cursor,
        submittedBy,
        likedBy,
      });

      return posts;
    },
  },
  Mutation: {
    createPost: async (parent, { content, tags }, { dataSources }) => {
      const post = await dataSources.postAPI.createPost({
        content,
        tags,
      });

      if (post._id) {
        pubsub.publish(NEW_POST, {
          newPost: {
            id: post._id,
            content: post.content,
            submittedBy: {
              id: post.submittedBy._id,
              username: post.submittedBy.username,
            },
            tags: post.tags.map((tag) => {
              return { id: tag._id, name: tag.name };
            }),
            likes: [],
            slug: post.slug,
          },
        });
      }

      return post;
    },
    updatePost: async (parent, args, { dataSources }) => {
      const updatedPost = await dataSources.postAPI.updatePost(args);

      return updatedPost;
    },
    deletePost: async (parent, { id }, { dataSources }) => {
      const deletedPost = await dataSources.postAPI.deletePost(id);
      return deletedPost;
    },
  },
};
