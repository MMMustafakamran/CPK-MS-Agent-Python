import { RouteHeader } from "@/components/route-header";

/**
 * Nothing is implemented here yet, by choice rather than by obstacle.
 *
 * This page is published under five framework prefixes — /ag2, /agno,
 * /mastra, /ms-agent-python and /deepagents — and all five return the same
 * bytes. Its snippets are plain React (`useInterrupt`, `useHumanInTheLoop`)
 * with nothing framework-specific in them, so implementing it a third time
 * would re-derive findings already recorded in Agno-react and Mastra-react.
 *
 * Tracked here so drift is watched in every repo, not only the two that
 * carry the demo.
 */
export default function Page() {
  return <RouteHeader path="/human-in-the-loop/governed-actions" />;
}
