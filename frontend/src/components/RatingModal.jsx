import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import RatingStars from "@/components/RatingStars";

export default function RatingModal({
  raterId,
  raterName,
  ratedId,
  ratedName,
  ratedRole,
  productId,
  productTitle,
  paymentId,
  onClose,
  onSubmitted,
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.Rating.create({
        rater_id: raterId,
        rater_name: raterName,
        rated_id: ratedId,
        rated_name: ratedName,
        rated_role: ratedRole,
        product_id: productId || "",
        product_title: productTitle || "",
        payment_id: paymentId || "",
        rating,
        review: review.trim() || undefined,
      });

      // Update aggregate rating on the rated entity
      const allRatings = await base44.entities.Rating.filter({ rated_id: ratedId }, "-created_date", 500);
      const total = allRatings.length;
      const avg = total > 0 ? allRatings.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;

      if (ratedRole === "seller") {
        await base44.entities.Seller.update(ratedId, {
          average_rating: Math.round(avg * 10) / 10,
          total_ratings: total,
          fee_waiver: avg >= 5.0,
        });
      }
      // Buyer aggregate is computed on-the-fly from Rating records (User entity is read-only for other users)

      toast({ title: "Rating submitted!", description: "Thank you for your feedback." });
      onSubmitted?.();
    } catch (e) {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={() => !submitting && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-zinc-300 rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-5 border-b border-zinc-200">
          <h3 className="text-zinc-900 font-bold">Rate {ratedName}</h3>
          <p className="text-zinc-500 text-xs mt-1">{productTitle}</p>
        </div>
        <div className="p-5">
          <div className="bg-zinc-100 rounded-xl p-4 mb-4 text-center">
            <p className="text-zinc-500 text-xs mb-3">How was your experience?</p>
            <RatingStars value={rating} onChange={setRating} size={36} />
            {rating > 0 && (
              <p className="text-[#FFD700] text-sm font-bold mt-2">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Review (optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-3 bg-zinc-100 border border-zinc-300 text-zinc-900 text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !rating}
              className="flex-1 py-3 bg-[#FFD700] text-black font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} />}
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}