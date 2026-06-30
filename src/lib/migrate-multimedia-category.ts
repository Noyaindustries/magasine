import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";

let migrationDone = false;

export async function migrateRetiredMultimediaCategory(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    await connectDB();

    const multimedia = await Category.findOne({ slug: "multimedia" });
    if (!multimedia) return;

    const feature = await Category.findOne({ slug: "feature" });
    if (feature) {
      await Article.updateMany(
        { category: multimedia._id },
        { $set: { category: feature._id } }
      );
    }

    multimedia.isActive = false;
    await multimedia.save();
  } catch {
    migrationDone = false;
  }
}
