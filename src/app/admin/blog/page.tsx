'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Clock,
  Archive,
  TrendingUp
} from 'lucide-react';

interface BlogAuthor {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  avatar?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  imageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  category: string;
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  author: BlogAuthor;
}

interface BlogFilters {
  search: string;
  status: string;
  category: string;
}

const BLOG_CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'CAR_BUYING_TIPS', label: 'Car Buying Tips' },
  { value: 'MARKET_TRENDS', label: 'Market Trends' },
  { value: 'DEALER_ADVICE', label: 'Dealer Advice' },
  { value: 'FINANCING', label: 'Financing' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'REVIEWS', label: 'Reviews' },
  { value: 'NEWS', label: 'News' },
  { value: 'GUIDES', label: 'Guides' },
];

export default function AdminBlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filters
  const [filters, setFilters] = useState<BlogFilters>({
    search: '',
    status: 'all',
    category: 'all',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, itemsPerPage, filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category !== 'all' && { category: filters.category }),
      });

      const response = await fetch(`/api/blog?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalPosts(data.pagination?.total || 0);
      } else {
        let errorMessage = 'Failed to load blog posts';

        switch (response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. Insufficient permissions.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again or contact support.';
            break;
          default:
            errorMessage = `Failed to load posts (Status: ${response.status}). Please try again.`;
        }

        setError(errorMessage);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to load blog posts. Please refresh the page.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(`delete-${postId}`);
      setError(null);

      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Blog post deleted successfully');
        fetchPosts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete blog post');
      }
    } catch (error: any) {
      setError('Network error while deleting post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      setActionLoading(`status-${postId}`);
      setError(null);

      const response = await fetch(`/api/blog/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update post status');
      }
    } catch (error: any) {
      setError('Network error while updating post');
    } finally {
      setActionLoading(null);
    }
  };

  const viewPostDetails = async (postId: string) => {
    try {
      const response = await fetch(`/api/blog/${postId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPost(data);
        setShowPostModal(true);
      } else {
        setError('Failed to load post details');
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      setError('Failed to load post details');
    }
  };

  const toggleRowExpansion = (postId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = BLOG_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
    });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Posts</h2>
            <p className="text-gray-600 mb-4">{error}</p>

            <button
              onClick={fetchPosts}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Blog Management
                {totalPosts > 0 && (
                  <span className="text-lg text-gray-500 font-normal">({totalPosts.toLocaleString()})</span>
                )}
              </h1>
              <p className="text-gray-600 text-sm">Create and manage blog posts</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin/blog/new"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </a>

              <button
                onClick={fetchPosts}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh post list"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {BLOG_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <Filter className="w-4 h-4 inline mr-2" />
                Showing {posts.length} of {totalPosts} posts
              </div>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Message */}
        {error && posts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author & Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <React.Fragment key={post.id}>
                    <tr className="hover:bg-gray-50">
                      {/* Post Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          {post.featuredImage && (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={post.featuredImage}
                                alt={post.imageAlt || post.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className={`${post.featuredImage ? 'ml-4' : ''} flex-1 min-w-0`}>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {post.title}
                              </h3>
                              <button
                                onClick={() => toggleRowExpansion(post.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {expandedRows.has(post.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">/{post.slug}</p>
                            {post.excerpt && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.excerpt}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Author & Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {post.author.firstName} {post.author.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getCategoryLabel(post.category)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {post.viewsCount} views
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {post.likesCount} likes
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString()
                              : 'Not published'
                            }
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => viewPostDetails(post.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Post */}
                          <a
                            href={`/admin/blog/${post.id}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </a>

                          {/* View Public Page */}
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                            title="View Public Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Status Actions */}
                          {post.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusChange(post.id, 'PUBLISHED')}
                              disabled={actionLoading === `status-${post.id}`}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                              title="Publish Post"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {post.status === 'PUBLISHED' && (
                            <button
                              onClick={() => handleStatusChange(post.id, 'ARCHIVED')}
                              disabled={actionLoading === `status-${post.id}`}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                              title="Archive Post"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Post */}
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={actionLoading === `delete-${post.id}`}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Post"
                          >
                            {actionLoading === `delete-${post.id}` ? (
                              <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {expandedRows.has(post.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Content Preview</h4>
                              <p className="text-xs text-gray-600 line-clamp-3">
                                {post.content.replace(/<[^>]*>/g, '').substring(0, 300)}...
                              </p>
                            </div>

                            {post.tags && post.tags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                  {post.tags.map((tag: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-4 text-xs text-gray-500">
                              <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
                              <div>Updated: {new Date(post.updatedAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {posts.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No blog posts found</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first blog post to get started
              </p>
              <a
                href="/admin/blog/new"
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </a>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalPosts)}</span> of{' '}
                  <span className="font-medium">{totalPosts}</span> results
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Details Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPost.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{getCategoryLabel(selectedPost.category)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPostModal(false);
                    setSelectedPost(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Featured Image */}
              {selectedPost.featuredImage && (
                <div>
                  <img
                    src={selectedPost.featuredImage}
                    alt={selectedPost.imageAlt || selectedPost.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Post Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Status:</span> <span className="font-medium">{selectedPost.status}</span></div>
                    <div><span className="text-gray-500">Author:</span> <span className="font-medium">{selectedPost.author.firstName} {selectedPost.author.lastName}</span></div>
                    <div><span className="text-gray-500">Category:</span> <span className="font-medium">{getCategoryLabel(selectedPost.category)}</span></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Views:</span> <span className="font-medium">{selectedPost.viewsCount}</span></div>
                    <div><span className="text-gray-500">Likes:</span> <span className="font-medium">{selectedPost.likesCount}</span></div>
                    <div><span className="text-gray-500">Published:</span> <span className="font-medium">
                      {selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : 'Not published'}
                    </span></div>
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              {selectedPost.excerpt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Excerpt</h4>
                  <p className="text-sm text-gray-600">{selectedPost.excerpt}</p>
                </div>
              )}

              {/* Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Content Preview</h4>
                <div
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content.substring(0, 500) + '...' }}
                />
              </div>

              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/blog/${selectedPost.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Public Page
                  </a>

                  <a
                    href={`/admin/blog/${selectedPost.id}/edit`}
                    className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Post
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
