import { PLUGIN_METADATA } from "@shared/constants.js";

export function Header() {
  return (
    <section className="hero-card">
      <p className="eyebrow">Phase 4</p>
      <h1>{PLUGIN_METADATA.name}</h1>
      <p className="lede">
        React shell now has shared state, source selection and runtime bridge wiring. Provider
        fetching will be added in the next phase.
      </p>
    </section>
  );
}
