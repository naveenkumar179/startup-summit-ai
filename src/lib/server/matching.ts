import type { FounderProfile, InvestorProfile, PitchDeck, User } from "./db/schema";

export type FounderMatch = {
  founder: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  profile: FounderProfile;
  deck: PitchDeck | null;
  score: number;
  reasons: string[];
};

export type InvestorMatch = {
  investor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  profile: InvestorProfile;
  score: number;
  reasons: string[];
};

function stageLabel(stage: string): string {
  return stage
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function scoreFounderForInvestor(
  founderProfile: FounderProfile,
  deck: PitchDeck | null,
  investorProfile: InvestorProfile,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const industryMatch = investorProfile.industries.some(
    (i) => i.toLowerCase() === founderProfile.industry.toLowerCase(),
  );
  if (industryMatch) {
    score += 45;
    reasons.push(`Industry fit: ${founderProfile.industry}`);
  } else if (investorProfile.industries.length === 0) {
    score += 15;
  }

  const stageMatch = investorProfile.stagePreferences.includes(founderProfile.stage);
  if (stageMatch) {
    score += 30;
    reasons.push(`Stage fit: ${stageLabel(founderProfile.stage)}`);
  } else if (investorProfile.stagePreferences.length === 0) {
    score += 10;
  }

  if (deck?.status === "analyzed" && deck.analysis) {
    const pitchBonus = Math.round((deck.analysis.overallScore / 100) * 25);
    score += pitchBonus;
    reasons.push(`Pitch score: ${deck.analysis.overallScore}/100`);

    const investorTypeMentionsIndustry = deck.analysis.suggestedInvestorTypes.some((t) =>
      t.toLowerCase().includes(founderProfile.industry.toLowerCase().split(" / ")[0].toLowerCase()),
    );
    if (investorTypeMentionsIndustry) {
      score += 5;
    }
  }

  return { score: Math.min(100, score), reasons };
}

export function scoreStartupForInvestor(
  startup: { industry: string; stage: string },
  deck: PitchDeck | null,
  investorProfile: InvestorProfile,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const industryMatch = investorProfile.industries.some(
    (i) => i.toLowerCase() === startup.industry.toLowerCase(),
  );
  if (industryMatch) {
    score += 45;
    reasons.push(`Strong industry match in ${startup.industry}`);
  } else if (investorProfile.industries.length === 0) {
    score += 15;
  }

  const stageMatch = investorProfile.stagePreferences.includes(
    startup.stage as InvestorProfile["stagePreferences"][number],
  );
  if (stageMatch) {
    score += 30;
    reasons.push(`Matches your preferred stage: ${stageLabel(startup.stage)}`);
  } else if (investorProfile.stagePreferences.length === 0) {
    score += 10;
  }

  if (deck?.status === "analyzed" && deck.analysis) {
    const pitchBonus = Math.round((deck.analysis.overallScore / 100) * 25);
    score += pitchBonus;
    if (deck.analysis.overallScore >= 70) {
      reasons.push(`Strong pitch deck quality (${deck.analysis.overallScore}/100)`);
    }
    if (deck.analysis.strengths.length > 0) {
      reasons.push(deck.analysis.strengths[0]);
    }
  }

  if (reasons.length === 0) {
    reasons.push("Limited overlap with your stated investment preferences");
  }

  return { score: Math.min(100, score), reasons: reasons.slice(0, 4) };
}

export function buildFounderMatches(
  founders: { user: User; profile: FounderProfile; deck: PitchDeck | null }[],
  investorProfile: InvestorProfile,
): FounderMatch[] {
  return founders
    .map(({ user, profile, deck }) => {
      const { score, reasons } = scoreFounderForInvestor(profile, deck, investorProfile);
      return {
        founder: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        profile,
        deck,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildInvestorMatches(
  investors: { user: User; profile: InvestorProfile }[],
  founderProfile: FounderProfile,
  deck: PitchDeck | null,
): InvestorMatch[] {
  return investors
    .map(({ user, profile }) => {
      const { score, reasons } = scoreFounderForInvestor(founderProfile, deck, profile);
      return {
        investor: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        profile,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}
