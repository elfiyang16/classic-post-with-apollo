import express from "express";
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import { ApolloServer, PubSub } from "apollo-server-express";
import cookieParser from "cookie-parser";
import { merge } from "lodash";
import { BigIntTypeDefinition, BigIntResolver } from "graphql-scalars";
import { typeDefs } from "./schema/index";
import { resolvers as postResolvers } from "./resolvers/Post";
import { resolvers as userResolvers } from "./resolvers/User";
import { resolvers as authResolvers } from "./resolvers/Auth";
import { resolvers as likeResolvers } from "./resolvers/Like";
import UserAPI from "./datasources/user";
import PostAPI from "./datasources/post";
import TagAPI from "./datasources/tag";
import { verifyUser, AuthRequest } from "./middleware/auth";

dotenv.config();

// TODO: REMOVE
mongoose.Promise = global.Promise;

export const pubsub = new PubSub();

const db = process.env.MONGO_URI || "mongodb://127.0.0.1/apollo-posts";

const app = express();
app.use(cookieParser());
app.use("*", async function (req: AuthRequest, res, next) {
  const { token } = req.cookies;
  let user = null;
  if (token) user = await verifyUser(token);
  req.user = user;
  next();
});
app.enable("trust proxy");

const resolverMap = { BigInt: BigIntResolver };

const connectDatabase = () => {
  try {
    /* Fixed Deprecation Warnings */
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
};

const server = new ApolloServer({
  typeDefs: merge(BigIntTypeDefinition, typeDefs),
  resolvers: merge(
    resolverMap,
    authResolvers,
    postResolvers,
    userResolvers,
    likeResolvers
  ),
  context: async ({ req, res }) => ({
    req,
    res,
  }),
  dataSources: () => ({
    userAPI: new UserAPI(),
    postAPI: new PostAPI(),
    tagAPI: new TagAPI(),
  }),
});

server.applyMiddleware({
  app,
  cors: {
    credentials: true,
    origin: true,
  },
});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 5000;

httpServer.listen(port, async () => {
  await connectDatabase();
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
  );
});
