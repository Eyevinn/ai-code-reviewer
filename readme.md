<h1 align="center">
  AI Code Reviewer
</h1>

<div align="center">
  Let AI review your code as a first step to improve your code quality!
  <br />
  <br />
</div>

<div align="center">
<br />

[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/Eyevinn/ai-code-reviewer/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
[![made with heart by Eyevinn](https://img.shields.io/badge/made%20with%20%E2%99%A5%20by-Eyevinn-59cbe8.svg?style=flat-square)](https://github.com/Eyevinn)
[![Slack](https://slack.streamingtech.se/badge.svg)](https://slack.streamingtech.se)

</div>

## Requirements

- Node.js v24.0.0 or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key

### Eyevinn Open Source Cloud mode

If you want to run this project in a cloud environment you can run it as a service on [Eyevinn Open Source Cloud](https://www.osaas.io). All you need to do is to create a free account and try it out!

## Installation / Usage

```bash
% npm install
```

### Running the server

To start the server you can run the following command:

```bash
% OPENAI_API_KEY=your_api_key npm run dev
```

or

```bash
% OPENAI_API_KEY=your_api_key \
  npm start
```

The reviewer uses `gpt-5.4-mini` by default. You can select another Responses
API-compatible model with `OPENAI_MODEL`. Set `GITHUB_PAT` for private
repositories and to avoid GitHub's lower unauthenticated rate limits.

By default, each server process permits 10 reviews per client IP and hour, and
2 simultaneous reviews. Configure these limits with `REVIEW_RATE_LIMIT_MAX`
and `MAX_CONCURRENT_REVIEWS`. Cross-origin browser requests are limited to
`http://localhost:3000` and `http://127.0.0.1:3000`; set a comma-separated
`CORS_ORIGINS` value when the frontend is hosted on other origins.
The limiter is in-memory and therefore applies per server process. If the
service runs behind a trusted reverse proxy, set `TRUST_PROXY=true` so the
client IP is derived from forwarded headers; never enable it when clients can
reach the service directly.
These controls are not authentication. Put the service behind an authenticated
gateway when OpenAI spend must be restricted to known users.

### Review scope and data handling

The input must be an HTTPS URL on `github.com` pointing to one of:

- a repository, which resolves its default branch to an immutable commit;
- a repository `/tree/<ref>` URL, which resolves that ref to an immutable
  commit; or
- a `/pull/<number>` URL, which reviews the exact head/base diff.

Repository reviews include up to 20 prioritized text files. Pull request
reviews include up to 50 patches. Individual files are limited to 20,000
characters and the total context to 100,000 characters. The response reports
the exact commit, included files, truncation, and other limitations. Selected
source files or patches and repository metadata are sent to the configured
OpenAI API model; do not submit code that your OpenAI data policy does not
permit.

Frontend is available at http://localhost:8000/ and API docs at http://localhost:8000/api/docs

### Running the frontend

To run the frontend you can run the following command:

```bash
% npm run dev:app
```

When both the server and frontend are running, provide a supported GitHub
repository or pull request URL in the GUI. The review contains evidence-backed
file and line references for findings that can be proven from the supplied
context.

## Development

In the src folder you can find the code for the frontend and the server.

The api.ts file is the entry point for the server and contains the routes and the logic for the server.

In the directory /src/app you can find the code for the frontend.

### Contributing

See [CONTRIBUTING](CONTRIBUTING.md)

# Support

Join our [community on Slack](https://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

# About Eyevinn Technology

[Eyevinn Technology](https://www.eyevinntechnology.se) is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor. As our way to innovate and push the industry forward we develop proof-of-concepts and tools. The things we learn and the code we write we share with the industry in [blogs](https://dev.to/video) and by open sourcing the code we have written.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
