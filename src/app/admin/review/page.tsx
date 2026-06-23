import { ReviewQueueManager } from "@/components/admin/ReviewQueueManager";
import { getReviewQueueItems } from "@/lib/admin-review";
import "../admin-review.css";

export default async function AdminReviewQueuePage() {
  const items = await getReviewQueueItems();

  return (
    <div className="admin-content admin-content--review">
      <ReviewQueueManager initialItems={items} />
    </div>
  );
}
