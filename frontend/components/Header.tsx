import React from "react";
import Link from "next/link";
import s from "../styles/General.module.scss";

import { Navbar } from "./Navbar";

export const Header: React.FC = () => {
  return (
    <div className={s.header}>
      <Link href="/">
        <a className={s.link}>Post Board</a>
      </Link>
      <Navbar />
    </div>
  );
};
