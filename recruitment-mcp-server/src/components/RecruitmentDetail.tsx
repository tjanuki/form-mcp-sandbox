import React from 'react';

interface Recruitment {
  id: number;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  salary_range?: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  application_deadline?: string;
  status: string;
  applications_count?: number;
  created_at: string;
  published_at?: string;
}

interface RecruitmentDetailProps {
  recruitment: Recruitment;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  filled: 'bg-blue-100 text-blue-800',
};

export default function RecruitmentDetail(props: RecruitmentDetailProps) {
  const { recruitment } = props;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatList = (text: string) => {
    // Split by newlines or common list markers
    const items = text
      .split(/\n|•|\*/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return items;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {recruitment.title}
            </h1>
            <h2 className="text-2xl text-gray-700">{recruitment.company_name}</h2>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusColors[recruitment.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {recruitment.status.charAt(0).toUpperCase() + recruitment.status.slice(1)}
          </span>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <p className="text-gray-600 font-medium">Location</p>
            <p className="text-gray-900">{recruitment.location}</p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Employment Type</p>
            <p className="text-gray-900 capitalize">{recruitment.employment_type}</p>
          </div>
          {recruitment.salary_range && (
            <div>
              <p className="text-gray-600 font-medium">Salary Range</p>
              <p className="text-gray-900">{recruitment.salary_range}</p>
            </div>
          )}
          {recruitment.application_deadline && (
            <div>
              <p className="text-gray-600 font-medium">Application Deadline</p>
              <p className="text-gray-900">{formatDate(recruitment.application_deadline)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-600 font-medium">Applications Received</p>
            <p className="text-gray-900">{recruitment.applications_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Published On</p>
            <p className="text-gray-900">{formatDate(recruitment.published_at)}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h3>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {recruitment.description}
        </p>
      </div>

      {/* Responsibilities */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {formatList(recruitment.responsibilities).map((item, index) => (
            <li key={index} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {formatList(recruitment.requirements).map((item, index) => (
            <li key={index} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Benefits */}
      {recruitment.benefits && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {formatList(recruitment.benefits).map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Suggestions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-3">
          Available Actions
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Ask me to "edit this recruitment" to update details</p>
          <p>• Ask me to "view applications for recruitment #{recruitment.id}"</p>
          {recruitment.status === 'draft' && (
            <p>• Ask me to "publish recruitment #{recruitment.id}"</p>
          )}
          {recruitment.status === 'published' && (
            <p>• Ask me to "close recruitment #{recruitment.id}"</p>
          )}
          <p>• Ask me to "delete recruitment #{recruitment.id}"</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Created on {formatDate(recruitment.created_at)} • ID: {recruitment.id}
      </div>
    </div>
  );
}
