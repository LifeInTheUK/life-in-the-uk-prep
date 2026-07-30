import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const rows = await sql`
    WITH ids AS (
      SELECT ${me}::text AS user_id
      UNION
      SELECT friend_id FROM friends WHERE user_id = ${me}
    ),
    user_acc AS (
      SELECT p.user_id, SUM(p.correct)::float / NULLIF(SUM(p.attempts), 0) AS acc,
             SUM(p.attempts) AS attempts
      FROM progress p
      JOIN ids ON ids.user_id = p.user_id
      GROUP BY p.user_id
    )
    SELECT ids.user_id,
           u.name, u.image,
           COALESCE(ua.acc, 0) AS accuracy,
           COALESCE(ua.attempts, 0) AS attempts,
           (u.id IS NULL) AS deleted
    FROM ids
    LEFT JOIN user_acc ua ON ua.user_id = ids.user_id
    LEFT JOIN neon_auth."user" u ON u.id::text = ids.user_id
    ORDER BY accuracy DESC, attempts DESC
  `;

  return NextResponse.json({
    me,
    entries: rows.map((r) => ({
      userId: r.user_id as string,
      name: r.deleted ? null : (r.name as string | null),
      image: r.deleted ? null : (r.image as string | null),
      accuracy: Math.round(Number(r.accuracy) * 100),
      attempts: Number(r.attempts),
      isMe: r.user_id === me,
      accountDeleted: r.deleted as boolean,
    })),
  });
}
