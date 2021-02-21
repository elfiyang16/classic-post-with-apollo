import { DataSource } from "apollo-datasource";
import Post from "../models/Post";
import Tag from "../models/Tag";
import Like from "../models/Like";
import User from "../models/User";
import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from "apollo-server";

class PostAPI extends DataSource {
  private context;

  initialize(config) {
    this.context = config.context;
  }

  async fetchLikesForPost(id) {
    const likes = await Post.findById(id)
      .populate({
        path: "likes",
        select: "_id user createdAt",
        populate: {
          path: "user",
          select: "_id username",
        },
      })
      .select("likes -_id")
      .exec();

    return likes.likes;
  }

  async fetchPaths() {
    const paths = await Post.find({}).select("slug").exec();

    return paths;
  }

  async fetchPost({ slug }) {
    const post = await Post.findOne({ slug })
      .populate({
        path: "tags",
        select: "_id name",
      })
      .populate({
        path: "likes",
        select: "_id user createdAt",
        populate: {
          path: "user",
          select: "_id username",
        },
      })
      .populate({
        path: "submittedBy",
        select: "_id username",
      })
      .exec();

    return post;
  }

  async fetchPosts({ tag, limit = 4, cursor, submittedBy, likedBy }) {
    let totalCount = 0;
    let posts = [];
    let endCursor = "";
    let filter = {};
    let type = "feed";

    if (tag) {
      const fetchedTag = await Tag.findOne({ name: tag }).exec();
      if (fetchedTag) {
        const tagId = fetchedTag._id;
        filter = { tags: tagId };
      }
    }

    const { user } = this.context.req;

    if (submittedBy) {
      if (!user) {
        if (!user) return new AuthenticationError("User must be logged in");
      }

      if (user && submittedBy.toString() !== user._id.toString()) {
        return new ForbiddenError("User not authorised");
      }

      filter = { ...filter, submittedBy };
    }

    if (cursor)
      filter = { ...filter, createdAt: { $lt: this.decodeCursor(cursor) } };

    if (likedBy) {
      if (!user) {
        if (!user) return new AuthenticationError("User must be logged in");
      }

      if (user && likedBy.toString() !== user._id.toString()) {
        return new ForbiddenError("User not authorised");
      }

      const res = await this.fetchLikedPosts({
        likedBy,
        limit,
        cursor,
      });

      totalCount = await (await User.findById(user._id).select("likes").exec())
        .likes.length;

      const { likes } = res;

      posts = likes.map((x) => x.post);

      type = "likes";

      const updatedLikes = likes.length > limit ? likes.slice(0, -1) : likes;

      if (updatedLikes.length > 0) {
        endCursor = this.encodeCursor(
          updatedLikes[updatedLikes.length - 1].createdAt
        );
      } else {
        endCursor = cursor;
      }
    } else {
      posts = await Post.find(filter)
        .sort({ createdAt: "descending", _id: "descending" })
        .limit(limit + 1)
        .populate({
          path: "tags",
          select: "_id name",
        })
        .populate({
          path: "likes",
          select: "_id user createdAt",
          populate: {
            path: "user",
            select: "_id username",
          },
        })
        .populate({
          path: "submittedBy",
          select: "_id username",
        })
        .exec();

      totalCount = await Post.countDocuments({}).exec();
    }

    const hasMore = posts.length > limit;

    posts = hasMore ? posts.slice(0, -1) : posts;

    if (type === "feed") {
      if (posts.length > 0) {
        endCursor = this.encodeCursor(posts[posts.length - 1].createdAt);
      } else {
        endCursor = cursor;
      }
    }
    return {
      totalCount,
      pageInfo: {
        endCursor,
        hasMore,
      },
      posts,
    };
  }

  async fetchLikedPosts({ likedBy, limit, cursor }) {
    const { user } = this.context.req;

    if (!user) return new AuthenticationError("User must be logged in");

    const userId = user._id;

    let filter = {};

    if (cursor) {
      filter = {
        createdAt: { $lt: parseInt(this.decodeCursor(cursor)) },
      };
    }

    const posts = await User.findById(userId)
      .select("likes")
      .populate({
        path: "likes",
        select: "createdAt post -_id",
        options: {
          sort: { createdAt: "descending", _id: "descending" },
          limit: limit + 1,
        },
        match: {
          ...filter,
        },
        populate: [
          {
            path: "post",
            populate: [
              {
                path: "likes",
                select: "_id user createdAt",
                populate: {
                  path: "user",
                  select: "_id username",
                },
              },
              {
                path: "tags",
                select: "_id name",
              },
              {
                path: "submittedBy",
                select: "_id username",
              },
            ],
          },
        ],
      })
      .exec();

    return posts;
  }

  fetchPostById(postId) {
    return Post.findOne({ _id: postId }).exec();
  }

