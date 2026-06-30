export interface HeroSlide {
  slug: string;
  image: string;
  title: string;
  titleEm: string;
  badge: string;
  category: string;
  excerpt: string;
  author: string;
  authorRole: string;
  authorInitials: string;
  readingTime: string;
  timeAgo: string;
  date: string;
  isPremium: boolean;
  contentType?: "article" | "video" | "podcast" | "gallery";
  videoUrl?: string;
}

export interface HomeCard {
  slug?: string;
  title: string;
  cat: string;
  meta: string;
  image: string;
  author?: string;
  time?: string;
  excerpt?: string;
  badge?: string;
}

export interface HomeTopStory {
  num: string;
  slug: string;
  cat: string;
  title: string;
  meta: string;
  image: string;
}

export interface HomeEditorsChoice {
  featured: HomeCard & { tags: string[]; excerpt: string };
  rows: HomeCard[];
  side: HomeCard & { excerpt: string };
}

export interface HomeLatest {
  featured: HomeCard & { badge: string };
  items: HomeCard[];
}

export interface HomeVideo {
  slug?: string;
  cat: string;
  title: string;
  duration: string;
  views: string;
  image: string;
}

export interface HomeOpinion {
  accent: boolean;
  text: string;
  title?: string;
  name: string;
  role: string;
  avatar: string;
  image: string;
  slug?: string;
}

export interface HomeThematicCol {
  title: string;
  href: string;
  main: { cat: string; title: string; image: string; slug?: string };
  subs: { num: string; cat: string; title: string; slug?: string }[];
}

export interface HomeRubriqueBlock {
  slug: string;
  title: string;
  href: string;
  articles: HomeCard[];
}

export interface HomeUrgent {
  articles: HomeTopStory[];
  alerts: { text: string; link?: string }[];
}

export interface HomePageViewModel {
  heroSlides: HeroSlide[];
  miniCards: HomeCard[];
  topStories: HomeTopStory[];
  popularTags: string[];
  editorsChoice: HomeEditorsChoice;
  latest: HomeLatest;
  videos: HomeVideo[];
  opinions: HomeOpinion[];
  thematic: HomeThematicCol[];
  urgent: HomeUrgent;
  rubriques: HomeRubriqueBlock[];
  formatRows: HomeRubriqueBlock[];
}
