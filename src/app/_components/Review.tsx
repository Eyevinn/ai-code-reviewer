import { ReviewResponse } from '@/service/models';
import { Card, CardBody, CardHeader } from '@heroui/react';

type ReviewProps = {
  review: ReviewResponse | undefined;
  error: string;
};

const displayValue = (value: string | number | null) => value ?? 'Unknown';

export default function Review({ review, error }: ReviewProps) {
  return (
    <section>
      {!error ? (
        <Card className="max-w-[45rem] grow bg-stone-800 my-4 p-4 border border-zinc-600">
          <CardHeader className="flex flex-col justify-start items-start">
            <h2 className="text-2xl">Review of the Repository</h2>
            <p className="text-sm italic">
              Findings are limited to the files and revision listed below.
            </p>
          </CardHeader>
          <CardBody>
            {review && (
              <div>
                <h3 className="text-xl mb-2">Repository Metadata</h3>
                <ul>
                  <li>Title: {review.review.metadata.repository_name}</li>
                  <li>Creator: {review.review.metadata.creator}</li>
                  <li>
                    Last Commit Date:{' '}
                    {displayValue(review.review.metadata.last_commit_date)}
                  </li>
                  <li>
                    Stars:{' '}
                    <span className="text-sky-500">
                      {review.review.metadata.stars}
                    </span>
                  </li>
                  <li>
                    Forks:{' '}
                    <span className="text-sky-500">
                      {review.review.metadata.forks}
                    </span>
                  </li>
                  <li>
                    Contributors:{' '}
                    <span className="text-sky-500">
                      {displayValue(review.review.metadata.contributors)}
                    </span>
                  </li>
                </ul>
                <h3 className="text-xl my-2">Review Scope</h3>
                <ul>
                  <li>Target: {review.review.scope.target_kind}</li>
                  <li className="break-all">
                    Revision: {review.review.scope.reference}
                  </li>
                  <li>
                    Files reviewed: {review.review.scope.files_reviewed.length}
                  </li>
                  <li>
                    Complete context:{' '}
                    {review.review.scope.truncated ? 'No' : 'Yes'}
                  </li>
                </ul>
                {review.review.scope.warnings.map((warning) => (
                  <p className="text-sm text-amber-400 mt-1" key={warning}>
                    {warning}
                  </p>
                ))}
                <h3 className="text-xl my-2">Scoring Criteria</h3>
                <ul>
                  <li>
                    Code Quality:{' '}
                    <span className="text-sky-500">
                      {review.review.scoring_criteria.code_quality.score}
                    </span>
                  </li>
                  <li>
                    Security:{' '}
                    <span className="text-sky-500">
                      {review.review.scoring_criteria.security.score}
                    </span>
                  </li>
                  <li>
                    Documentation:{' '}
                    <span className="text-sky-500">
                      {review.review.scoring_criteria.documentation.score}
                    </span>
                  </li>
                  <li>
                    Project Structure and Testing:{' '}
                    <span className="text-sky-500">
                      {
                        review.review.scoring_criteria
                          .project_structure_and_testing.score
                      }
                    </span>
                  </li>
                  <li>
                    Version Control and Git Practices:{' '}
                    <span className="text-sky-500">
                      {
                        review.review.scoring_criteria
                          .version_control_and_git_practices.score
                      }
                    </span>
                  </li>
                  <li>
                    Overall Score:{' '}
                    <span className="text-sky-500">
                      {review.review.scoring_criteria.overall_score}
                    </span>
                    /100
                  </li>
                </ul>
                <h3 className="text-xl my-2">Feedback</h3>
                <h4 className="text-lg my-2">Code Quality</h4>
                <p className="text-sm">
                  {review.review.scoring_criteria.code_quality.feedback}
                </p>
                <h4 className="text-lg my-2">Security</h4>
                <p className="text-sm">
                  {review.review.scoring_criteria.security.feedback}
                </p>
                <ul className="flex flex-col gap-2">
                  {review.review.scoring_criteria.security.vulnerabilities.map(
                    (v) => (
                      <li
                        className="text-sm list-inside list-disc"
                        key={`${v.dependency}-${v.version}-${v.issue}`}
                      >
                        {v.dependency} - {v.version} - {v.issue}
                      </li>
                    )
                  )}
                </ul>
                <h4 className="text-lg my-2">Documentation</h4>
                <p className="text-sm">
                  {review.review.scoring_criteria.documentation.feedback}
                </p>
                <h4 className="text-lg my-2">Project Structure and Testing</h4>
                <p className="text-sm">
                  {
                    review.review.scoring_criteria.project_structure_and_testing
                      .feedback
                  }
                </p>
                <h4 className="text-lg my-2">
                  Version Control and Git Practices
                </h4>
                <p className="text-sm">
                  {
                    review.review.scoring_criteria
                      .version_control_and_git_practices.feedback
                  }
                </p>

                <h3 className="text-xl my-2">Evidence-backed Findings</h3>
                {review.review.findings.length === 0 ? (
                  <p className="text-sm">
                    No proven issues in the supplied context.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {review.review.findings.map((finding) => (
                      <li
                        className="text-sm border border-zinc-600 rounded p-3"
                        key={`${finding.file}-${finding.start_line}-${finding.title}`}
                      >
                        <p className="font-semibold">
                          [{finding.severity.toUpperCase()}] {finding.title}
                        </p>
                        <p className="break-all">
                          {finding.file}:{finding.start_line}
                          {finding.end_line !== finding.start_line
                            ? `-${finding.end_line}`
                            : ''}
                        </p>
                        <p>Evidence: {finding.evidence}</p>
                        <p>Impact: {finding.impact}</p>
                        <p>Recommendation: {finding.recommendation}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="text-xl my-2">Suggestions for Improvement</h3>
                <ul>
                  {review.review.suggestions_for_improvement.map(
                    (suggestion, index) => (
                      <li
                        className="text-sm list-disc list-inside list-item"
                        key={index}
                      >
                        {suggestion}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="max-w-[45rem] grow bg-stone-800 my-4 p-4 border border-zinc-600">
          <CardHeader>
            <h2 className="text-2xl">Wopsie, something whent wrong!</h2>
          </CardHeader>
          <CardBody>
            <p className="text-red-500 italic">{error}</p>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
