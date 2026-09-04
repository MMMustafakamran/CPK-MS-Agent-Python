import { RouteHeader } from "@/components/route-header";

/**
 * Nothing is implemented here on purpose.
 *
 * The page replaces the progress indicator shown while the `render_a2ui`
 * tool call is in flight, which only happens on the Dynamic Schema A2UI
 * path. This repo maps no A2UI page, so `render_a2ui` is never called and
 * a custom renderer would never mount.
 *
 * DeepAgentspy-react implements this page against a real A2UI surface.
 */
export default function Page() {
  return <RouteHeader path="/generative-ui/a2ui/advanced" />;
}
