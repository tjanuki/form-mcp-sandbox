import React from 'react';

interface Recruitment {
  id: number;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  salary_range?: string;
  status: string;
  published_at?: string;
}

interface RecruitmentListProps {
  recruitments: Recruitment[];
  total: number;
  current_page: number;
  per_page: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  filled: 'bg-blue-100 text-blue-800',
};

const employmentTypeLabels: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'internship': 'Internship',
};

export default function RecruitmentList(props: RecruitmentListProps) {
  const { recruitments, total, current_page, per_page } = props;

  const handleViewDetails = (id: number) => {
    // Trigger ChatGPT to call get_recruitment_details
    window.openai?.setState?.({ selectedRecruitmentId: id });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recruitments</h1>
        <p className="text-gray-600 mt-2">
          Showing {recruitments.length} of {total} total recruitments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recruitments.map((recruitment) => (
          <div
            key={recruitment.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            onClick={() => handleViewDetails(recruitment.id)}
          >
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[recruitment.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {recruitment.status.charAt(0).toUpperCase() + recruitment.status.slice(1)}
              </span>
              <span className="text-xs text-gray-500">ID: {recruitment.id}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {recruitment.title}
            </h3>

            {/* Company */}
            <p className="text-gray-700 font-medium mb-4">
              {recruitment.company_name}
            </p>

            {/* Details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {recruitment.location}
              </div>

              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {employmentTypeLabels[recruitment.employment_type] || recruitment.employment_type}
              </div>

              {recruitment.salary_range && (
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {recruitment.salary_range}
                </div>
              )}

              {recruitment.published_at && (
                <div className="text-xs text-gray-500 mt-2">
                  Published: {formatDate(recruitment.published_at)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {recruitments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No recruitments found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filters or create a new recruitment
          </p>
        </div>
      )}

      {/* Pagination Info */}
      {total > per_page && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Page {current_page} of {Math.ceil(total / per_page)}
        </div>
      )}
    </div>
  );
}
