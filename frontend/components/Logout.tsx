import React, { useContext } from "react";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import { AuthContext } from "./Auth";
import s from "../styles/General.module.scss";

const LOGOUT_MUTATION = gql`
  mutation LOGOUT_MUTATION {
    logout {
      message
    }
  }
`;

export const Logout: React.FC = ({ children }) => {
  const client = useApolloClient();
  const [logout] = useMutation(LOGOUT_MUTATION);

  const { setUser } = useContext(AuthContext);

  const logoutUser = async () => {
    try {
      const res = await logout();
      if (res.data.logout.message) {
        setUser(null);
        await client.resetStore();
      }
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <button
      className={s.button}
      id="logoutButton"
      type="button"
      onClick={logoutUser}
    >
      {children}
    </button>
  );
};
