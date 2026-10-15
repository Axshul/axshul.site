#!/usr/bin/env python3
"""Check the local static site's public routes without running app code."""

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urljoin, urlsplit


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://axshul.site"
LOCAL_HOSTS = {"axshul.site", "www.axshul.site"}
LEGAL_PATHS = {"/privacy/", "/cookies/", "/terms/"}
PRIMARY_ROUTES = {
    "About": "/about/", "Work": "/work/", "Journey": "/experience/",
    "n8n": "/n8n/", "Guides": "/n8n/guide/", "Blog": "/blog/",
}
DIRECTORY_ROUTES = {
    "/", *PRIMARY_ROUTES.values(), "/thoughts/", "/#moments",
    "/Galaxy/", "/Nexus/", "/Notes/", "/Seek/", "/Terminal/",
    *LEGAL_PATHS,
}
EXCLUDED_DIRS = {
    ".git", "node_modules", "uploads", "sourcephotos", "source-photos",
    "source_photos", "photo-source", "__pycache__",
}
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
ASSET_LINK_RELS = {
    "stylesheet", "preload", "icon", "shortcut", "apple-touch-icon", "manifest",
}


class PageParser(HTMLParser):
    """Keep tag positions so inline scripts can be checked as original text."""

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.nodes = []
        self.stack = []
        self.line_starts = [0] + [m.end() for m in re.finditer("\n", source)]
        self.feed(source)

    def source_offset(self):
        line, column = self.getpos()
        return self.line_starts[line - 1] + column

    def handle_starttag(self, tag, attrs):
        node = {
            "tag": tag, "attrs": dict(attrs), "start": self.source_offset(),
            "open_end": self.source_offset() + len(self.get_starttag_text()),
            "parents": [(p["tag"], p["attrs"]) for p in self.stack],
        }
        self.nodes.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1]["tag"] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                self.stack[index]["close_start"] = self.source_offset()
                self.stack = self.stack[:index]
                break

    def contents(self, node):
        return self.source[node["open_end"]:node.get("close_start", len(self.source))]


def public_html_files():
    result = []
    for path in ROOT.rglob("*.html"):
        parts = path.relative_to(ROOT).parts
        if any(part.lower() in EXCLUDED_DIRS for part in parts):
            continue
        result.append(path)
    return sorted(result)


def route(path):
    relative = path.relative_to(ROOT).as_posix()
    return "/" + (relative[:-10] if relative.endswith("index.html") else relative)


def local_target(reference, base):
    url = urlsplit(urljoin(base, reference))
    if url.scheme not in {"http", "https"} or url.hostname not in LOCAL_HOSTS:
        return None, url
    path = (ROOT / unquote(url.path.lstrip("/"))).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError("Reference resolves outside the site root")
    if url.path.endswith("/") or path.is_dir():
        path /= "index.html"
    return path, url


def css_urls(source):
    """Consume quoted URL tokens whole, including data SVGs with nested url()."""
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
    position = 0
    while match := re.search(r"url\s*\(", source[position:], flags=re.I):
        start = position + match.end()
        while start < len(source) and source[start].isspace():
            start += 1
        quote = source[start] if start < len(source) and source[start] in "\"'" else None
        cursor = start + bool(quote)
        value = []
        while cursor < len(source):
            character = source[cursor]
            if character == "\\" and cursor + 1 < len(source):
                value.append(source[cursor + 1])
                cursor += 2
                continue
            if character == (quote or ")"):
                break
            value.append(character)
            cursor += 1
        position = cursor + 1
        if quote:
            close = source.find(")", position)
            if close >= 0:
                position = close + 1
        reference = "".join(value).strip()
        if reference and not reference.startswith(("data:", "blob:", "#", "%23")):
            yield reference
    for match in re.finditer(r"@import\s+(['\"])(.*?)\1", source, flags=re.I):
        yield match.group(2)


