import { QuestionFlow } from "@/components/stage/question-flow";

export default async function DiscoverAnswerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  return <QuestionFlow stageId="discover" questionId={typeof q === "string" ? q : undefined} />;
}
