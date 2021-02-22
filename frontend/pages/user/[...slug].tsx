import React, { useContext } from "react";
import { Posts } from "../../components/Posts";
import { useRouter } from "next/router";
import { AuthContext } from "../../components/Auth";

const UserPage: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { slug, tag } = router.query;

  let submittedBy;

  let likedBy;

  if (user && user.username === slug[0]) {
    submittedBy = user.id;
    likedBy = user.id;
  } else {
    router.push("/posts");
  }

  return (
    <div>
      {slug[1] === "posts" && (
        <Posts tag={tag as string} limit={4} submittedBy={submittedBy} />
      )}
      {slug[1] === "likes" && <Posts tag={tag as string} likedBy={likedBy} />}
    </div>
  );
};

export default UserPage;