def asset_references(node):
    attrs = node["attrs"]
    for key in ("src", "poster"):
        if attrs.get(key):
            yield attrs[key]
    if node["tag"] == "object" and attrs.get("data"):
        yield attrs["data"]
    if node["tag"] == "link" and ASSET_LINK_RELS.intersection(attrs.get("rel", "").split()):
        if attrs.get("href"):
            yield attrs["href"]
    for key in ("srcset", "imagesrcset"):
        value = attrs.get(key, "")
        if value and not value.startswith("data:"):
            for candidate in value.split(","):
                if candidate.strip():
                    yield candidate.strip().split()[0]
    yield from css_urls(attrs.get("style", ""))


def is_legal_region(node):
    return any(
        tag == "footer" or "foot" in attrs.get("class", "").split()
        or attrs.get("id") == "site-legal"
        for tag, attrs in node["parents"]
    )


def in_class(node, class_name, tag=None):
    return any(
        class_name in attrs.get("class", "").split() and (tag is None or parent_tag == tag)
        for parent_tag, attrs in node["parents"]
    )


def navigation_contract(page, base):
    """Check that the visible header reaches pages without needing JavaScript."""
    findings = []
    primary = [
        node for node in page.nodes if node["tag"] == "a"
        and in_class(node, "primary-nav", "nav") and in_class(node, "site-header", "header")
    ]

    def destination(node):
        href = node["attrs"].get("href", "")
        url = urlsplit(urljoin(base, href))
        if not href or url.scheme != "https" or url.hostname not in LOCAL_HOSTS or url.query:
            return None
        return url.path + ("#" + url.fragment if url.fragment else "")

    labels = [" ".join(html.unescape(re.sub(r"<[^>]*>", "", page.contents(n))).split()) for n in primary]
    actual_primary = dict(zip(labels, (destination(node) for node in primary)))
    if len(primary) != len(PRIMARY_ROUTES) or actual_primary != PRIMARY_ROUTES:
        findings.append(("primary_navigation", {
            "expected": PRIMARY_ROUTES,
            "actual": [{"label": label, "href": node["attrs"].get("href"), "destination": destination(node)} for label, node in zip(labels, primary)],
        }))
    hash_links = [node["attrs"].get("href") for node in primary if node["attrs"].get("href", "").startswith("#")]
    if hash_links:
        findings.append(("primary_navigation_hash_links", hash_links))
    contact = [
        node for node in page.nodes if node["tag"] == "a"
        and "contact-nav" in node["attrs"].get("class", "").split()
        and in_class(node, "site-header", "header")
    ]
    if len(contact) != 1 or destination(contact[0]) != "/contact/":
        findings.append(("contact_navigation", [node["attrs"].get("href") for node in contact]))
    details = [
        node for node in page.nodes if node["tag"] == "details"
        and "site-pages" in node["attrs"].get("class", "").split()
        and in_class(node, "site-header", "header")
    ]
    summaries = [node for node in page.nodes if node["tag"] == "summary" and in_class(node, "site-pages", "details")]
    panels = [
        node for node in page.nodes if node["tag"] == "nav"
        and "site-pages-panel" in node["attrs"].get("class", "").split()
        and in_class(node, "site-pages", "details")
    ]
    if len(details) != 1 or len(summaries) != 1 or len(panels) != 1 or (panels and "hidden" in panels[0]["attrs"]):
        findings.append(("native_pages_directory", {
            "details": len(details), "summaries": len(summaries), "panels": len(panels),
            "requirement": "One native details/summary directory with a visible-on-open nav panel",
        }))
    directory = [
        node for node in page.nodes if node["tag"] == "a"
        and in_class(node, "site-pages-panel", "nav") and in_class(node, "site-pages", "details")
    ]
    destinations = [destination(node) for node in directory]
    if len(directory) != len(DIRECTORY_ROUTES) or set(destinations) != DIRECTORY_ROUTES:
        findings.append(("pages_directory_routes", {
            "expected_count": len(DIRECTORY_ROUTES), "actual_count": len(directory),
            "missing": sorted(DIRECTORY_ROUTES - set(destinations)),
            "unexpected": sorted(str(value) for value in set(destinations) - DIRECTORY_ROUTES),
        }))
    return findings


