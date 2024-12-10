import { Static, Type } from '@sinclair/typebox';

export const GithubRepositoryReviewSchema = Type.Record(
  Type.String(),
  Type.Any()
);

export type repositoryReviewResponse = Static<
  typeof GithubRepositoryReviewSchema
>;

export const reviewSchema = Type.Object({
  review: Type.Object({
    metadata: Type.Object({
      repository_name: Type.String(),
      creator: Type.String(),
      last_commit_date: Type.String({ format: 'date-time' }),
      stars: Type.Integer(),
      forks: Type.Integer(),
      contributors: Type.Integer()
    }),
    scoring_criteria: Type.Object({
      code_quality: Type.Object({
        score: Type.Integer(),
        feedback: Type.String()
      }),
      security: Type.Object({
        score: Type.Integer(),
        vulnerabilities: Type.Array(
          Type.Object({
            dependency: Type.String(),
            version: Type.String(),
            issue: Type.String()
          })
        ),
        feedback: Type.String()
      }),
      documentation: Type.Object({
        score: Type.Integer(),
        feedback: Type.String()
      }),
      project_structure_and_testing: Type.Object({
        score: Type.Integer(),
        feedback: Type.String()
      }),
      version_control_and_git_practices: Type.Object({
        score: Type.Integer(),
        feedback: Type.String()
      }),
      overall_score: Type.Integer()
    }),
    suggestions_for_improvement: Type.Array(Type.String())
  })
});

export type ReviewResponse = Static<typeof reviewSchema>;
