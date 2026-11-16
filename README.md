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

| Category     | Links |
| ------------ | ----- |
| Stack        | [![Next.js](https://img.shields.io/badge/Next.js-475569?logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-475569?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-475569?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) |
| Repository   | [![Contributors](https://img.shields.io/github/contributors/wattnet/wattnet-dashboard?label=Contributors&color=1E293B&logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/graphs/contributors) [![Stars](https://img.shields.io/github/stars/wattnet/wattnet-dashboard?style=flat&label=Stars&color=1E293B&logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/stargazers) |
| Testing & CI | [![CI](https://img.shields.io/github/actions/workflow/status/wattnet/wattnet-dashboard/ci.yml?branch=main&label=CI&logo=githubactions&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/actions/workflows/ci.yml) [![ESLint](https://img.shields.io/badge/Lint-ESLint-0F766E?logo=eslint&logoColor=white&labelColor=1E293B)](https://eslint.org/) |
| Release      | [![Release](https://img.shields.io/github/v/release/wattnet/wattnet-dashboard?label=Release&color=3B5B8A&logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/releases) [![Publish](https://img.shields.io/github/actions/workflow/status/wattnet/wattnet-dashboard/publish.yml?label=Publish&logo=githubactions&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/actions/workflows/publish.yml) [![Release Please](https://img.shields.io/github/actions/workflow/status/wattnet/wattnet-dashboard/release-please.yml?branch=main&label=Release%20Please&logo=githubactions&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/actions/workflows/release-please.yml) |
| Package      | [![Docker Hub](https://img.shields.io/docker/v/wattnet/wattnet-dashboard?label=Docker%20Hub&sort=semver&color=9C5A32&logo=docker&logoColor=white&labelColor=1E293B)](https://hub.docker.com/r/wattnet/wattnet-dashboard) [![Image](https://img.shields.io/badge/Image-ghcr.io-9C5A32?logo=docker&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/pkgs/container/wattnet-dashboard) |
| Quality      | [![Status](https://img.shields.io/badge/Status-Production%2FStable-4A8118?labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/releases) |
| Community    | [![Contributing](https://img.shields.io/badge/Contributing-guidelines-5374A7?logo=github&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/blob/main/CONTRIBUTING.md) [![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-3.0-5374A7?logo=contributorcovenant&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/blob/main/CODE_OF_CONDUCT.md) [![Security](https://img.shields.io/badge/Security-policy-5374A7?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI%2BPHBhdGggZD0iTTcgMTBWN2E1IDUgMCAwIDEgMTAgMHYzaDFhMiAyIDAgMCAxIDIgMnY4YTIgMiAwIDAgMS0yIDJINmEyIDIgMCAwIDEtMi0ydi04YTIgMiAwIDAgMSAyLTJoMXptMiAwaDZWN2EzIDMgMCAxIDAtNiAwdjN6Ii8%2BPC9zdmc%2B&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/blob/main/SECURITY.md) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-5374A7?logo=conventionalcommits&logoColor=white&labelColor=1E293B)](https://www.conventionalcommits.org/) |
| License      | [![License](https://img.shields.io/github/license/wattnet/wattnet-dashboard?label=License&color=64748B&logo=opensourceinitiative&logoColor=white&labelColor=1E293B)](https://github.com/wattnet/wattnet-dashboard/blob/main/LICENSE) |

`wattnet-dashboard` is the web interface of the Wattnet platform, available at [dashboard.wattnet.eu](https://dashboard.wattnet.eu). It shows the carbon and water footprint of the electricity consumed in each European zone on an interactive map, together with the time series behind each value.

## Overview

The dashboard is a [Next.js](https://nextjs.org/) application written in TypeScript. It does not compute any metric itself: it asks the Wattnet API for them. There are two layers of requests, and it helps to keep them apart:

- **The page and the routes of the dashboard.** The browser asks the Next.js route handlers in `src/app/api`, which belong to the dashboard and are not the Wattnet API:

  | Route          | What it does                                                                                                                                                                                                                       |
  | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `/api/core`    | Gives the page a short-lived token. It is an HMAC of its expiry, signed with `DASHBOARD_TOKEN_SECRET` and valid for five seconds, so any replica can check the token that another one made                                              |
  | `/api/metrics` | Footprints, impacts and the environmental score. The parameter `metric` picks the endpoint of the Wattnet API, and the dimension is sent as `footprint_type` or `impact_type`                                                      |
  | `/api/imports` | The imports between zones that the flow arrows are drawn from                                                                                                                                                                      |

  The metrics and imports routes refuse a request without a valid token (`401`), and the page asks for a new token and tries again.

- **The server and the Wattnet API.** The routes call the API from the server. The requests are built in `src/shared/lib/api/endpoints.ts`, which takes the base URL from `API_URL` and sends only the query parameters that the API declares: the API refuses a parameter that is empty, repeated or unknown. The server gets its access token with the `client_credentials` grant, keeps it until it is near its end, asks for a new one if the API answers `401`, and never sends the credential to the browser. When the API fails, the route answers `502` and the page shows the error instead of an empty map.

## Features

- Interactive map of the European electricity zones, drawn with [MapLibre GL](https://maplibre.org/), in a light, a dark and a high-contrast theme.
- Footprint (carbon and water), impact (water) and environmental score of each zone, with the life-cycle or the operational scope.
- Time ranges with a slider and playback over the 15-minute slots of the selected days. A tag says whether the selected slot is live, historical, forecast or has no data. When the selected day is today, the page checks every quarter of an hour for new data and moves the slider to it if it is on the previous slot.
- A panel for each zone with the time series behind its value, and a layout for phones with a bottom sheet.
- Flow tracing: the value of a zone includes the electricity that it imports, and arrows between adjacent zones show the flows, drawn from the midpoint of their shared border, which `scripts/compute-zone-crossings.mjs` precomputes into `src/features/map/data/zoneCrossings.json`.
- The metric, the dimension, the scope, flow tracing and playback are kept in the URL, and a position and zoom (`lat`, `lng` and `zoom`) can be given in it, so a view can be shared.
- Texts managed with [i18next](https://www.i18next.com/), with English as the default and fallback language, and data loaded with [SWR](https://swr.vercel.app/) on an interface built with [MUI](https://mui.com/).

## Architecture

![Dashboard component diagram](https://github.com/wattnet/wattnet-software-architecture/blob/main/diagrams/png/structurizr-1-wattnet_dashboard.png?raw=true)

For the full software architecture see the [wattnet-software-architecture](https://github.com/wattnet/wattnet-software-architecture) repository.

## Requirements

- Node.js 22 or later (the CI tests 22 and 24, and the image runs on 24)
- [Yarn](https://yarnpkg.com/), which Corepack provides
- A reachable Wattnet API and a credential for it

## Installation

```bash
git clone https://github.com/wattnet/wattnet-dashboard.git
cd wattnet-dashboard
corepack enable
yarn install
```

## Configuration

The dashboard reads its settings from environment variables or from a `.env` file.

| Variable                 | Description                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL`                | Base URL of the Wattnet API that the dashboard queries                                                                                                   |
| `API_TOKEN_ENDPOINT`     | OAuth 2.0 token endpoint where the server asks for the access token of the API (the `client_credentials` grant)                                          |
| `API_CLIENT_ID`          | Client ID of the credential that the dashboard uses to call the API                                                                                      |
| `API_CLIENT_SECRET`      | Client secret of that credential. It never reaches the browser                                                                                           |
| `DASHBOARD_TOKEN_SECRET` | Secret that signs the short-lived tokens that the pages send to the routes of the dashboard. It is required in production and every replica must share it |

The credential of the dashboard asks for every zone, the forecast and the shares, so it has to belong to an account with a tier that allows it. In development `DASHBOARD_TOKEN_SECRET` can be left out: a fixed value for development is used.

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

`yarn dev` and `yarn build` first run `scripts/ensure-zone-crossings.mjs`, which prepares the zone crossings, and `scripts/copy-maplibre-worker.mjs`, which copies the worker of MapLibre GL into `public/maplibre-gl/` (MapLibre 6 cannot find it inside the bundle, and `MapContainer` points it there). `yarn crossings` computes the crossings again.

### With Docker

The images are multi-architecture (`linux/amd64` and `linux/arm64`) and are published to [Docker Hub](https://hub.docker.com/r/wattnet/wattnet-dashboard) and to GitHub Container Registry:

| Image | Made by | Tag |
| ----- | ------- | --- |
| `wattnet/wattnet-dashboard` | A release, when the pull request of Release Please is merged | The version (for example `1.7.0`), `<major>.<minor>`, `<major>` and `latest` |
| `ghcr.io/wattnet/wattnet-dashboard` | The same release | The same tags. The image is signed with cosign, and an SBOM is attached to the release |
| `ghcr.io/wattnet/wattnet-dashboard-snapshot` | The workflow **Snapshot**, run by hand from the Actions tab | The first 7 characters of the commit |

A snapshot is not a release: it makes no version, no tag and no GitHub Release, and it is only for trying a commit in a deployment. Its package is private, so a deployment pulls it with its own read credentials.

```bash
docker pull wattnet/wattnet-dashboard:<version>
docker run -p 3000:3000 \
  -e API_URL=<api-url> \
  -e API_TOKEN_ENDPOINT=<token-endpoint> \
  -e API_CLIENT_ID=<client-id> \
  -e API_CLIENT_SECRET=<client-secret> \
  -e DASHBOARD_TOKEN_SECRET=<random-secret> \
  wattnet/wattnet-dashboard:<version>
```

The image serves the dashboard on port 3000 and holds no secret: every setting of the [Configuration](#configuration) section is read when it runs, so the same image works in any environment. It runs as the user `10001` and works with a read only root filesystem, as long as `/app/.next/cache` is a writable volume. When it runs in more than one replica, all of them must have the same `DASHBOARD_TOKEN_SECRET`. The health check of the image asks `/api/core`, which fails when that secret is missing.

To build the image yourself, no build argument is needed:

```bash
docker build -t wattnet-dashboard .
```

## Development

Run the same checks as the CI before opening a pull request:

```bash
yarn lint
yarn tsc --noEmit
yarn build
```

The type check has no errors and the build fails on a type error. The lint has no errors: the rules of the React compiler of `eslint-plugin-react-hooks` are warnings for the code that already existed. See [CONTRIBUTING.md](CONTRIBUTING.md) for the rest of the process.

The CI (`ci.yml`) lints, type checks and builds with Node 22 and 24, audits the dependencies of the production build, and builds the image without pushing it. Releases are made by [Release Please](https://github.com/googleapis/release-please) from the commits, which follow [Conventional Commits](https://www.conventionalcommits.org/); publishing a release (`publish.yml`) builds and signs the image. The `Snapshot` workflow builds a private image of any commit, for a deployment that cannot wait for a release.

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
