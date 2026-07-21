import { NextResponse } from "next/server";
import { questions } from "@/src/questions";

export function GET() {
    return NextResponse.json(questions);
}
