import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks, startups, startupStageEnum } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const VALID_STAGES = startupStageEnum.enumValues;

export const Route = createFileRoute("/api/startups/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();
          if (user.role !== "founder") {
            return jsonResponse({ message: "Only founders can list their startups" }, 403);
          }
          const items = await db
            .select()
            .from(startups)
            .where(eq(startups.founderId, user.id))
            .orderBy(desc(startups.createdAt));
          return jsonResponse(items);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List startups error:", error);
          return jsonResponse({ message: "Failed to load startups" }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "founder") {
            return jsonResponse({ message: "Only founders can create startups" }, 403);
          }

          const body = (await request.json()) as Record<string, string | undefined>;

          if (!body.name?.trim() || !body.industry?.trim()) {
            return jsonResponse({ message: "Startup name and industry are required" }, 400);
          }

          const stage = body.stage && VALID_STAGES.includes(body.stage as (typeof VALID_STAGES)[number])
            ? (body.stage as (typeof VALID_STAGES)[number])
            : "idea";

          let pitchDeckId: string | null = null;
          if (body.pitchDeckId?.trim()) {
            const [deck] = await db
              .select()
              .from(pitchDecks)
              .where(eq(pitchDecks.id, body.pitchDeckId.trim()));
            if (deck && deck.userId === user.id) {
              pitchDeckId = deck.id;
            }
          }

          const [startup] = await db
            .insert(startups)
            .values({
              founderId: user.id,
              name: body.name.trim(),
              tagline: body.tagline?.trim() || null,
              industry: body.industry.trim(),
              description: body.description?.trim() || null,
              businessModel: body.businessModel?.trim() || null,
              stage,
              fundingRequired: body.fundingRequired?.trim() || null,
              location: body.location?.trim() || null,
              website: body.website?.trim() || null,
              foundingYear: body.foundingYear?.trim() || null,
              teamSize: body.teamSize?.trim() || null,
              revenue: body.revenue?.trim() || null,
              customers: body.customers?.trim() || null,
              logoUrl: body.logoUrl || null,
              pitchDeckId,
              status: body.status === "published" ? "published" : "draft",
            })
            .returning();

          return jsonResponse(startup, 201);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Create startup error:", error);
          return jsonResponse({ message: "Failed to create startup" }, 500);
        }
      },
    },
  },
});

export { VALID_STAGES };
