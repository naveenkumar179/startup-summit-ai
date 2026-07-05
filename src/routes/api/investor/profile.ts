import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { investorProfiles, startupStageEnum } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const VALID_STAGES = startupStageEnum.enumValues;

export const Route = createFileRoute("/api/investor/profile")({
  server: {
    handlers: {
      GET: async () => {
        const user = await requireUser();
        const [profile] = await db
          .select()
          .from(investorProfiles)
          .where(eq(investorProfiles.userId, user.id));
        return jsonResponse(profile ?? null);
      },
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "investor") {
            return jsonResponse({ message: "Only investors can set up an investor profile" }, 403);
          }

          const body = (await request.json()) as {
            firmName?: string;
            industries?: string[];
            stagePreferences?: string[];
            checkSizeMin?: string;
            checkSizeMax?: string;
            bio?: string;
          };

          const industries = Array.isArray(body.industries) ? body.industries.filter(Boolean) : [];
          const stagePreferences = Array.isArray(body.stagePreferences)
            ? body.stagePreferences.filter((s): s is (typeof VALID_STAGES)[number] =>
                VALID_STAGES.includes(s as (typeof VALID_STAGES)[number]),
              )
            : [];

          if (industries.length === 0) {
            return jsonResponse({ message: "Select at least one industry you invest in" }, 400);
          }
          if (stagePreferences.length === 0) {
            return jsonResponse({ message: "Select at least one stage you invest in" }, 400);
          }

          const [profile] = await db
            .insert(investorProfiles)
            .values({
              userId: user.id,
              firmName: body.firmName?.trim() || null,
              industries,
              stagePreferences,
              checkSizeMin: body.checkSizeMin?.trim() || null,
              checkSizeMax: body.checkSizeMax?.trim() || null,
              bio: body.bio?.trim() || null,
            })
            .onConflictDoUpdate({
              target: investorProfiles.userId,
              set: {
                firmName: body.firmName?.trim() || null,
                industries,
                stagePreferences,
                checkSizeMin: body.checkSizeMin?.trim() || null,
                checkSizeMax: body.checkSizeMax?.trim() || null,
                bio: body.bio?.trim() || null,
                updatedAt: new Date(),
              },
            })
            .returning();

          return jsonResponse(profile);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Save investor profile error:", error);
          return jsonResponse({ message: "Failed to save profile" }, 500);
        }
      },
    },
  },
});
