import mongoose from "mongoose";
import Post from "./Post";
import User from "./User";
import { LikeInterface } from "./Interface";

const { Schema } = mongoose;

const LikeSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: Number,
    updatedAt: Number,
  },
  {
    timestamps: {
      currentTime: () => Math.floor(Date.now()),
    },
    collection: "like",
  }
);

LikeSchema.post("save", async function () {
  const like = this;

  await like
    .populate("user", "_id username")
    .populate({
      path: "post",
      populate: [
        {
          path: "submittedBy",
          select: "_id username",
        },
        {
          path: "likes",
          select: "_id user",
          populate: {
            path: "user",
            select: "_id username",
          },
        },
        {
          path: "tags",
          select: "_id name",
        },
      ],
    })
    .execPopulate();

  return like;
});

LikeSchema.post("deleteOne", { document: true }, async function () {
  const like = this;

  const deleteLikeFromPostAndUser = async () =>
    Promise.all([
      //@ts-ignore
      Post.updateOne({ _id: like.post }, { $pull: { likes: like._id } }).exec(),
      //@ts-ignore
      User.updateOne({ _id: like.user }, { $pull: { likes: like._id } }).exec(),
    ]);

  await deleteLikeFromPostAndUser();

  await like
    .populate("user", "_id username")
    .populate({
      path: "post",
      populate: [
        {
          path: "submittedBy",
          select: "_id username",
        },
        {
          path: "likes",
          select: "_id user",
          populate: {
            path: "user",
            select: "_id username",
          },
        },
        {
          path: "tags",
          select: "_id name",
        },
      ],
    })
    .execPopulate();

  return like;
});

const Like = mongoose.model<LikeInterface>("Like", LikeSchema);

export default Like;
