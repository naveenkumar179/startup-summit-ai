import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { extractPdfText, extractPdfPages, analyzePitchDeckText } from "@/lib/server/pitch-deck";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/pitch-deck/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "founder") {
            return jsonResponse({ message: "Only founders can upload pitch decks" }, 403);
          }

          const formData = await request.formData();
          const file = formData.get("file");

          if (!file || !(file instanceof File)) {
            return jsonResponse({ message: "No file provided" }, 400);
          }

          if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            return jsonResponse({ message: "Only PDF files are supported" }, 400);
          }

          if (file.size > 20 * 1024 * 1024) {
            return jsonResponse({ message: "File must be smaller than 20MB" }, 400);
          }

          const buffer = Buffer.from(await file.arrayBuffer());

          let extractedText: string;
          try {
            extractedText = await extractPdfText(buffer);
          } catch (err) {
            console.error("PDF extraction error:", err);
            return jsonResponse({ message: "Could not read this PDF. Please try another file." }, 400);
          }

          if (!extractedText || extractedText.length < 30) {
            return jsonResponse(
              { message: "Couldn't find readable text in this PDF. Try exporting it differently." },
              400
            );
          }

          let pageTexts: string[] = [];
          try {
            pageTexts = await extractPdfPages(buffer);
          } catch (err) {
            console.error("PDF page extraction error:", err);
          }

          const [deck] = await db
            .insert(pitchDecks)
            .values({
              userId: user.id,
              fileName: file.name,
              extractedText,
              pageTexts: pageTexts.length > 0 ? pageTexts : null,
              status: "processing",
            })
            .returning();

          try {
            const analysis = await analyzePitchDeckText(extractedText);
            const [updated] = await db
              .update(pitchDecks)
              .set({ analysis, status: "analyzed", updatedAt: new Date() })
              .where(eq(pitchDecks.id, deck.id))
              .returning();

            return jsonResponse(updated, 200);
          } catch (err) {
            console.error("Pitch deck analysis error:", err);
            const message = err instanceof Error ? err.message : "Analysis failed";
            await db
              .update(pitchDecks)
              .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
              .where(eq(pitchDecks.id, deck.id));
            return jsonResponse({ message: "Failed to analyze pitch deck. Please try again." }, 500);
          }
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Pitch deck upload error:", error);
          return jsonResponse({ message: "Failed to upload pitch deck" }, 500);
        }
      },
    },
  },
});
