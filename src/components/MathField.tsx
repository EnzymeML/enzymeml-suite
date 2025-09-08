import "./styles/equation.css";
import { MathfieldElement } from "mathlive";
import React from "react";
import { theme } from "antd";

export const PLACEHOLDER = "Enter \\: equation \\: here";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}

interface MathFieldProps {
  equation: string;
}

export default function MathField({ equation }: MathFieldProps) {
  // Styling
  const { token } = theme.useToken();

  const leftHandStyle = {
    color: token.colorText,
    background: "transparent",
    focus: "none",
    border: "none",
  };

  return (
    <div className={"flex flex-row place-items-center justify-start h-auto"}>
      <math-field
        read-only={true}
        id={"static-math-field"}
        style={leftHandStyle}
      >
        {equation}
      </math-field>
    </div>
  );
}