def navigation_reachability(files, cache, excluded=None):
    """Follow real HTML anchors, excluding the error and compatibility pages."""
    public = set(files)
    graph = {path: set() for path in files}
    for path in files:
        for node in cache[path].nodes:
            if node["tag"] != "a" or not node["attrs"].get("href"):
                continue
            try:
                target, _ = local_target(node["attrs"]["href"], ORIGIN + route(path))
            except ValueError:
                continue  # The reference checker reports unsafe paths separately.
            if target in public:
                graph[path].add(target)
    home = ROOT / "index.html"
    reached = set()
    pending = [home] if home in public else []
    while pending:
        current = pending.pop()
        if current in reached:
            continue
        reached.add(current)
        pending.extend(graph[current] - reached)
    required = public - {ROOT / "404.html"} - set(excluded or ())
    return {
        "required_routes": len(required),
        "reachable_routes": len(required & reached),
        "unreachable": sorted(route(path) for path in required - reached),
        "html_link_edges": sum(len(targets) for targets in graph.values()),
    }


def original_em_dash_count(relative):
    if not shutil.which("git"):
        return None
    result = subprocess.run(
        ["git", "show", "HEAD:" + relative], cwd=ROOT,
        capture_output=True, text=True, encoding="utf-8",
    )
    return html.unescape(result.stdout).count("\u2014") if result.returncode == 0 else None


def check_javascript(node_binary, source=None, path=None, module=False):
    if not node_binary:
        return None
    if path is not None:
        result = subprocess.run([node_binary, "--check", str(path)], capture_output=True, text=True)
    else:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".mjs" if module else ".js", encoding="utf-8") as script:
            script.write(source)
            script.flush()
            result = subprocess.run([node_binary, "--check", script.name], capture_output=True, text=True)
    return result.stderr.strip() if result.returncode else ""


