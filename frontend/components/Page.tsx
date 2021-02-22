import React, { useContext } from "react";
import { AuthContext } from "./Auth";
import { Header } from "./Header";
import { Meta } from "./Meta";
import { ActionLoader } from "./ActionLoader";

export const Page: React.FC = ({ children }) => {
  const { auth } = useContext(AuthContext);

  return (
    <>
      <Meta />
      <Header />
      {auth ? (
        <div>
          <ActionLoader />
        </div>
      ) : (
        <div>
          <div>{children}</div>
        </div>
      )}
    </>
  );
};
