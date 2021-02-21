import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import Post from "../models/Post";
import Tag from "../models/Tag";
import Like from "../models/Like";
import { items } from "./items";

dotenv.config();

const db = process.env.MONGO_URI;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const initializeSeed = async () => {
  try {
    mongoose.set("useFindAndModify", false);
    mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log("DB connected.");
  } catch (error) {
    console.log(error);
  }

  console.log(
    "Reseting the database.\nDeleting existing users, posts, likes and tags..."
  );

  await Promise.all([
    User.deleteMany({}).exec(),
    Post.deleteMany({}).exec(),
    Like.deleteMany({}).exec(),
    Tag.deleteMany({}).exec(),
  ]);

  console.log("Reset completed.\nCreating new users and posts...");

  const newUser = new User({
    name: "Elfi",
    username: "elfi",
    email: "elfi@test.io",
    password: "123456",
    role: "ADMIN",
  });

  const user = await newUser.save();
  console.log(`New user, ${newUser.name}, created`);

  const secondUser = new User({
    name: "Neil",
    username: "neil",
    email: "neil@test.io",
    password: "654321",
  });

  const testUser = new User({
    name: "Test",
    username: "test",
    email: "test@test.io",
    password: "123654",
  });

  await secondUser.save();
  console.log(`New user, ${secondUser.name}, created`);

  await testUser.save();
  console.log(`New user, ${testUser.name}, created`);

  const createNewPosts = async () => {
    for (const [index, item] of items.entries()) {
      const { content, tags } = item;

      let postSubmittedBy;

      if (index % 2 === 0) {
        postSubmittedBy = {
          user,
        };
      } else {
        postSubmittedBy = {
          user: secondUser,
        };
      }

      const newPost = await createPost({
        content,
        tags,
        ...postSubmittedBy,
      });

      await sleep(500);

      if (newPost) {
        console.log(`${index + 1}. Post created`);
      } else {
        console.log(`Error creating post`);
      }
    }
  };

  await createNewPosts();
  mongoose.disconnect();
  console.log(`Seeding completed`);
};

async function createPost({ content, tags, user }) {
  try {
    const slug = generateSlug(content);

    const existingPost = await Post.findOne({ slug }).exec();

    if (existingPost) return;

    const existingTags: any[] = await findTags(tags);

    const newPost = await new Post({
      content,
    });

    newPost.submittedBy = user._id;
    newPost.slug = slug;

    for (let i = 0; i < existingTags.length; i++) {
      if (!existingTags[i]) {
        const newTag = new Tag({
          name: tags[i],
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

    user.posts.push(newPost);

    await Promise.all([user.save(), newPost.save()]);

    return newPost;
  } catch (err) {
    return err;
  }
}

function generateSlug(content) {
  const contentSlug = content
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .slice(0, 4)
    .join("-")
    .toLowerCase();

  return `${contentSlug}`;
}

function findTags(tags) {
  return Promise.all(tags.map((tag) => Tag.findOne({ name: tag })));
}

initializeSeed().then(() => {
  process.exit();
});
