# Third-Party Renderer Licence Audit

| Dependency | Repository/version | Licence | Distribution/network implications | Status |
|---|---|---|---|---|
| Stellarium Web Engine | Not installed / no commit pinned | Commonly distributed under AGPL-family terms; verify exact chosen release | Network deployment and bundling may create corresponding-source obligations. Assets/catalogues may have separate licences. Commercial availability must be confirmed directly with Stellarium. | **UNRESOLVED — BLOCKED** |
| Internal 2D ecliptic instrument | Repository source | Project licence applies | No third-party star catalogue or WASM included. | Allowed for development |

## Gate
`NEXT_PUBLIC_OBSERVATORY_RENDERER` supports `stellarium`, `internal`, and `disabled`. Production must remain `internal` or `disabled` until legal approval records: exact repository/commit, engine licence, asset/catalogue licences, AGPL/network-use analysis, source disclosure plan, and commercial licence decision.
