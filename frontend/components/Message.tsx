import React from "react";

interface MessageProps {
  error?: boolean;
}

export const Message: React.FC<MessageProps> = ({ children, error }) => {
  return <div>{children}</div>;
};
