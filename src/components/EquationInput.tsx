import "./styles/equation.css";
import { convertLatexToAsciiMath, MathfieldElement } from "mathlive";
import React, { useEffect, useState } from "react";
import {
  convertSpeciesIDsToUnderscore,
  idToLatex,
} from "../utilities/equationutils.ts";
import { theme } from "antd";
import { convertUnderscoreSpeciesToIDs } from "../models/utils.ts";

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

interface EquationProps {
  id: string | null | undefined;
  equation: string;
  onChange: (equation: string) => void;
  isOde?: boolean;
}

export default function EquationInput({
  id,
  equation,
  onChange,
  isOde = true,
}: EquationProps) {
  // States
  const [latexEquation, setLatexEquation] = useState<string>(equation);

  // Effects
  useEffect(() => {
    convertSpeciesIDsToUnderscore(equation)
      .then((converted) => setLatexEquation(converted))
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [equation]);

  // Styling
  const { token } = theme.useToken();

  const leftHandStyle = {
    color: token.colorText,
    background: "transparent",
    "--contains-highlight-background-color": token.colorFillContent,
  };

  // Handlers
  const onKeydown = (evt: React.KeyboardEvent<MathfieldElement>) => {
    if (evt.key === "Enter") {
      evt.currentTarget.blur();
    }

    if (evt.key === "Escape") {
      // @ts-ignore
      evt.target.value = latexEquation;
      evt.currentTarget.blur();
    }
  };

  const onMathInput = (evt: React.FormEvent<MathfieldElement>) => {
    // @ts-ignore
    let value = evt.target.value;

    if (value === PLACEHOLDER) {
      return;
    }

    // Replace \max with max
    value = value.replace(/\\max/g, "max");
    let asciiEquation = convertLatexToAsciiMath(value).replace(
      /_\(([^)]+)\)/g,
      "_$1"
    );

    // Set states in frontend and backend
    setLatexEquation(value);
    convertUnderscoreSpeciesToIDs(asciiEquation)
      .then((converted) => onChange(converted))
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div className={"flex flex-row place-items-center justify-start h-auto"}>
      <math-field
        read-only={true}
        id={"static-math-field"}
        style={leftHandStyle}
      >
        {isOde ? `\\frac{d ${idToLatex(id)} }{dt} = ` : `${idToLatex(id)} =`}
      </math-field>
      {
        <math-field
          className={"w-full"}
          id={"dynamic-math-field"}
          onBlur={onMathInput}
          onKeyDown={onKeydown}
          style={{ ...leftHandStyle }}
        >
          {latexEquation.length > 0 ? latexEquation : PLACEHOLDER}
        </math-field>
      }
    </div>
  );
}
