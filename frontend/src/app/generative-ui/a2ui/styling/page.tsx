import { RouteHeader } from "@/components/route-header";

/**
 * Nothing is implemented here on purpose.
 *
 * The page themes `.a2ui-surface` with CSS custom properties. This repo
 * maps no A2UI page at all — `/generative-ui/a2ui`, `fixed-schema` and
 * `dynamic-schema` are all still in the manifest’s `knownUnmapped` list —
 * so there is no surface for a theme file to affect, and a demo would be a
 * stylesheet with no element to style.
 *
 * DeepAgentspy-react implements this page against a real A2UI surface.
 */
export default function Page() {
  return <RouteHeader path="/generative-ui/a2ui/styling" />;
}
