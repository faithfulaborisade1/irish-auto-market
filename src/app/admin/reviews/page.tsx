'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  isPublic: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  dealer: {
    id: string;
    businessName: string;
    email: string;
  };
  reviewer: {
    id: string | null;
    name: string;
    email: string | null;
    avatar: string | null;
    isRegistered: boolean;
  };
}

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processingReviewId, setProcessingReviewId] = useState<string | null>(null);

  const fetchReviews = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.reviews);
      setStatusCounts(data.statusCounts);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, newStatus: string, moderatorNotes?: string) => {
    try {
      setProcessingReviewId(reviewId);

      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          moderatorNotes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update review');
      }

      // Refresh the reviews list
      await fetchReviews(currentPage, selectedStatus);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setProcessingReviewId(null);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingReviewId(reviewId);

      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review');
      }

      // Refresh the reviews list
      await fetchReviews(currentPage, selectedStatus);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setProcessingReviewId(null);
    }
  };

  useEffect(() => {
    fetchReviews(1, selectedStatus);
  }, [selectedStatus]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'FLAGGED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Management</h1>
        <p className="text-gray-600">Moderate dealer reviews and customer feedback</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-800">{statusCounts.pending}</div>
          <div className="text-yellow-600">Pending Reviews</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-800">{statusCounts.approved}</div>
          <div className="text-green-600">Approved Reviews</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-800">{statusCounts.rejected}</div>
          <div className="text-red-600">Rejected Reviews</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-800">{statusCounts.flagged}</div>
          <div className="text-orange-600">Flagged Reviews</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Reviews' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'flagged', label: 'Flagged' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedStatus === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white shadow rounded-lg">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reviews found for the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(review.status)}`}>
                        {review.status}
                      </span>
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Dealer:</strong> {review.dealer.businessName}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Reviewer:</strong> {review.reviewer.name}
                        {review.reviewer.isRegistered ? (
                          <span className="ml-2 text-green-600 text-xs">(Registered User)</span>
                        ) : (
                          <span className="ml-2 text-gray-500 text-xs">(Guest)</span>
                        )}
                      </div>
                    </div>

                    {review.title && (
                      <h3 className="font-medium text-gray-900 mb-2">{review.title}</h3>
                    )}

                    <p className="text-gray-700 mb-3">{review.comment}</p>

                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    {review.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'REJECTED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'FLAGGED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          Flag
                        </button>
                      </>
                    )}

                    {review.status === 'APPROVED' && (
                      <>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'REJECTED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'FLAGGED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          Flag
                        </button>
                      </>
                    )}

                    {review.status === 'REJECTED' && (
                      <button
                        onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                        disabled={processingReviewId === review.id}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}

                    {review.status === 'FLAGGED' && (
                      <>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'REJECTED')}
                          disabled={processingReviewId === review.id}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => deleteReview(review.id)}
                      disabled={processingReviewId === review.id}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => fetchReviews(currentPage - 1, selectedStatus)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchReviews(currentPage + 1, selectedStatus)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => fetchReviews(currentPage - 1, selectedStatus)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchReviews(currentPage + 1, selectedStatus)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}