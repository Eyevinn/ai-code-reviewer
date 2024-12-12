import { Static, Type } from '@sinclair/typebox';

export const GithubRepositoryReviewSchema = Type.Record(
  Type.String(),
  Type.Any()
);

export type repositoryReviewResponse = Static<
  typeof GithubRepositoryReviewSchema
>;

export const ReviewSchema = Type.Object(
  {
    review: Type.Object(
      {
        metadata: Type.Object(
          {
            repository_name: Type.String({
              description: 'The name of the repository.'
            }),
            creator: Type.String({
              description: 'The creator of the repository.'
            }),
            last_commit_date: Type.String({
              description: 'The date when the last commit was made.'
            }),
            stars: Type.Number({
              description: 'The number of starsgazers the repository have.'
            }),
            forks: Type.Number({
              description: 'The number of forks of the repository.'
            }),
            contributors: Type.Number({
              description:
                'The number of people who have contributed to the repository.'
            })
          },
          { additionalProperties: false }
        ),
        scoring_criteria: Type.Object(
          {
            code_quality: Type.Object(
              {
                score: Type.Number({
                  description: 'The score achieved in code quality.'
                }),
                feedback: Type.String({
                  description: 'Feedback regarding code quality.'
                })
              },
              { additionalProperties: false }
            ),
            security: Type.Object(
              {
                score: Type.Number({
                  description: 'The score achieved in security assessment.'
                }),
                vulnerabilities: Type.Array(
                  Type.Object(
                    {
                      dependency: Type.String({
                        description: 'Name of the dependency.'
                      }),
                      version: Type.String({
                        description: 'Version of the dependency.'
                      }),
                      issue: Type.String({
                        description: 'Description of the issue in that version.'
                      })
                    },
                    { additionalProperties: false }
                  )
                ),
                feedback: Type.String({
                  description: 'Feedback regarding security practices.'
                })
              },
              { additionalProperties: false }
            ),
            documentation: Type.Object(
              {
                score: Type.Number({
                  description: 'The score achieved for documentation quality.'
                }),
                feedback: Type.String({
                  description: 'Feedback regarding documentation completeness.'
                })
              },
              { additionalProperties: false }
            ),
            project_structure_and_testing: Type.Object(
              {
                score: Type.Number({
                  description:
                    'The score achieved for project structure and testing.'
                }),
                feedback: Type.String({
                  description:
                    'Feedback regarding project structure and testing coverage.'
                })
              },
              { additionalProperties: false }
            ),
            version_control_and_git_practices: Type.Object(
              {
                score: Type.Number({
                  description:
                    'The score achieved for version control and Git practices.'
                }),
                feedback: Type.String({
                  description: 'Feedback regarding version control practices.'
                })
              },
              { additionalProperties: false }
            ),
            overall_score: Type.Number({
              description:
                'The overall score calculated based on all the score categories.'
            })
          },
          { additionalProperties: false }
        ),
        suggestions_for_improvement: Type.Array(Type.String(), {
          description:
            'List of actionable suggestions to improve the repository.'
        })
      },
      { additionalProperties: false }
    )
  },
  { additionalProperties: false }
);

export type ReviewResponse = Static<typeof ReviewSchema>;
