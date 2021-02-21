import mongoose from "mongoose";
import { TagInterface } from "./Interface";

const { Schema } = mongoose;

const TagSchema = new Schema(
  {
    name: {
      type: String,
      required: "Tag name cannot be blank",
      unique: true,
    },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    createdAt: Number,
    updatedAt: Number,
  },
  {
    timestamps: {
      currentTime: () => Math.floor(Date.now()),
    },
    collection: "tag",
  }
);

TagSchema.pre<TagInterface>("save", function (next) {
  this.name = this.name.toLowerCase();
  next();
});

const Tag = mongoose.model<TagInterface>("Tag", TagSchema);

export default Tag;
