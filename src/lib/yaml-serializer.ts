import yaml from "js-yaml";
import type { PipelineBlock } from "@/types/cnb";
import { mergeBlocks } from "./yaml-merger";

export function blocksToYaml(blocks: PipelineBlock[]): string {
  if (blocks.length === 0) {
    return "# 从左侧添加流水线片段开始配置\n";
  }
  const merged = mergeBlocks(blocks);
  return yaml.dump(merged, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}
