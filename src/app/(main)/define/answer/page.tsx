import { QuestionFlow } from "@/components/stage/question-flow";

export default async function DefineAnswerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  return <QuestionFlow stageId="define" questionId={typeof q === "string" ? q : undefined} />;
}
