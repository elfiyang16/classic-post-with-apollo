import { NextPage } from "next";
import { useRouter } from "next/router";
import { ActionLoader } from "../components/ActionLoader";

const HomePage: NextPage = () => {
  const router = useRouter();
  router.push("/posts");
  return (
    <div>
      <ActionLoader />
    </div>
  );
};

export default HomePage;
