export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};



export type Query = {
  __typename?: 'Query';
  likes?: Maybe<Array<Maybe<Like>>>;
  paths?: Maybe<Array<Maybe<Slug>>>;
  post?: Maybe<Post>;
  posts: PostsConnection;
  userProfile: User;
};


export type QueryLikesArgs = {
  id: Scalars['ID'];
};


export type QueryPostArgs = {
  slug: Scalars['String'];
};


export type QueryPostsArgs = {
  tag?: Maybe<Scalars['String']>;
  limit?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['String']>;
  submittedBy?: Maybe<Scalars['ID']>;
  likedBy?: Maybe<Scalars['ID']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  login: User;
  logout?: Maybe<Message>;
  register: User;
  createPost?: Maybe<Post>;
  likePost: Like;
  updatePost?: Maybe<Post>;
  deletePost?: Maybe<Post>;
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRegisterArgs = {
  name: Scalars['String'];
  username: Scalars['String'];
  password: Scalars['String'];
  email: Scalars['String'];
};


export type MutationCreatePostArgs = {
  content: Scalars['String'];
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type MutationLikePostArgs = {
  postId: Scalars['ID'];
};


export type MutationUpdatePostArgs = {
  id: Scalars['ID'];
  content?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type MutationDeletePostArgs = {
  id: Scalars['ID'];
};

export type Subscription = {
  __typename?: 'Subscription';
  newPost?: Maybe<Post>;
  newLike?: Maybe<Like>;
  newLikeOnPost?: Maybe<Like>;
};


export type SubscriptionNewLikeOnPostArgs = {
  id: Scalars['ID'];
};

export type Post = {
  __typename?: 'Post';
  id: Scalars['ID'];
  submittedBy: User;
  content: Scalars['String'];
  slug: Scalars['String'];
  likes: Array<Maybe<Like>>;
  tags: Array<Maybe<Tag>>;
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  username: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
  email: Scalars['String'];
  posts: Array<Maybe<Post>>;
  likes: Array<Maybe<Post>>;
  role: Role;
};

export enum Role {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  User = 'USER'
}

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID'];
  name: Scalars['String'];
  posts: Array<Maybe<Post>>;
};

export type Like = {
  __typename?: 'Like';
  id: Scalars['ID'];
  post?: Maybe<Post>;
  user: User;
  createdAt: Scalars['BigInt'];
};

export type PostsConnection = {
  __typename?: 'PostsConnection';
  totalCount: Scalars['Int'];
  pageInfo: PageInfo;
  posts: Array<Maybe<Post>>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasMore?: Maybe<Scalars['Boolean']>;
};

export type Message = {
  __typename?: 'Message';
  message?: Maybe<Scalars['String']>;
};

export type Slug = {
  __typename?: 'Slug';
  slug?: Maybe<Scalars['String']>;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

