export const NEWSLETTER_TOPICS = [
  {
    id: "general",
    label: "Newsletter",
    description: "Independent journalism from the Global South, curated by our newsroom.",
  },
  {
    id: "weekly",
    label: "Weekly digest",
    description: "A curated recap of the week's most important stories and analysis.",
  },
  {
    id: "africa",
    label: "Africa",
    description: "Continental politics, economy, culture and investigations.",
  },
  {
    id: "latin-america",
    label: "Latin America",
    description: "Coverage from Mexico to Patagonia — in your inbox.",
  },
  {
    id: "south-asia",
    label: "South Asia",
    description: "India, Pakistan, Bangladesh, Sri Lanka and the wider subcontinent.",
  },
  {
    id: "west-asia",
    label: "West Asia",
    description: "Gulf states, Levant, Turkey, Iran and regional diplomacy.",
  },
  {
    id: "investigations",
    label: "Investigations",
    description: "Early alerts when our reporters publish major probes.",
  },
  {
    id: "breaking",
    label: "Breaking news",
    description: "Urgent dispatches on elections, crises and major events.",
  },
] as const;

export type NewsletterTopicId = (typeof NEWSLETTER_TOPICS)[number]["id"];

/** Une seule newsletter pour l'instant — repasser à `true` pour réactiver multi-éditions. */
export const NEWSLETTER_MULTI_EDITION_ENABLED = false;

export const PRIMARY_NEWSLETTER_TOPIC_ID: NewsletterTopicId = "general";

export const DEFAULT_NEWSLETTER_TOPICS: NewsletterTopicId[] = [PRIMARY_NEWSLETTER_TOPIC_ID];

export function isNewsletterMultiEditionEnabled(): boolean {
  return NEWSLETTER_MULTI_EDITION_ENABLED;
}

/** Topics exposed in public/admin UIs (single newsletter when multi-edition is off). */
export function getSelectableNewsletterTopics() {
  if (!NEWSLETTER_MULTI_EDITION_ENABLED) {
    return NEWSLETTER_TOPICS.filter((topic) => topic.id === PRIMARY_NEWSLETTER_TOPIC_ID);
  }
  return [...NEWSLETTER_TOPICS];
}

export function getNewsletterSignupPreferences(
  preferences?: readonly string[] | null
): NewsletterTopicId[] {
  if (!NEWSLETTER_MULTI_EDITION_ENABLED) {
    return [PRIMARY_NEWSLETTER_TOPIC_ID];
  }

  if (preferences?.length) {
    const valid = preferences.filter((id): id is NewsletterTopicId =>
      NEWSLETTER_TOPICS.some((topic) => topic.id === id)
    );
    if (valid.length > 0) return valid;
  }

  return [...DEFAULT_NEWSLETTER_TOPICS];
}

export const DEFAULT_NEWSLETTER_BENEFITS = [
  "Free newsletter in your inbox",
  isNewsletterMultiEditionEnabled()
    ? "Regional editions you choose"
    : "Independent journalism from the Global South",
  "Investigation alerts — always free",
] as const;
