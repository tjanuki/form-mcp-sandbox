import React from 'react';

interface RecruitmentFormProps {
  action: 'created' | 'updated';
  recruitment: {
    id: number;
    title: string;
    company_name: string;
    status: string;
  };
}

export default function RecruitmentForm(props: RecruitmentFormProps) {
  const { action, recruitment } = props;

  const actionText = action === 'created' ? 'Created' : 'Updated';
  const actionColor = action === 'created' ? 'green' : 'blue';

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success Message */}
      <div
        className={`bg-${actionColor}-50 border-2 border-${actionColor}-200 rounded-lg p-8 mb-6`}
      >
        <div className="flex items-center mb-4">
          <svg
            className={`w-8 h-8 text-${actionColor}-600 mr-3`}
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
          <h2 className={`text-2xl font-bold text-${actionColor}-900`}>
            Recruitment {actionText} Successfully!
          </h2>
        </div>

        <div className="ml-11 space-y-2">
          <p className="text-gray-700">
            <span className="font-semibold">Title:</span> {recruitment.title}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Company:</span> {recruitment.company_name}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Status:</span>{' '}
            <span className="capitalize">{recruitment.status}</span>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">ID:</span> {recruitment.id}
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h3>

        <div className="space-y-3 text-sm">
          {action === 'created' && recruitment.status === 'draft' && (
            <>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">1.</span>
                <p className="text-gray-700">
                  Review the recruitment details by asking me to "show recruitment #{recruitment.id}"
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">2.</span>
                <p className="text-gray-700">
                  Make any necessary updates by saying "edit recruitment #{recruitment.id}"
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">3.</span>
                <p className="text-gray-700">
                  When ready, publish it by saying "publish recruitment #{recruitment.id}"
                </p>
              </div>
            </>
          )}

          {action === 'created' && recruitment.status === 'published' && (
            <>
              <div className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <p className="text-gray-700">
                  The recruitment is now live and accepting applications!
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">→</span>
                <p className="text-gray-700">
                  View details anytime by asking "show recruitment #{recruitment.id}"
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">→</span>
                <p className="text-gray-700">
                  Monitor applications by saying "show applications for recruitment #{recruitment.id}"
                </p>
              </div>
            </>
          )}

          {action === 'updated' && (
            <>
              <div className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <p className="text-gray-700">
                  Your changes have been saved successfully.
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">→</span>
                <p className="text-gray-700">
                  View the updated details by saying "show recruitment #{recruitment.id}"
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">→</span>
                <p className="text-gray-700">
                  View all recruitments by saying "show all published recruitments"
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Quick Actions You Can Try:
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• "Show me all recruitments"</p>
          <p>• "Create another recruitment"</p>
          <p>• "Show recruitment statistics"</p>
          <p>• "List all published jobs"</p>
        </div>
      </div>
    </div>
  );
}
