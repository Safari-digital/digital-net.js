<h1 align="center">
    <img width="256" src="packages/digital-core/logo.png">
</h1>
<p align="center">
    Digital.Net JavaScript libraries — a pnpm workspace.
</p>

---

## Overview

`digital-net.js` is the JavaScript companion to the [Digital.Net](https://github.com/digital-net-org/Digital.Net.Api)
backend.

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+

### Clone

This library is only provided as a Git submodule.

```bash
git clone --recurse-submodules git@github.com:digital-net-org/digital-net.js.git
```

### Host tooling

This repository ships no root `package.json`: it is consumed as a submodule of a host pnpm workspace,
which provides the shared tooling. The host must declare the following `devDependencies`:

| Purpose  | Packages                                                                          | Reference versions            |
|----------|-----------------------------------------------------------------------------------|-------------------------------|
| Language | `typescript`                                                                      | 6.0.3                         |
| Build    | `vite`, `vite-plugin-dts`                                                         | 8.0.13, 5.0.0                 |
| Tests    | `vitest`, `happy-dom`                                                             | 4.1.6, 20.9.0                 |
| Lint     | `eslint`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` | 9.39.4, 8.59.3, 7.37.5, 7.1.1 |
| Format   | `prettier`, `@trivago/prettier-plugin-sort-imports`                               | 3.8.3, 6.0.2                  |
| React    | `@types/react`, `@types/react-dom`                                                | 19.2.14, 19.2.3               |

Notes:

- `@vue/compiler-sfc` is only required by hosts formatting `.vue` files with the shared Prettier config
  (`eslint/prettier.js`).
- Packages declare a `devDependency` themselves only when their own sources import it directly
  (e.g. `typescript` and `@types/node` in `digital-office`); everything else resolves from the host.
- Hosts (apps, vitest configs) must resolve workspace packages through their `source` export condition
  (`resolve.conditions: ['source', ...]`): `dist/` is never consumed during development.
