"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

type Props = {
  text: string;
};

export default function MathText({ text }: Props) {
  if (!text) return null;

  const parts = text.split(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\))/g
  );

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // $$...$$
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        }

        // \[...\]
        if (part.startsWith("\\[") && part.endsWith("\\]")) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        }

        // $...$
        if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }

        // \(...\)
        if (part.startsWith("\\(") && part.endsWith("\\)")) {
          return <InlineMath key={index} math={part.slice(2, -2)} />;
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}