import React, { ReactNode } from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  keyboardShouldPersistTaps?: "handled" | "always" | "never";
};

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  style,
  ...props
}: Props) {
  return (
    <div
      style={{
        overflowY: "auto",
        flex: 1,
        ...style as React.CSSProperties,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
