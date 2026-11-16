# Contributing to wattnet-dashboard

Thank you for your interest in contributing. This document covers how to set up your environment, the code standards we follow, and the process for submitting changes.

## Prerequisites

- Node.js 22 or later
- [Corepack](https://nodejs.org/api/corepack.html), which comes with Node.js and installs the version of Yarn that `package.json` asks for
- Git

## Getting Started

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/wattnet-dashboard.git
   cd wattnet-dashboard
   ```

2. Install the dependencies:

   ```bash
   corepack enable
   yarn install
   ```

3. Create a `.env` file with the settings that the dashboard needs. They are listed in the [README](README.md#configuration).

4. Start the development server, which listens on [http://localhost:3000](http://localhost:3000):

   ```bash
   yarn dev
   ```

## Checks

Before opening a pull request, run the same checks as the CI:

```bash
yarn lint
yarn tsc --noEmit
yarn build
```

The build checks the types again and generates the pages, so a route or a page that does not build is found there.

Key rules:
- The type check has no errors, and the build fails on a type error.
- The lint has no errors. The rules of the React compiler of `eslint-plugin-react-hooks` are warnings for the code that already existed: do not add new ones.
- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`). Releases are made from them.

## Submitting a Pull Request

1. Create a branch from `main` with a descriptive name:

   ```bash
   git checkout -b feat/my-new-feature
   ```

2. Make your changes, ensuring the checks above pass. If the change affects what is shown, look at it in the browser, on a desktop and on a phone.

3. Push your branch and open a PR against `main`. Fill in the PR template.

4. A maintainer will review your PR. Please address any requested changes promptly.

## Reporting Issues

Please use the GitHub issue templates for bug reports and feature requests. For security vulnerabilities, see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
