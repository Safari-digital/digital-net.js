<h1 align="center">
    <img width="256" src="./logo.png">
</h1>
<h2 align="center">
    TypeScript SDK for the Digital.Net API
</h2>

---

## Overview

`@digital-net-org/digital-api-sdk` is a vanilla TypeScript client that wraps the
[Digital.Net](https://github.com/digital-net-org/Digital.Net.Api) REST API. It
handles authentication (session cookie, API key, application key), request serialization, response
unwrapping (`Result<T>` convention), and exposes typed entity catalogs
(users, sessions, files, CMS, …).

It has no React dependency and works both in the browser and in Node.js.

## Getting Started

### Prerequisites

- **Node.js** 20+ (for server-side use) or a modern browser
- A running **Digital.Net API** (see
  [`@digital-net-org/digital-api-sdk`](../digital-api-sdk/README.md))
