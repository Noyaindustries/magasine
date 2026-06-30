import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Author } from "@/models/Author";
import { Article } from "@/models/Article";
import { Alert } from "@/models/Alert";
import { Newsletter } from "@/models/Newsletter";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import {
  SEED_ALERTS,
  SEED_ARTICLES,
  SEED_AUTHORS,
  SEED_CATEGORIES,
  SEED_NEWSLETTER,
} from "@/lib/seed-data";
import { getAuthorAvatarUrl, resolveFeaturedImage } from "@/lib/images";
import { ensureDefaultAdmin, DEFAULT_ADMIN_PASSWORD } from "@/lib/ensure-admin";
import { resolveArticleContent } from "@/lib/article-content";
import { migrateCategorySlugs } from "@/lib/migrate-category-slugs";
import { isBootstrapAuthorized } from "@/lib/bootstrap-secret";

function canRepairAdmin(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") {
    return request.nextUrl.searchParams.get("repairAdmin") !== "false";
  }
  return (
    request.nextUrl.searchParams.get("repairAdmin") === "true" &&
    isBootstrapAuthorized(request)
  );
}

async function clearDatabase() {
  await Promise.all([
    Category.deleteMany({}),
    Author.deleteMany({}),
    Article.deleteMany({}),
    Alert.deleteMany({}),
    Newsletter.deleteMany({}),
    User.deleteMany({}),
  ]);
}

export async function GET(request: NextRequest) {
  try {
    const force = request.nextUrl.searchParams.get("force") === "true";

    if (force) {
      const session = await auth();
      if (!session?.user || session.user.role !== "super_admin") {
        return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
      }
    }

    await connectDB();
    const existing = await Category.countDocuments();

    if (existing > 0 && !force) {
      const repairAdmin = canRepairAdmin(request);
      const admin = repairAdmin
        ? await ensureDefaultAdmin({
            resetPassword:
              process.env.NODE_ENV === "development" ||
              request.nextUrl.searchParams.get("resetPassword") !== "false",
          })
        : null;
      const categoriesMigrated = await migrateCategorySlugs();
      return NextResponse.json({
        message: repairAdmin
          ? "Admin account verified or repaired."
          : "Database already initialized. Use ?force=true to reset, or /api/bootstrap/admin?key=… in production.",
        seeded: false,
        categoriesMigrated,
        admin: admin
          ? {
              email: admin.email,
              password:
                admin.repaired || admin.created ? DEFAULT_ADMIN_PASSWORD : undefined,
              ensured: admin.repaired || admin.created,
            }
          : undefined,
      });
    }

    if (existing > 0 && force) {
      await clearDatabase();
    }

    await Category.insertMany(SEED_CATEGORIES);

    const createdAuthors = await Author.insertMany(
      SEED_AUTHORS.map((a) => ({
        ...a,
        avatar: getAuthorAvatarUrl(a.slug),
      }))
    );

    const catMap = Object.fromEntries(
      (await Category.find().lean()).map((c) => [c.slug, c._id])
    );

    const now = new Date();
    const articles = SEED_ARTICLES.map((article, i) => {
      const words = article.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
      const publishedAt = new Date(now.getTime() - i * 3600000 * 4);
      const authorIndex = article.authorIndex ?? i % createdAuthors.length;

      const slug = article.slug ?? slugify(article.title, { lower: true, strict: true });

      return {
        title: article.title,
        subtitle: article.subtitle,
        slug,
        excerpt: article.excerpt,
        content: resolveArticleContent(article.title, article.excerpt, article.content, slug),
        featuredImage: resolveFeaturedImage(article.image),
        featuredImageAlt: article.title,
        category: catMap[article.category],
        authors: [createdAuthors[authorIndex]._id],
        tags: article.tags,
        status: "published" as const,
        publishedAt,
        readingTime: Math.max(1, Math.ceil(words / 200)),
        isFeatured: article.isFeatured ?? false,
        isTopStory: article.isTopStory ?? false,
        isUrgent: article.isUrgent ?? false,
        isEditorsChoice: article.isEditorsChoice ?? false,
        isPremium: article.isPremium ?? false,
        contentType: article.contentType ?? "article",
        videoUrl: article.videoUrl,
        gallery: article.gallery?.map((item) => ({
          ...item,
          url: resolveFeaturedImage(item.url),
        })),
        views: Math.floor(Math.random() * 8000) + 200,
      };
    });

    await Article.insertMany(articles);
    await Alert.insertMany(SEED_ALERTS);
    await Newsletter.insertMany(SEED_NEWSLETTER);

    const adminPassword = await bcrypt.hash("Admin123!", 12);
    await User.create({
      name: "Administrator",
      email: "admin@globalsouthwatch.com".toLowerCase(),
      password: adminPassword,
      role: "super_admin",
    });

    return NextResponse.json({
      message: "Database initialized successfully",
      seeded: true,
      stats: {
        categories: SEED_CATEGORIES.length,
        authors: SEED_AUTHORS.length,
        articles: articles.length,
        alerts: SEED_ALERTS.length,
        newsletter: SEED_NEWSLETTER.length,
        admin: "admin@globalsouthwatch.com / Admin123!",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    const message = String(error);
    const atlasLimit = message.includes("500 collections");
    return NextResponse.json(
      {
        error: atlasLimit
          ? "Atlas limit reached (500 collections). Delete unused databases (e.g. « magazine » with a space) in MongoDB Atlas, or use a local database."
          : "Initialization error",
        details: message,
      },
      { status: 500 }
    );
  }
}
