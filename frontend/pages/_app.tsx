import { NextPage } from "next";
import { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";
import { useApollo } from "../lib/withApollo";
import { AuthProvider } from "../components/Auth";
import { Page } from "../components/Page";
import "../styles/globals.scss";

const App: NextPage<AppProps> = ({ Component, pageProps }) => {
  const client = useApollo(pageProps.initialApolloState);

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <Page>
          <Component {...pageProps} />
        </Page>
      </AuthProvider>
    </ApolloProvider>
  );
};

export default App;
