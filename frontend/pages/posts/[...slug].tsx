import { NextPage } from "next";
import { useRouter } from "next/router";
import { GetStaticProps, GetStaticPaths } from "next";
import { gql } from "@apollo/client";
import { SinglePost } from "../../components/SinglePost";
import { UpdatePost } from "../../components/UpdatePost";
import { initializeApollo } from "../../lib/withApollo";
import { ActionLoader } from "../../components/ActionLoader";
import { Post as PostType } from "../../types";

const PATHS_QUERY = gql`
  query PATHS_QUERY {
    paths {
      slug
    }
  }
`;

export const SINGLE_POST_QUERY = gql`
  query SINGLE_POST_QUERY($slug: String!) {
    post(slug: $slug) {
      id
      content
      submittedBy {
        id
      }
      tags {
        id
        name
      }
      likes {
        id
        user {
          id
          username
        }
        createdAt
      }
      slug
    }
  }
`;

export const getStaticPaths: GetStaticPaths = async () => {
  const apolloClient = await initializeApollo();

  const res = await apolloClient.query({
    query: PATHS_QUERY,
  });

  const paths = res.data.paths.map((path) => ({
    params: { slug: [path.slug] },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params: { slug } }) => {
  const apolloClient = await initializeApollo();

  const res = await apolloClient.query({
    query: SINGLE_POST_QUERY,
    variables: {
      slug: slug[0],
    },
  });

  const post = res.data.post;

  return {
    props: {
      post,
    },
  };
};

type SinglePostPageProps = {
  post: PostType;
};

const SinglePostPage: NextPage<SinglePostPageProps> = ({ post }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <ActionLoader />
      </div>
    );
  }

  const { slug } = router.query;

  return (
    <div>
      {slug[1] && slug[1] === "edit" ? (
        <UpdatePost slug={slug[0] as string} />
      ) : (
        <SinglePost post={post} />
      )}
    </div>
  );
};

export default SinglePostPage;
