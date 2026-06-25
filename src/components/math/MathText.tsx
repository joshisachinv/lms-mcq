"use client";

import { InlineMath, BlockMath } from "react-katex";

type Props = {
    text: string;
};

export default function MathText({ text }: Props) {
    if (!text) return null;

    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith("$$") && part.endsWith("$$")) {
                    return (
                        <BlockMath key={index}>
                            {part.slice(2, -2)}
                        </BlockMath>
                    );
                }

                if (part.startsWith("$") && part.endsWith("$")) {
                    return (
                        <InlineMath key={index}>
                            {part.slice(1, -1)}
                        </InlineMath>
                    );
                }

                return <span key={index}>{part}</span>;
            })}
        </>
    );
}