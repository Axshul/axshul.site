From the repository root:

```sh
python3 scripts/check-site.py
python3 scripts/check-site.py --json /tmp/axshul-site-check.json
```

The script resolves the repository from its own location and checks every public HTML route. Community snapshots, uploads and source photo folders are excluded. It validates local assets and links, fragment targets, JSON-LD, canonical URLs, robots metadata, unique IDs, the shared header, the main landmark and legal links. Em dash counts are compared with local Git HEAD when available. Each page's hash is included in the JSON report.

Navigation checks enforce the site's separate-page structure. Every primary header must link to About, Work, Journey, n8n, Guides and Blog at their real page URLs, with one Contact CTA to `/contact/`. Primary links cannot be homepage fragments. Root-relative links and fully qualified main-domain links are accepted, including the blog copy and 404 page. The native Pages directory must have a `details`/`summary` structure with its 17 routes covering Home, the six primary pages, Thoughts, Photos, five tools and three legal pages.

The checker also follows actual HTML links from the homepage. Every public route except `404.html` must be reachable through those links. This catches missing article links and routes that exist on disk but cannot be found through navigation. The JSON report includes route reachability and navigation-contract counts. Links created only after JavaScript runs do not establish this static navigation coverage.

Python uses only its standard library. If Node is available, `node --check` also checks inline and external JavaScript syntax. The script never executes app code or makes network requests. Exit code 0 means the enabled checks passed; code 1 means a check failed. JavaScript checks are reported as skipped when Node is unavailable.

These checks validate local source files. Browser behavior and production deployment require separate verification.
