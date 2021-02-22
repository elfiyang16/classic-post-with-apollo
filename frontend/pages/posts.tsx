import { NextPage } from "next";
import { Posts } from "../components/Posts";
import { useRouter } from "next/router";

const PostsPage: NextPage = () => {
  const router = useRouter();
  const { tag } = router.query;

  return (
    <div>
      <Posts tag={tag as string} limit={4} />
    </div>
  );
};

export default PostsPage;
