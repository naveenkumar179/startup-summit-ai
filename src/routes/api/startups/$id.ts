import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks, startups, startupStageEnum, watchlist } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const VALID_STAGES = startupStageEnum.enumValues;

export const Route = createFileRoute("/api/startups/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const user = await requireUser();
          const [startup] = await db.select().from(startups).where(eq(startups.id, params.id));
          if (!startup) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }

          const isOwner = startup.founderId === user.id;
          if (!isOwner && startup.status !== "published") {
            return jsonResponse({ message: "Startup not found" }, 404);
          }

          const [deck] = startup.pitchDeckId
            ? await db.select().from(pitchDecks).where(eq(pitchDecks.id, startup.pitchDeckId))
            : [null];

          let isWatchlisted = false;
          if (user.role === "investor") {
            const [item] = await db
              .select()
              .from(watchlist)
              .where(and(eq(watchlist.investorId, user.id), eq(watchlist.startupId, startup.id)));
            isWatchlisted = !!item;
          }

          return jsonResponse({ startup, deck: deck ?? null, isOwner, isWatchlisted });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Get startup error:", error);
          return jsonResponse({ message: "Failed to load startup" }, 500);
        }
      },
      PATCH: async ({ request, params }) => {
        try {
          const user = await requireUser();
          const [startup] = await db.select().from(startups).where(eq(startups.id, params.id));
          if (!startup || startup.founderId !== user.id) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }

          const body = (await request.json()) as Record<string, string | undefined>;
          const update: Record<string, unknown> = { updatedAt: new Date() };

          const stringFields = [
            "name",
            "tagline",
            "industry",
            "description",
            "businessModel",
            "fundingRequired",
            "location",
            "website",
            "foundingYear",
            "teamSize",
            "revenue",
            "customers",
            "logoUrl",
            "pitchDeckId",
          ] as const;

          for (const field of stringFields) {
            if (field in body) {
              update[field] = body[field]?.trim() || null;
            }
          }

          if (body.stage && VALID_STAGES.includes(body.stage as (typeof VALID_STAGES)[number])) {
            update.stage = body.stage;
          }

          if (body.status === "published" || body.status === "draft") {
            update.status = body.status;
          }

          const [updated] = await db
            .update(startups)
            .set(update)
            .where(eq(startups.id, params.id))
            .returning();

          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Update startup error:", error);
          return jsonResponse({ message: "Failed to update startup" }, 500);
        }
      },
      DELETE: async ({ params }) => {
        try {
          const user = await requireUser();
          const [startup] = await db.select().from(startups).where(eq(startups.id, params.id));
          if (!startup || startup.founderId !== user.id) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }
          await db.delete(startups).where(eq(startups.id, params.id));
          return jsonResponse({ message: "ok" });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Delete startup error:", error);
          return jsonResponse({ message: "Failed to delete startup" }, 500);
        }
      },
    },
  },
});
