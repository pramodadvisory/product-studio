import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublishedView } from "@/components/published/published-view";
import { getPublishedProject } from "@/lib/publishing/server";

/**
 * A published project: the read-only copy behind a share link.
 *
 * Lives outside the (main) layout, so readers get no sidebar, assistant or
 * editing. Rendered on every request, so a republish or unpublish shows at
 * once rather than when a cache expires.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  // Share links are private by obscurity: keep them out of search engines.
  const robots = { index: false, follow: false };
  if (!project) return { title: "Not available", robots };
  return {
    title: `${project.doc.productName} · Product Studio`,
    description: project.doc.description,
    robots,
  };
}

export default async function PublishedProjectPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();
  return <PublishedView project={project} />;
}
