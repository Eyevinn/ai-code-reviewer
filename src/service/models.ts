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
            last_commit_date: Type.Union([Type.String(), Type.Null()], {
              description: 'The date when the last commit was made.'
            }),
            stars: Type.Number({
              description: 'The number of stargazers the repository has.'
            }),
            forks: Type.Number({
              description: 'The number of forks of the repository.'
            }),
            contributors: Type.Union([Type.Number(), Type.Null()], {
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
                  description: 'The score achieved in code quality.',
                  minimum: 0,
                  maximum: 30
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
                  description: 'The score achieved in security assessment.',
                  minimum: 0,
                  maximum: 30
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
                  description: 'The score achieved for documentation quality.',
                  minimum: 0,
                  maximum: 10
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
                    'The score achieved for project structure and testing.',
                  minimum: 0,
                  maximum: 20
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
                    'The score achieved for version control and Git practices.',
                  minimum: 0,
                  maximum: 10
                }),
                feedback: Type.String({
                  description: 'Feedback regarding version control practices.'
                })
              },
              { additionalProperties: false }
            ),
            overall_score: Type.Number({
              description:
                'The overall score calculated based on all the score categories.',
              minimum: 0,
              maximum: 100
            })
          },
          { additionalProperties: false }
        ),
        scope: Type.Object(
          {
            target_kind: Type.Union([
              Type.Literal('repository'),
              Type.Literal('pull_request')
            ]),
            reference: Type.String({
              description: 'The exact commit SHA that was reviewed.'
            }),
            base_reference: Type.Union([Type.String(), Type.Null()], {
              description: 'The base commit SHA for a pull request.'
            }),
            files_reviewed: Type.Array(Type.String(), {
              description: 'The files included in the supplied review context.'
            }),
            truncated: Type.Boolean({
              description: 'Whether review context was omitted by a limit.'
            }),
            warnings: Type.Array(Type.String(), {
              description: 'Limitations that affect review completeness.'
            })
          },
          { additionalProperties: false }
        ),
        findings: Type.Array(
          Type.Object(
            {
              severity: Type.Union([
                Type.Literal('critical'),
                Type.Literal('high'),
                Type.Literal('medium'),
                Type.Literal('low'),
                Type.Literal('info')
              ]),
              title: Type.String(),
              file: Type.String({
                description: 'Exact path from the supplied review context.'
              }),
              start_line: Type.Integer({ minimum: 1 }),
              end_line: Type.Integer({ minimum: 1 }),
              evidence: Type.String({
                description: 'Concrete evidence visible in the supplied code.'
              }),
              impact: Type.String(),
              recommendation: Type.String()
            },
            { additionalProperties: false }
          ),
          {
            description:
              'Evidence-backed findings. Empty when the supplied context does not prove an issue.'
          }
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
