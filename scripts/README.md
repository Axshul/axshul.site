From the repository root:

```sh
python3 scripts/check-site.py
python3 scripts/check-site.py --json /tmp/axshul-site-check.json
```

The script resolves the repository from its own location and checks every public HTML route. Community snapshots, uploads and source photo folders are excluded. It validates local assets and links, fragment targets, JSON-LD, canonical URLs, robots metadata, unique IDs, the shared header, the main landmark and legal links. Em dash counts are compared with local Git HEAD when available. Each page's hash is included in the JSON report.

Python uses only its standard library. If Node is available, `node --check` also checks inline and external JavaScript syntax. The script never executes app code or makes network requests. Exit code 0 means the enabled checks passed; code 1 means a check failed. JavaScript checks are reported as skipped when Node is unavailable.

These checks validate local source files. Browser behavior and production deployment require separate verification.
