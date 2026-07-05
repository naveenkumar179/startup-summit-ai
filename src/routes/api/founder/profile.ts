import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { founderProfiles, startupStageEnum } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const VALID_STAGES = startupStageEnum.enumValues;

export const Route = createFileRoute("/api/founder/profile")({
  server: {
    handlers: {
      GET: async () => {
        const user = await requireUser();
        const [profile] = await db
          .select()
          .from(founderProfiles)
          .where(eq(founderProfiles.userId, user.id));
        return jsonResponse(profile ?? null);
      },
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "founder") {
            return jsonResponse({ message: "Only founders can set up a startup profile" }, 403);
          }

          const body = (await request.json()) as {
            companyName?: string;
            industry?: string;
            stage?: string;
            fundingAsk?: string;
          };

          if (!body.companyName?.trim() || !body.industry?.trim()) {
            return jsonResponse({ message: "Company name and industry are required" }, 400);
          }

          if (!body.stage || !VALID_STAGES.includes(body.stage as (typeof VALID_STAGES)[number])) {
            return jsonResponse({ message: "Invalid stage" }, 400);
          }

          const [profile] = await db
            .insert(founderProfiles)
            .values({
              userId: user.id,
              companyName: body.companyName.trim(),
              industry: body.industry.trim(),
              stage: body.stage as (typeof VALID_STAGES)[number],
              fundingAsk: body.fundingAsk?.trim() || null,
            })
            .onConflictDoUpdate({
              target: founderProfiles.userId,
              set: {
                companyName: body.companyName.trim(),
                industry: body.industry.trim(),
                stage: body.stage as (typeof VALID_STAGES)[number],
                fundingAsk: body.fundingAsk?.trim() || null,
                updatedAt: new Date(),
              },
            })
            .returning();

          return jsonResponse(profile);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Save founder profile error:", error);
          return jsonResponse({ message: "Failed to save profile" }, 500);
        }
      },
    },
  },
});
