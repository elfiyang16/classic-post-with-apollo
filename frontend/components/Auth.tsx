import { createContext, useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";

export const CURRENT_USER_QUERY = gql`
  query {
    userProfile {
      id
      name
      username
      email
      role
    }
  }
`;

const initialAuthState = {
  auth: true,
  user: null,
  setUser: null,
};

export const AuthContext = createContext(initialAuthState);

export const AuthProvider: React.FC = ({ children }) => {
  const [auth, setAuth] = useState(true);
  const [user, setUser] = useState(null);

  const { data, error } = useQuery(CURRENT_USER_QUERY);

  useEffect(() => {
    if (error) {
      setUser(null);
      setAuth(false);
    } else if (typeof data !== undefined) {
      setAuth(false);
      if (data) {
        setUser(data.userProfile);
      }
    }
  }, [error, data]);

  const value = { auth, user, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