  async createPost({ content, tags }) {
    try {
      const { user } = this.context.req;

      if (!user) return new AuthenticationError("User must be logged in");

      const slug = this.generateSlug(content);

      const existingPost = await Post.findOne({ slug }).exec();

      if (existingPost)
        return new ApolloError("Post already exists", "POST_EXISTS");

      const [fetchedUser, existingTags] = await Promise.all([
        this.context.dataSources.userAPI.fetchUserById(user._id),
        this.context.dataSources.tagAPI.findTags(tags),
      ]);

      const newPost = await new Post({
        content,
      });

      newPost.submittedBy = user._id;
      newPost.slug = slug;

      for (let i = 0; i < existingTags.length; i++) {
        if (!existingTags[i]) {
          const newTag = new Tag({
            name: tags[i].toLowerCase(),
          });
          newTag.posts.push(newPost);
          await newTag.save();
          newPost.tags.push(newTag);
        } else {
          existingTags[i].posts.push(newPost);
          await existingTags[i].save();
          newPost.tags.push(existingTags[i]);
        }
      }

      fetchedUser.posts.push(newPost);

      await Promise.all([fetchedUser.save(), newPost.save()]);

      const populatedPost = await newPost
        .populate({
          path: "tags",
          select: "_id name",
        })
        .populate({
          path: "likes",
          select: "_id user createdAt",
          populate: {
            path: "user",
            select: "_id username",
          },
        })
        .populate({
          path: "submittedBy",
          select: "_id username",
        })
        .execPopulate();

      return populatedPost;
    } catch (err) {
      return new Error("Internal server error");
    }
  }

  async likePost(postId) {
    try {
      const { user } = this.context.req;

      if (!user) return new AuthenticationError("User must be logged in");

      const existingLike = await Like.findOne({
        user: user._id,
        post: postId,
      }).exec();

      if (existingLike) {
        const deletedLike = await existingLike.deleteOne();
        return deletedLike;
      }

      const newLike = new Like({
        post: postId,
        user: user._id,
      });

      const [post, fetchedUser] = await Promise.all([
        this.fetchPostById(postId),
        this.context.dataSources.userAPI.fetchUserById(user._id),
      ]);

      post.likes.push(newLike);
      fetchedUser.likes.push(newLike);

      await Promise.all([post.save(), fetchedUser.save(), newLike.save()]);

      return newLike;
    } catch (err) {
      return new Error("Internal server error");
    }
  }

  async updatePost(updates) {
    try {
      const { user } = this.context.req;

      if (!user) return new AuthenticationError("User must be logged in");

      const id = updates.id;

      const post = await Post.findById(id)
        .populate("tags")
        .populate({
          path: "submittedBy",
          select: "_id username",
        })
        .exec();

      if (user.id !== post.submittedBy._id.toString()) {
        return new ForbiddenError("User not authorised");
      }

      post.content = updates.content;
      post.slug = this.generateSlug(updates.content);

      const existingTags = post.tags.map((tag) => tag.name);

      const newTags = [];
      const removedTags = [];

      existingTags.forEach((tag) => {
        const tagName = tag.toLowerCase();
        if (!updates.tags.includes(tagName)) {
          removedTags.push(tagName);
        }
      });

      updates.tags.forEach((tag) => {
        const tagName = tag.toLowerCase();
        if (!existingTags.includes(tagName)) {
          newTags.push(tagName);
        }
      });

      const newTagsForPost = await Promise.all(
        newTags.map((tag) =>
          Tag.findOneAndUpdate(
            { name: tag },
            { $push: { posts: post } },
            { new: true, upsert: true }
          ).exec()
        )
      );

      const keptTags = post.tags.filter(
        (tag) => !removedTags.includes(tag.name)
      );

      const updatedTags = [...keptTags, ...newTagsForPost];
      post.tags = updatedTags;

      if (removedTags.length > 0) {
        await Promise.all(
          removedTags.map((tag) =>
            Tag.updateOne(
              { name: tag },
              { $pull: { posts: post._id } },
              { new: true, multi: true }
            ).exec()
          )
        );
      }

      await post.save();

      return post;
    } catch (err) {
      return new Error("Internal server error");
    }
  }

  async deletePost(id) {
    try {
      const { user } = this.context.req;

      if (!user) return new AuthenticationError("User must be logged in");

      const post = await Post.findById(id).exec();

      if (post.submittedBy.toString() !== user._id.toString()) {
        return new ForbiddenError("Post does not belong to user");
      }
      const deletedPost = await post.deleteOne();

      return deletedPost;
    } catch (err) {
      return new Error("Internal server error");
    }
  }

  generateSlug(content: string): string {
    const contentSlug = content
      .replace(/[^a-zA-Z ]/g, "")
      .split(" ")
      .slice(0, 4)
      .join("-")
      .toLowerCase();

    return `${contentSlug}`;
  }

  encodeCursor(date) {
    return Buffer.from(date.toString()).toString("base64");
  }

  decodeCursor(encodedCursor) {
    return Buffer.from(encodedCursor, "base64").toString("ascii");
  }
}

export default PostAPI;
