import React, { useRef, useState, useEffect, useContext } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { gql, useMutation } from "@apollo/client";
import { AuthContext } from "./Auth";
import { ErrorsType, useForm, validateInputs } from "../lib/useForm";
import { Message } from "./Message";
import s from "../styles/User.module.scss";

const REGISTER_MUTATION = gql`
  mutation REGISTER_MUTATION(
    $name: String!
    $username: String!
    $email: String!
    $password: String!
  ) {
    register(
      name: $name
      username: $username
      email: $email
      password: $password
    ) {
      id
      name
      email
      username
    }
  }
`;

export const SignUp: React.FC = () => {
  const { inputs, handleChange } = useForm({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmationPassword: "",
  });

  const [errors, setErrors] = useState<ErrorsType>({});

  const [serverError, setServerError] = useState<boolean>(false);

  const [disabled, setDisabled] = useState<boolean>(true);

  const isMounted = useRef(false);

  const { name, username, email, password, confirmationPassword } = inputs;

  const { user } = useContext(AuthContext);

  const [loadingPage, setLoadingPage] = useState(true);

  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/posts");
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

  const request = { ...inputs };
  delete request.confirmationPassword;

  const [register, { loading }] = useMutation(REGISTER_MUTATION, {
    variables: request,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register();
    } catch (err) {
      const errors: ErrorsType = {};
      const { message } = err;
      if (message === "Username already exists") {
        errors.username = message;
        setErrors(errors);
      } else if (message === "Email already exists") {
        errors.email = message;
        setErrors(errors);
      } else if (err.graphQLErrors[0]?.extensions.exception.errors) {
        const inputKeys = Object.keys(
          err.graphQLErrors[0].extensions.exception.errors
        );
        inputKeys.forEach(
          (key) =>
            (errors[key] =
              err.graphQLErrors[0].extensions.exception.errors[
                key
              ].properties.message)
        );
        setErrors(errors);
      } else {
        setServerError(true);
      }
    }
  };

  return !loadingPage ? (
    <div className={s.signin_container}>
      <Head>
        <title className={s.signin_header}> Posts Board | Sign Up</title>
      </Head>
      <Message error={serverError ? true : false}>
        {serverError && "Sign up failed. Please try again."}
      </Message>
      <form className={s.form} onSubmit={handleSubmit}>
        <title>Join the Posts community</title>
        <fieldset className={s.fieldset} disabled={loading} aria-busy={loading}>
          <label className={s.label} htmlFor="signUpName">
            Name:
          </label>
          <input
            className={s.input}
            id="signUpName"
            name="name"
            type="text"
            placeholder="John Smith"
            value={name}
            onChange={handleChange}
            onFocus={() => setServerError(false)}
            autoComplete="name"
            autoFocus
            required
          />
          <p className={s.error}>{errors.name && errors.name}</p>
          <label className={s.label} htmlFor="username">
            Username:
          </label>
          <input
            className={s.input}
            id="username"
            type="text"
            name="username"
            placeholder="jsmith"
            value={username}
            onChange={handleChange}
            onFocus={() => setServerError(false)}
            autoComplete="username"
            required
          />
          <p className={s.error}>{errors.username && errors.username}</p>
          <label className={s.label} htmlFor="signUpEmail">
            Email:
          </label>
          <input
            className={s.input}
            id="signUpEmail"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleChange}
            onFocus={() => setServerError(false)}
            autoComplete="email"
            required
          />
          <p className={s.error}>{errors.email && errors.email}</p>
          <label className={s.label} htmlFor="signUpPassword">
            Password:
          </label>
          <input
            className={s.input}
            id="signUpPassword"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleChange}
            onFocus={() => setServerError(false)}
            autoComplete="new-password"
            required
          />
          <p className={s.error}>{errors.password && errors.password}</p>
          <label className={s.label} htmlFor="confirmationPassword">
            Confirm Password:
            <input
              className={s.input}
              id="confirmationPassword"
              name="confirmationPassword"
              type="password"
              placeholder="Confirmaton Password"
              value={confirmationPassword}
              onChange={handleChange}
              onFocus={() => setServerError(false)}
              autoComplete="new-password"
              required
            />
          </label>
          <p className={s.error}>
            {errors.confirmationPassword && errors.confirmationPassword}
          </p>
          <input
            className={s.input}
            type="submit"
            value="Sign Up"
            disabled={disabled}
          />
        </fieldset>
      </form>
    </div>
  ) : (
    <div>Loading...</div>
  );
};
