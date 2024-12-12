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

[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/eyevinn/{{repo-name}}/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
[![made with hearth by Eyevinn](https://img.shields.io/badge/made%20with%20%E2%99%A5%20by-Eyevinn-59cbe8.svg?style=flat-square)](https://github.com/eyevinn)
[![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

</div>

## Requirements

- Node.js v18.0.0 or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key

### Eyevinn Open Source Cloude mode

If you want to run this project in a cloud environment you can run it as a service on [Eyevinn Open Source Cloud](www.osaas.io). All you need to do is to create a free account and try it out!

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
  OPENAI_REVIEW_ASST=openai_asst_id \
  npm start
```

Frontend is available at http://localhost:8000/ and API docs at http://localhost:8000/api/docs

### Running the frontend

To run the frontend you can run the following command:

```bash
% npm run dev:app
```

When both the server and frontend is up and running you can provide a gitHub URL in the GUI and the AI will review the code and provide feedback.

## Development

In the src folder you can find the code for the frontend and the server.

The api.ts file is the entry point for the server and contains the routes and the logic for the server.

In the directory /src/app you can find the code for the frontend.

### Contributing

See [CONTRIBUTING](CONTRIBUTING.md)

# Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

# About Eyevinn Technology

[Eyevinn Technology](https://www.eyevinntechnology.se) is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor. As our way to innovate and push the industry forward we develop proof-of-concepts and tools. The things we learn and the code we write we share with the industry in [blogs](https://dev.to/video) and by open sourcing the code we have written.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
