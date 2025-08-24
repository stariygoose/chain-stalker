import type { FC, ReactNode } from "react";

interface IButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Button: FC<IButtonProps> = ({
  children,
  onClick,
  className = "",
}) => {
  return (
    <button onClick={onClick} className={`cursor-pointer ${className}`}>
      {children}
    </button>
  );
};
