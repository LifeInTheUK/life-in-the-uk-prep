import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/db";

export async function GET(request: NextRequest) {
  const accuracyParam = request.nextUrl.searchParams.get("accuracy");
  const accuracy = accuracyParam !== null ? Number(accuracyParam) : null;

  const [{ count: totalTests }] = await sql`SELECT count(*) FROM history`;

  const hasAccuracy = accuracy !== null && Number.isFinite(accuracy);

  const [userAcc] = hasAccuracy
    ? await sql`
        WITH user_acc AS (
          SELECT user_id, SUM(correct)::float / NULLIF(SUM(attempts), 0) AS acc
          FROM progress
          GROUP BY user_id
          HAVING SUM(attempts) > 0
        )
        SELECT
          COUNT(*) AS total_users,
          AVG(acc) AS avg_accuracy,
          (SELECT COUNT(*) FROM user_acc WHERE acc < ${accuracy! / 100}) AS users_below
        FROM user_acc
      `
    : await sql`
        WITH user_acc AS (
          SELECT user_id, SUM(correct)::float / NULLIF(SUM(attempts), 0) AS acc
          FROM progress
          GROUP BY user_id
          HAVING SUM(attempts) > 0
        )
        SELECT
          COUNT(*) AS total_users,
          AVG(acc) AS avg_accuracy,
          NULL AS users_below
        FROM user_acc
      `;

  const totalUsers = Number(userAcc.total_users);
  const averageAccuracy =
    totalUsers > 0 ? Math.round(Number(userAcc.avg_accuracy) * 100) : 0;
  const percentile =
    totalUsers > 0 && userAcc.users_below !== null
      ? Math.round((Number(userAcc.users_below) / totalUsers) * 100)
      : null;

  return NextResponse.json({
    totalTests: Number(totalTests),
    totalUsers,
    averageAccuracy,
    percentile,
  });
}
