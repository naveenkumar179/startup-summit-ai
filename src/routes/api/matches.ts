import { createFileRoute } from "@tanstack/react-router";
import { desc, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { founderProfiles, investorProfiles, pitchDecks, users } from "@/lib/server/db/schema";
import { buildFounderMatches, buildInvestorMatches } from "@/lib/server/matching";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/matches")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();

          if (user.role === "investor") {
            const [investorProfile] = await db
              .select()
              .from(investorProfiles)
              .where(eq(investorProfiles.userId, user.id));

            if (!investorProfile) {
              return jsonResponse({ needsProfile: true, matches: [] });
            }

            const foundersWithProfiles = await db
              .select({ user: users, profile: founderProfiles })
              .from(founderProfiles)
              .innerJoin(users, eq(users.id, founderProfiles.userId));

            const founderIds = foundersWithProfiles.map((f) => f.user.id);
            const decks = founderIds.length
              ? await db
                  .select()
                  .from(pitchDecks)
                  .where(inArray(pitchDecks.userId, founderIds))
                  .orderBy(desc(pitchDecks.createdAt))
              : [];

            const latestDeckByFounder = new Map<string, (typeof decks)[number]>();
            for (const deck of decks) {
              if (!latestDeckByFounder.has(deck.userId)) {
                latestDeckByFounder.set(deck.userId, deck);
              }
            }

            const founders = foundersWithProfiles.map((f) => ({
              user: f.user,
              profile: f.profile,
              deck: latestDeckByFounder.get(f.user.id) ?? null,
            }));

            const matches = buildFounderMatches(founders, investorProfile);
            return jsonResponse({ needsProfile: false, matches });
          }

          if (user.role === "founder") {
            const [founderProfile] = await db
              .select()
              .from(founderProfiles)
              .where(eq(founderProfiles.userId, user.id));

            if (!founderProfile) {
              return jsonResponse({ needsProfile: true, matches: [] });
            }

            const [deck] = await db
              .select()
              .from(pitchDecks)
              .where(eq(pitchDecks.userId, user.id))
              .orderBy(desc(pitchDecks.createdAt))
              .limit(1);

            const investorsWithProfiles = await db
              .select({ user: users, profile: investorProfiles })
              .from(investorProfiles)
              .innerJoin(users, eq(users.id, investorProfiles.userId));

            const matches = buildInvestorMatches(
              investorsWithProfiles,
              founderProfile,
              deck ?? null,
            );
            return jsonResponse({ needsProfile: false, matches });
          }

          return jsonResponse({ needsProfile: false, matches: [] });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Fetch matches error:", error);
          return jsonResponse({ message: "Failed to fetch matches" }, 500);
        }
      },
    },
  },
});
