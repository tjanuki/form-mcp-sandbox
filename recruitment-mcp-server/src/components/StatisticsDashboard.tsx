import React from 'react';

interface Statistics {
  total_recruitments: number;
  by_status: {
    draft: number;
    published: number;
    closed: number;
    filled: number;
  };
  by_employment_type: Record<string, number>;
  recent_activity: Array<{
    recruitment_title: string;
    action: string;
    timestamp: string;
  }>;
  total_applications: number;
}

interface StatisticsDashboardProps extends Statistics {}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  published: 'bg-green-500',
  closed: 'bg-yellow-500',
  filled: 'bg-blue-500',
};

const employmentTypeColors: Record<string, string> = {
  'full-time': 'bg-purple-500',
  'part-time': 'bg-pink-500',
  'contract': 'bg-orange-500',
  'internship': 'bg-teal-500',
};

export default function StatisticsDashboard(props: StatisticsDashboardProps) {
  const {
    total_recruitments,
    by_status,
    by_employment_type,
    recent_activity,
    total_applications,
  } = props;

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Recruitment Statistics
        </h1>
        <p className="text-gray-600">Overview of your recruitment activities</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                Total Recruitments
              </p>
              <p className="text-4xl font-bold">{total_recruitments}</p>
            </div>
            <svg
              className="w-12 h-12 text-blue-200"
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
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">
                Published Jobs
              </p>
              <p className="text-4xl font-bold">{by_status.published}</p>
            </div>
            <svg
              className="w-12 h-12 text-green-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">
                Total Applications
              </p>
              <p className="text-4xl font-bold">{total_applications}</p>
            </div>
            <svg
              className="w-12 h-12 text-purple-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">By Status</h3>
          <div className="space-y-4">
            {Object.entries(by_status).map(([status, count]) => {
              const percentage = getPercentage(count, total_recruitments);
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        statusColors[status] || 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Employment Type Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            By Employment Type
          </h3>
          <div className="space-y-4">
            {Object.entries(by_employment_type).map(([type, count]) => {
              const percentage = getPercentage(count, total_recruitments);
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        employmentTypeColors[type] || 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        {recent_activity && recent_activity.length > 0 ? (
          <div className="space-y-4">
            {recent_activity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start border-l-4 border-blue-500 pl-4 py-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.recruitment_title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{activity.action}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No recent activity</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Draft</p>
          <p className="text-2xl font-bold text-gray-900">{by_status.draft}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-green-600 mb-1">Published</p>
          <p className="text-2xl font-bold text-green-900">
            {by_status.published}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-xs text-yellow-600 mb-1">Closed</p>
          <p className="text-2xl font-bold text-yellow-900">{by_status.closed}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-600 mb-1">Filled</p>
          <p className="text-2xl font-bold text-blue-900">{by_status.filled}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        💡 Tip: Ask me to filter recruitments by status or employment type to get
        more detailed insights
      </div>
    </div>
  );
}
