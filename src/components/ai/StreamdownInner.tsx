"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";

interface Props {
  content: string;
  isAnimating: boolean;
}

export default function StreamdownInner({ content, isAnimating }: Props) {
  return (
    <div className="streamdown-wrapper text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
      <Streamdown plugins={{ code, cjk }} isAnimating={isAnimating}>
        {content}
      </Streamdown>
    </div>
  );
}
