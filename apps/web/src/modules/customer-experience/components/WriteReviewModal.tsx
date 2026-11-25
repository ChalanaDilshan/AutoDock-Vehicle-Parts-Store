import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { reviewApi } from '../api/customerExperienceApi.js';
import { Alert, Button, Input, Modal } from '../../../shared/components/index.js';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [suborderId, setSuborderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!suborderId.trim()) {
      setErrorMessage('Please enter your delivered order reference ID.');
      return;
    }
    if (comment.trim().length < 5) {
      setErrorMessage('Please write a brief review (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewApi.submit({
        productId,
        suborderId: suborderId.trim(),
        rating,
        comment: comment.trim(),
      });
      setComment('');
      setSuborderId('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Write a Product Review"
      subtitle={productName}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Your Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                  className="p-1 rounded-md hover:bg-slate-100"
                >
                  <Star
                    className={`w-6 h-6 ${
                      filled ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-slate-600 font-medium">
              {rating} / 5
            </span>
          </div>
        </div>

        <Input
          label="Delivered Suborder Reference ID"
          required
          value={suborderId}
          onChange={(e) => setSuborderId(e.target.value)}
          placeholder="e.g. 64b8f0000000000000000101"
          helperText="Only verified buyers with a delivered order can submit reviews."
        />

        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Review Comment <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="review-comment"
            rows={4}
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share fitment accuracy, build quality, and delivery experience..."
            className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
