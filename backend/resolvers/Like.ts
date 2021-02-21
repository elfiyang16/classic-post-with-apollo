import { pubsub } from "../index";
import { withFilter } from "apollo-server";

const NEW_LIKE = "NEW_LIKE";
const NEW_LIKE_ON_POST = "NEW_LIKE_ON_POST";

export const resolvers = {
  Subscription: {
    newLike: {
      subscribe: () => pubsub.asyncIterator([NEW_LIKE]),
    },
    newLikeOnPost: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(NEW_LIKE_ON_POST),
        (payload, variables) => {
          return payload.newLikeOnPost.post.id.toString() === variables.id;
        }
      ),
    },
  },
  Mutation: {
    likePost: async (parent, { postId }, { dataSources }) => {
      const newLike = await dataSources.postAPI.likePost(postId);

      if (newLike._id) {
        const like = (name) => ({
          [name]: {
            id: newLike._id,
            post: {
              id: newLike.post._id,
              likes: [...newLike.post.likes],
            },
            user: {
              id: newLike.user._id,
              username: newLike.user.username,
            },
            createdAt: newLike.createdAt,
          },
        });

        pubsub.publish(NEW_LIKE, like("newLike"));

        pubsub.publish(NEW_LIKE_ON_POST, like("newLikeOnPost"));
      }

      return newLike;
    },
  },
};
