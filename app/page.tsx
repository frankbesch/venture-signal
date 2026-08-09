import type { Metadata } from "next";
import { IdeaLab } from "./idea-lab";

export const metadata: Metadata = {
  title: "Venture Signal — evidence before enthusiasm",
  description:
    "A local-first decision lab for pressure-testing low-capex business ideas.",
};

export default function Home() {
  return <IdeaLab />;
}
