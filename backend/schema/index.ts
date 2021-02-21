import { gql } from "apollo-server";

export const typeDefs = gql`
  scalar BigInt

  type Query {
    likes(id: ID!): [Like]
    paths: [Slug]
    post(slug: String!): Post
    posts(
      tag: String
      limit: Int
      cursor: String
      submittedBy: ID
      likedBy: ID
    ): PostsConnection!
    userProfile: User!
  }

  type Mutation {
    login(email: String!, password: String!): User!
    logout: Message
    register(
      name: String!
      username: String!
      password: String!
      email: String!
    ): User!
    createPost(content: String!, tags: [String]): Post
    likePost(postId: ID!): Like!
    updatePost(id: ID!, content: String, tags: [String]): Post
    deletePost(id: ID!): Post
  }

  type Subscription {
    newPost: Post
    newLike: Like
    newLikeOnPost(id: ID!): Like
  }

  type Post {
    id: ID!
    submittedBy: User!
    content: String!
    slug: String!
    likes: [Like]!
    tags: [Tag]!
  }

  type User {
    id: ID!
    username: String!
    name: String!
    password: String!
    email: String!
    posts: [Post]!
    likes: [Post]!
    role: Role!
  }

  enum Role {
    ADMIN
    EDITOR
    USER
  }

  type Tag {
    id: ID!
    name: String!
    posts: [Post]!
  }

  type Like {
    id: ID!
    post: Post
    user: User!
    createdAt: BigInt!
  }

  type PostsConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    posts: [Post]!
  }

  type PageInfo {
    endCursor: String
    hasMore: Boolean
  }

  type Message {
    message: String
  }

  type Slug {
    slug: String
  }
`;
