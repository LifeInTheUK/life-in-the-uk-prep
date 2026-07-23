import { NextResponse } from "next/server";
import { getAllQuestions } from "@/src/questionsData";

export async function GET() {
  const questions = await getAllQuestions();
  return NextResponse.json(questions, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
