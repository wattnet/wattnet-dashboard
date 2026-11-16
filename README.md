<div align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)"
            srcset="https://github.com/wattnet/.github/raw/main/images/wattnet-logo-full-dark-transparent-cropped.png" />
    <source media="(prefers-color-scheme: light)"
            srcset="https://github.com/wattnet/.github/raw/main/images/wattnet-logo-full-light-transparent-cropped.png" />
    <img src="https://github.com/wattnet/.github/raw/main/images/wattnet-logo-full-light-transparent-cropped.png"
         alt="Wattnet Logo"
         width="300" />
  </picture>
</div>

# Web Dashboard

| Category   | Links                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack      | [![Next.js](https://img.shields.io/badge/Next.js-475569?logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-475569?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-475569?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)                                                                                                                                                                                                                                                                                                                                                                                     |
| Repository | [![Contributors](https://img.shields.io/github/contributors/wattnet/wattnet-dashboard?label=Contributors&color=1E293B&logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/graphs/contributors) [![Stars](https://img.shields.io/github/stars/wattnet/wattnet-dashboard?style=flat&label=Stars&color=1E293B&logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/stargazers)                                                                                                                                                                                                                                                                                                        |
| Release    | [![Release](https://img.shields.io/github/v/release/wattnet/wattnet-dashboard?label=Release&color=3B5B8A&logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/releases) [![Publish](https://img.shields.io/github/actions/workflow/status/wattnet/wattnet-dashboard/ci.yaml?label=Publish&logo=githubactions&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/actions/workflows/ci.yaml) [![Release Please](https://img.shields.io/github/actions/workflow/status/wattnet/wattnet-dashboard/release-please.yml?branch=main&label=Release%20Please&logo=githubactions&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/actions/workflows/release-please.yml) |
| Package    | [![Docker Hub](https://img.shields.io/docker/v/wattnet/wattnet-dashboard?label=Docker%20Hub&sort=semver&color=9C5A32&logo=docker&logoColor=white&labelColor=1E293B)](https://hub.docker.com/r/wattnet/wattnet-dashboard)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| License    | [![License](https://img.shields.io/github/license/wattnet/wattnet-dashboard?label=License&color=64748B&logo=opensourceinitiative&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/blob/main/LICENSE)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

`wattnet-dashboard` is the web interface of the Wattnet platform. It shows the carbon and water footprint of the electricity consumed in each European zone on an interactive map, together with the time series behind each value.

## Overview

The dashboard is a [Next.js](https://nextjs.org/) application written in TypeScript. It does not compute any metric itself: it asks the Wattnet API for them. The requests are built in `src/shared/lib/api/endpoints.ts`, which takes the base URL of the API from the `API_URL` variable, and the Next.js route handlers in `src/app/api` serve the results to the interface.

## Features

- Interactive map of the European electricity zones, drawn with [MapLibre GL](https://maplibre.org/).
- Metrics and time ranges for each zone, with the interface built on [MUI](https://mui.com/) and the data loaded with [SWR](https://swr.vercel.app/).
- Flow arrows between adjacent zones, drawn from the midpoint of their shared border, which `scripts/compute-zone-crossings.mjs` precomputes into `src/features/map/data/zoneCrossings.json`.
- Texts managed with [i18next](https://www.i18next.com/), with English as the default and fallback language.

## Architecture

![Dashboard component diagram](https://github.com/wattnet/wattnet-software-architecture/blob/main/diagrams/png/structurizr-1-wattnet_dashboard.png?raw=true)

For the full software architecture see the [wattnet-software-architecture](https://github.com/wattnet/wattnet-software-architecture) repository.

## Requirements

- Node.js 20
- [Yarn](https://yarnpkg.com/), which Corepack provides
- A reachable Wattnet API

## Installation

```bash
git clone https://github.com/wattnet/wattnet-dashboard.git
cd wattnet-dashboard
corepack enable
yarn install
```

## Configuration

The dashboard reads its settings from environment variables or from a `.env` file.

| Variable  | Description                                            |
| --------- | ------------------------------------------------------ |
| `API_URL` | Base URL of the Wattnet API that the dashboard queries |

The Docker build also accepts `API_URL`, `DASHBOARD_API_KEY` and `NEXT_PUBLIC_DASHBOARD_API_KEY` as build arguments.

## Usage

Start the development server, which listens on [http://localhost:3000](http://localhost:3000):

```bash
yarn dev
```

Build and start the production server:

```bash
yarn build
yarn start
```

`yarn dev` and `yarn build` first run `scripts/ensure-zone-crossings.mjs`, which prepares the zone crossings. `yarn crossings` computes them again.

### With Docker

The images are published to [Docker Hub](https://hub.docker.com/r/wattnet/wattnet-dashboard), with one tag for each version.

```bash
docker pull wattnet/wattnet-dashboard:<version>
docker run -p 3000:3000 -e API_URL=<api-url> wattnet/wattnet-dashboard:<version>
```

The image serves the dashboard on port 3000, and the server reads `API_URL` when it runs. To build the image yourself, pass the same address as a build argument:

```bash
docker build --build-arg API_URL=<api-url> -t wattnet-dashboard .
```

## Development

Check the code with ESLint before opening a pull request:

```bash
yarn lint
```

## License

This repository is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

See the [LICENSE](LICENSE) file for more details.

## Funding and Acknowledgments

This work was developed within the [GreenDIGIT](https://greendigit-project.eu/) project, funded by the European Union's Horizon Europe research and innovation programme under grant agreement No. [101131207](https://cordis.europa.eu/project/id/101131207), and by the Swiss State Secretariat for Education, Research and Innovation (SERI).

<img src="https://github.com/wattnet/.github/raw/main/images/GreenDIGIT logo color horizontal2.png" alt="GreenDIGIT Logo" width="230" align="right"/>
<img src="https://github.com/wattnet/.github/raw/main/images/EN_FundedbytheEU_RGB_POS.png" alt="EU Funded Logo" width="260" align="left"/>
<img src="https://github.com/wattnet/.github/raw/main/images/Flag_of_Switzerland.svg" alt="Swiss State Secretariat for Education, Research and Innovation (SERI)" height="50" align="left"/>
<br clear="all"/>

##### © 2026 Spanish National Research Council (CSIC). All rights reserved.
