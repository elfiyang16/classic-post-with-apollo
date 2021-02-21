import mongoose from "mongoose";
import Like from "./Like";
import User from "./User";
import Tag from "./Tag";
import { PostInterface } from "./Interface";

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    content: {
      type: String,
      required: "Post cannot be blank",
      unique: true,
    },
    slug: {
      type: String,
      required: "Slug cannot be blank",
      unique: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Like",
      },
    ],
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    createdAt: Number,
    updatedAt: Number,
  },
  {
    timestamps: {
      currentTime: () => Math.floor(Date.now()),
    },
    collection: "post",
  }
);

PostSchema.post("deleteOne", { document: true }, async function () {
  const post = this;
  //@ts-ignore
  const updateTagsWithThisPost = post.tags.map((id) =>
    Tag.updateOne({ _id: id }, { $pull: { posts: post._id } }).exec()
  );
  //@ts-ignore
  const allLikes = await Like.find({ post }).exec();

  const updateUsers = allLikes.map((like) =>
    User.updateOne(
      { _id: like.user },
      {
        $pull: {
          likes: like._id,
        },
      }
    ).exec()
  );

  const deleteAllPostRef = async () =>
    Promise.all([
      User.updateOne(
        //@ts-ignore
        { _id: post.submittedBy },
        {
          $pull: {
            posts: post._id,
          },
        }
      ).exec(),
      ...updateTagsWithThisPost,
      ...updateUsers,
      Like.deleteMany({ post }).exec(),
    ]);

  await deleteAllPostRef();

  return post;
});

const Post = mongoose.model<PostInterface>("Post", PostSchema);

export default Post;