def audit():
    files = public_html_files()
    cache = {path: PageParser(path.read_text(encoding="utf-8")) for path in files}
    node_binary = shutil.which("node")
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": str(ROOT), "node_available": bool(node_binary),
        "scope": "Local static checks only; no app code, browser, network requests or deployment.",
        "summary": Counter({
            "public_routes": len(files), "local_asset_references": 0,
            "local_anchor_references": 0, "jsonld_blocks": 0,
            "inline_scripts_checked": 0, "external_scripts_checked": 0,
            "navigation_contracts_checked": 0, "reachable_routes": 0,
            "em_dash_original": 0, "em_dash_current": 0, "failures": 0,
        }), "issues": [], "pages": [],
    }

    def issue(path, check, detail):
        report["issues"].append({"path": str(path.relative_to(ROOT)), "check": check, "detail": detail})

    contract_path = ROOT / "scripts/published-routes.json"
    compatibility = set()
    try:
        contract = json.loads(contract_path.read_text(encoding="utf-8"))
        compatibility = set(contract["compatibility_pages"])
        required = contract["regular_pages"] + contract["compatibility_pages"]
        for relative in required:
            if not (ROOT / relative).is_file():
                issue(contract_path, "missing_published_page", relative)
        for relative in contract["retired_files"]:
            if (ROOT / relative).exists():
                issue(contract_path, "retired_file_restored", relative)
        report["summary"]["published_pages_required"] = len(required)
    except (OSError, ValueError, KeyError, TypeError) as error:
        issue(contract_path, "published_route_contract", str(error))

    def reference_check(path, reference, base, anchor=False):
        try:
            target, url = local_target(reference, base)
        except ValueError as error:
            issue(path, "reference", {"url": reference, "error": str(error)})
            return
        if target is None:
            return
        report["summary"]["local_anchor_references" if anchor else "local_asset_references"] += 1
        if not target.is_file():
            issue(path, "anchor" if anchor else "asset", {"url": reference, "missing": str(target.relative_to(ROOT))})
        elif anchor and url.fragment and target.suffix.lower() in {".html", ".svg"}:
            if target not in cache:
                cache[target] = PageParser(target.read_text(encoding="utf-8"))
            ids = {n["attrs"]["id"] for n in cache[target].nodes if "id" in n["attrs"]}
            if unquote(url.fragment) not in ids:
                issue(path, "fragment", {"url": reference, "missing_id": unquote(url.fragment)})

    for path in files:
        page = cache[path]
        relative = path.relative_to(ROOT).as_posix()
        base = ORIGIN + route(path)
        ids = Counter(n["attrs"]["id"] for n in page.nodes if "id" in n["attrs"])
        main_count = sum(n["tag"] == "main" for n in page.nodes)
        header_count = sum(n["tag"] == "header" and {"masthead", "wrap", "site-header"}.issubset(n["attrs"].get("class", "").split()) for n in page.nodes)
        canonicals = [n["attrs"].get("href") for n in page.nodes if n["tag"] == "link" and n["attrs"].get("rel") == "canonical"]
        noindex = any("noindex" in n["attrs"].get("content", "").lower() for n in page.nodes if n["tag"] == "meta" and n["attrs"].get("name", "").lower() in {"robots", "googlebot"})
        legal_links = set()
        schema_count = 0
        for check, detail in navigation_contract(page, base):
            issue(path, check, detail)
        report["summary"]["navigation_contracts_checked"] += 1
        for node in page.nodes:
            attrs = node["attrs"]
            if relative in compatibility:
                if node["tag"] == "script":
                    script_url = urlsplit(urljoin(base, attrs.get("src", "")))
                    if script_url.scheme != "https" or script_url.hostname not in LOCAL_HOSTS or script_url.path != "/assets/js/site.js":
                        issue(path, "unsafe_archive_script", "Only the owned shared site script is allowed")
                if node["tag"] in {"iframe", "form"} or any(key.startswith("data-preload") for key in attrs):
                    issue(path, "captured_archive_payload", "Compatibility pages must contain only static public content")
            for reference in asset_references(node):
                if relative in compatibility:
                    asset_url = urlsplit(urljoin(base, reference))
                    if asset_url.scheme in {"http", "https"} and asset_url.hostname not in LOCAL_HOSTS:
                        issue(path, "unsafe_archive_asset", "Compatibility pages may load only owned assets")
                reference_check(path, reference, base)
            if node["tag"] in {"a", "use"} and (attrs.get("href") or attrs.get("xlink:href")):
                href = attrs.get("href") or attrs["xlink:href"]
                reference_check(path, href, base, anchor=True)
                if node["tag"] == "a" and is_legal_region(node):
                    legal_links.add(urlsplit(urljoin(base, href)).path)
            if node["tag"] == "style":
                for reference in css_urls(page.contents(node)):
                    reference_check(path, reference, base)
            if node["tag"] != "script" or attrs.get("src"):
                continue
            kind = attrs.get("type", "").lower()
            source = page.contents(node)
            if kind in {"application/ld+json", "application/json", "importmap"}:
                try:
                    parsed = json.loads(source)
                    if not isinstance(parsed, (dict, list)):
                        raise ValueError("Expected a JSON object or array")
                except ValueError as error:
                    issue(path, "json", str(error))
                if kind == "application/ld+json":
                    schema_count += 1
            elif kind in {"", "module", "text/javascript", "application/javascript"}:
                error = check_javascript(node_binary, source=source, module=kind == "module")
                if error is not None:
                    report["summary"]["inline_scripts_checked"] += 1
                    if error:
                        issue(path, "inline_javascript", error)
        if main_count != 1 or ids["main"] != 1:
            issue(path, "main", {"elements": main_count, "main_ids": ids["main"]})
        if header_count != 1:
            issue(path, "common_header", header_count)
        duplicates = sorted(key for key, count in ids.items() if count > 1)
        if duplicates:
            issue(path, "duplicate_ids", duplicates)
        if relative != "404.html" and canonicals != [base]:
            issue(path, "canonical", {"expected": base, "actual": canonicals})
        if noindex != (relative == "404.html" or relative in compatibility):
            issue(path, "robots", "Only the error and declared compatibility pages must have noindex")
        if LEGAL_PATHS - legal_links:
            issue(path, "footer_legal_links", sorted(LEGAL_PATHS - legal_links))
        current_em = html.unescape(page.source).count("\u2014")
        original_em = original_em_dash_count(relative)
        if current_em > (original_em or 0):
            issue(path, "em_dashes_added", {"original": original_em, "current": current_em})
        report["summary"]["jsonld_blocks"] += schema_count
        report["summary"]["em_dash_current"] += current_em
        report["summary"]["em_dash_original"] += original_em or 0
        report["pages"].append({
            "path": relative, "route": route(path), "sha256": hashlib.sha256(page.source.encode()).hexdigest(),
            "main_count": main_count, "common_header_count": header_count, "canonical": canonicals,
            "noindex": noindex, "jsonld_blocks": schema_count, "em_dash_original": original_em,
            "em_dash_current": current_em,
        })
    for path in sorted((ROOT / "assets/css").rglob("*.css")):
        for reference in css_urls(path.read_text(encoding="utf-8")):
            reference_check(path, reference, ORIGIN + "/" + path.relative_to(ROOT).as_posix())
    for path in sorted((ROOT / "assets/js").rglob("*.js")):
        error = check_javascript(node_binary, path=path)
        if error is not None:
            report["summary"]["external_scripts_checked"] += 1
            if error:
                issue(path, "external_javascript", error)
    coverage = navigation_reachability(files, cache, {ROOT / relative for relative in compatibility})
    report["navigation_coverage"] = coverage
    report["summary"]["reachable_routes"] = coverage["reachable_routes"]
    if coverage["unreachable"]:
        issue(ROOT / "index.html", "unreachable_public_routes", coverage["unreachable"])
    sitemap_path = ROOT / "sitemap.xml"
    try:
        sitemap = ET.parse(sitemap_path).getroot()
        namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = [node.text for node in sitemap.findall("s:url/s:loc", namespace)]
        expected = {ORIGIN + page["route"] for page in report["pages"] if not page["noindex"]}
        if len(urls) != len(set(urls)) or set(urls) != expected:
            issue(sitemap_path, "sitemap_page_coverage", {
                "missing": sorted(expected - set(urls)),
                "unexpected": sorted(set(urls) - expected),
                "duplicates": [url for url, count in Counter(urls).items() if count > 1],
            })
        report["summary"]["sitemap_pages"] = len(urls)
    except (OSError, ET.ParseError) as error:
        issue(sitemap_path, "sitemap_xml", str(error))
    report["summary"]["failures"] = len(report["issues"])
    report["passed"] = not report["issues"]
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, metavar="PATH", help="Save the full report to this path, for example /tmp/site-check.json")
    args = parser.parse_args()
    report = audit()
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    summary = report["summary"]
    print(
        f"{'PASS' if report['passed'] else 'FAIL'}: {summary['public_routes']} routes, "
        f"{summary['local_asset_references']} local asset references, "
        f"{summary['local_anchor_references']} local links/fragments, {summary['jsonld_blocks']} JSON-LD blocks, "
        f"{summary['inline_scripts_checked']} inline and {summary['external_scripts_checked']} external scripts checked, "
        f"{summary['navigation_contracts_checked']} navigation contracts, {summary['reachable_routes']} routes reachable from home, "
        f"{summary['failures']} failures."
    )
    if not report["node_available"]:
        print("Node is unavailable: JavaScript syntax checks were skipped; all Python checks ran.")
    for finding in report["issues"]:
        print(f"  {finding['path']}: {finding['check']}: {finding['detail']}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
