import React from "react";
import Link from "next/link";
import { AuthContext } from "./Auth";
import { Logout } from "./Logout";
import s from "../styles/General.module.scss";

export const Navbar: React.FC = () => {
  return (
    <AuthContext.Consumer>
      {({ user }) => (
        <div>
          <Link href="/">
            <a className={s.link}>Posts</a>
          </Link>
          {user && (
            <>
              <Link href="/user/[...slug]" as={`/user/${user.username}/posts`}>
                <a className={s.link}>My Posts</a>
              </Link>
              <Link href="/user/[...slug]" as={`/user/${user.username}/likes`}>
                <a className={s.link}>Likes</a>
              </Link>
              <Link href="/posts/new">
                <a className={s.link}>New</a>
              </Link>
            </>
          )}
          {!user ? (
            <Link href="/signin">
              <a className={s.link}>Sign In</a>
            </Link>
          ) : (
            <Logout>
              <a className={s.link}>Log out</a>
            </Logout>
          )}
        </div>
      )}
    </AuthContext.Consumer>
  );
};
