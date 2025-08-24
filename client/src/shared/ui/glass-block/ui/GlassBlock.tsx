import type { FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export const GlassBlock: FC<Props> = ({ children, className = "" }) => (
  <div className={`glass-bg-effect ${className}`}>{children}</div>
);
