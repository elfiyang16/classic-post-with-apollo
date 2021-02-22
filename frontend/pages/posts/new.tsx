import { NextPage } from "next";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import { ActionLoader } from "../../components/ActionLoader";
import { AuthContext } from "../../components/Auth";
import { PostNew } from "../../components/PostNew";

const NewPostPage: NextPage = () => {
  const [loadingPage, setLoadingPage] = useState(true);
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push({
        pathname: "/signin",
        query: { redirect: "true" },
      });
    } else {
      setLoadingPage(false);
    }
  }, [user]);

  return !loadingPage ? (
    <PostNew />
  ) : (
    <div>
      <ActionLoader />
    </div>
  );
};

export default NewPostPage;
