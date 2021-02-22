import React, { useRef, useState, useEffect, useContext } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { gql, useMutation } from "@apollo/client";
import { ActionLoader } from "./ActionLoader";
import { AuthContext } from "./Auth";
import { useForm, validateInputs } from "../lib/useForm";
import { ErrorsType } from "../lib/useForm";
import { Message } from "./Message";
import s from "../styles/User.module.scss";

const LOGIN_MUTATION = gql`
  mutation LOGIN_MUTATION($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      name
      email
      username
    }
  }
`;

export const SignIn: React.FC = () => {
  const { inputs, handleChange } = useForm({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<ErrorsType>({});

  const [serverError, setServerError] = useState<boolean>(false);

  const isMounted = useRef(false);

  const { email, password } = inputs;

  const [loadingPage, setLoadingPage] = useState(true);

  const [disabled, setDisabled] = useState(true);

  const { user, setUser } = useContext(AuthContext);

  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (router.query.redirect) {
        router.back();
      } else {
        router.push("/posts");
      }
    } else {
      setLoadingPage(false);
    }
  }, [user]);

  useEffect(() => {
    if (isMounted.current) {
      const errors = validateInputs(inputs);
      setErrors(errors);
      if (Object.keys(errors).length === 0) {
        setDisabled(false);
      }
    } else {
      isMounted.current = true;
    }
  }, [inputs]);

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    variables: inputs,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login();
      setUser(res.data.login);
    } catch (err) {
      const { message } = err;
      if (message === "User does not exist") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: message,
        }));
      } else if (message === "Password is incorrect") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: message,
        }));
      } else {
        setServerError(true);
      }
    }
  };

  return !loadingPage ? (
    <div className={s.signin_container}>
      <Head>
        <title className={s.signin_header}> Posts Board | Sign In</title>
      </Head>
      <Message error={serverError ? true : false}>
        {serverError && "Login failed. Please try again."}
      </Message>
      <form className={s.form} onSubmit={handleSubmit}>
        <title>Welcome to Apollo Posts</title>
        <fieldset disabled={loading} aria-busy={loading}>
          <label className={s.label} htmlFor="email">
            Email:
          </label>
          <input
            className={s.input}
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={handleChange}
            onFocus={() => setServerError(false)}
            autoComplete="email"
            autoFocus
            required
          />
          <p className={s.error}>{errors.email && errors.email}</p>
          <label className={s.label} htmlFor="password">
            Password:
          </label>
          <input
            className={s.input}
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleChange}
            onFocus={() => setServerError(false)}
            autoComplete="current-password"
            required
          />
          <p className={s.error}>{errors.password && errors.password}</p>
          <input
            className={s.input}
            type="submit"
            value="Sign In"
            disabled={disabled}
          />
        </fieldset>
        <div className="link">
          <Link href="/signup">
            <a className={s.link}>Create a new account</a>
          </Link>
        </div>
      </form>
    </div>
  ) : (
    <div>
      <ActionLoader />
    </div>
  );
};
