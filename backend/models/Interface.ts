import mongoose from "mongoose";

export interface PostInterface extends mongoose.Document {
  content: string;
  slug: string;
  submittedBy: UserInterface;
  likes: LikeInterface[];
  tags: TagInterface[];
}

export interface UserInterface extends mongoose.Document {
  name: string;
  username: string;
  email: string;
  password: string;
  likes: LikeInterface[];
  posts: PostInterface[];
}

export interface LikeInterface extends mongoose.Document {
  post: PostInterface;
  user: UserInterface;
}

export interface TagInterface extends mongoose.Document {
  name: string;
  posts: PostInterface[];
}
