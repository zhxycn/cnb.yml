"use client";

import dynamic from "next/dynamic";

const StreamdownInner = dynamic(() => import("./StreamdownInner"), {
  ssr: false,
  loading: () => (
    <div className="text-xs text-zinc-400 py-1">加载渲染器...</div>
  ),
});

interface Props {
  content: string;
  isAnimating: boolean;
}

export function StreamdownRenderer({ content, isAnimating }: Props) {
  return <StreamdownInner content={content} isAnimating={isAnimating} />;
}
