#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import date, datetime, time as dtime, timedelta, timezone
from pathlib import Path
from typing import Any


IST = timezone(timedelta(hours=5, minutes=30))
DEFAULT_ORG = "hushh-labs"
DEFAULT_USERS = (
    "Kushal Trivedi:kushaltrivedi5",
    "Ankit Kumar Singh:ankitkumarsingh1702",
    "Akshat Kumar:RGlodAkshat",
)
BASE_URL = "https://api.github.com"


@dataclass(frozen=True)
class Person:
    key: str
    name: str
    login: str


def run(cmd: list[str]) -> str:
    try:
        return subprocess.check_output(cmd, text=True).strip()
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"Command failed: {' '.join(cmd)}\n{exc.output}") from exc


def parse_person(raw: str) -> Person:
    if ":" not in raw:
        raise SystemExit(f"Invalid --users value {raw!r}; expected 'Name:login'.")
    name, login = raw.split(":", 1)
    name = name.strip()
    login = login.strip()
    if not name or not login:
        raise SystemExit(f"Invalid --users value {raw!r}; expected non-empty name and login.")
    return Person(key=login.lower().replace("-", "_"), name=name, login=login)


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(IST)


def daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def safe_int(value: Any) -> int:
    return int(value or 0)


class GitHubClient:
    def __init__(self, token: str) -> None:
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "hushh-github-ops-report",
        }
        self.commit_headers = dict(self.headers)

    def request_json(
        self,
        url: str,
        *,
        method: str = "GET",
        data: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        retries: int = 4,
    ) -> Any:
        request_headers = headers or self.headers
        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")
            request_headers = dict(request_headers)
            request_headers["Content-Type"] = "application/json"

        last_error: Exception | None = None
        for attempt in range(retries):
            req = urllib.request.Request(url, data=body, method=method, headers=request_headers)
            try:
                with urllib.request.urlopen(req, timeout=45) as response:
                    raw = response.read().decode("utf-8")
                    return json.loads(raw) if raw else None
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")
                last_error = RuntimeError(f"GitHub API {exc.code} for {url}: {detail[:500]}")
                if exc.code in {403, 429, 502, 503, 504} and attempt < retries - 1:
                    time.sleep(2 + attempt * 3)
                    continue
                raise last_error
            except Exception as exc:  # network flake
                last_error = exc
                if attempt < retries - 1:
                    time.sleep(2 + attempt * 2)
                    continue
        raise RuntimeError(str(last_error))

    def get(self, path: str, params: dict[str, Any] | None = None, *, commit_api: bool = False) -> Any:
        url = path if path.startswith("http") else BASE_URL + path
        if params:
            url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
        headers = self.commit_headers if commit_api else self.headers
        return self.request_json(url, headers=headers)

    def paged(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        max_pages: int = 10,
        commit_api: bool = False,
    ) -> list[dict[str, Any]]:
        params = dict(params or {})
        params.setdefault("per_page", 100)
        results: list[dict[str, Any]] = []
        for page in range(1, max_pages + 1):
            params["page"] = page
            data = self.get(path, params, commit_api=commit_api)
            if isinstance(data, dict) and "items" in data:
                items = data.get("items") or []
            elif isinstance(data, list):
                items = data
            else:
                break
            results.extend(items)
            if len(items) < params["per_page"]:
                break
        return results

    def graphql(self, query: str, variables: dict[str, Any]) -> Any:
        payload = {"query": query, "variables": variables}
        data = self.request_json(BASE_URL + "/graphql", method="POST", data=payload)
        if data.get("errors"):
            raise RuntimeError(json.dumps(data["errors"], indent=2))
        return data["data"]


def org_id(client: GitHubClient, org: str) -> str:
    query = "query($login:String!){ organization(login:$login){ id } }"
    data = client.graphql(query, {"login": org})
    organization = data.get("organization")
    if not organization:
        raise SystemExit(f"GitHub organization not found or not visible: {org}")
    return organization["id"]


def repo_from_issue_item(item: dict[str, Any]) -> str:
    raw = item.get("repository_url") or ""
    return raw.split("/repos/", 1)[1] if "/repos/" in raw else ""


def in_window(value: datetime | None, start: date, end: date) -> bool:
    return bool(value and start <= value.date() <= end)


CONTRIB_QUERY = """
query($login:String!,$orgId:ID!,$from:DateTime!,$to:DateTime!){
  user(login:$login){
    login
    name
    contributionsCollection(organizationID:$orgId, from:$from, to:$to){
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount weekday } }
      }
    }
  }
}
"""


def fetch_contribution_calendar(
    client: GitHubClient,
    org_graphql_id: str,
    login: str,
    start: date,
    end: date,
) -> dict[str, Any]:
    variables = {
        "login": login,
        "orgId": org_graphql_id,
        "from": datetime.combine(start, dtime.min, IST).isoformat(),
        "to": datetime.combine(end, dtime(23, 59, 59), IST).isoformat(),
    }
    data = client.graphql(CONTRIB_QUERY, variables)
    user = data.get("user")
    if not user:
        raise SystemExit(f"GitHub user not found or not visible: {login}")
    collection = user["contributionsCollection"]
    days: list[dict[str, Any]] = []
    for week in collection["contributionCalendar"]["weeks"]:
        for day in week["contributionDays"]:
            current = date.fromisoformat(day["date"])
            if start <= current <= end:
                days.append(
                    {
                        "date": day["date"],
                        "count": safe_int(day["contributionCount"]),
                        "weekday": safe_int(day["weekday"]),
                    }
                )
    return {
        "github_total_contributions": safe_int(collection["contributionCalendar"]["totalContributions"]),
        "github_commit_contributions": safe_int(collection["totalCommitContributions"]),
        "github_issue_contributions": safe_int(collection["totalIssueContributions"]),
        "github_pr_contributions": safe_int(collection["totalPullRequestContributions"]),
        "github_review_contributions": safe_int(collection["totalPullRequestReviewContributions"]),
        "restricted_contributions": safe_int(collection["restrictedContributionsCount"]),
        "daily": days,
    }


def fetch_commit_detail(
    client: GitHubClient,
    item: dict[str, Any],
    start: date,
    end: date,
) -> dict[str, Any] | None:
    repo = item.get("repository", {}).get("full_name") or ""
    sha = item.get("sha") or ""
    detail = client.get(item["url"], commit_api=True)
    commit = detail.get("commit", {})
    author_dt = parse_dt(commit.get("author", {}).get("date") or item.get("commit", {}).get("author", {}).get("date"))
    committer_dt = parse_dt(commit.get("committer", {}).get("date") or item.get("commit", {}).get("committer", {}).get("date"))
    effective_dt = author_dt or committer_dt
    if not in_window(effective_dt, start, end):
        return None
    message = (commit.get("message") or "").split("\n")[0].strip()
    parents = detail.get("parents") or []
    is_merge = len(parents) > 1 or message.startswith("Merge pull request")
    stats = detail.get("stats") or {}
    files = detail.get("files") or []
    return {
        "repo": repo,
        "sha": sha,
        "short_sha": sha[:7],
        "date": effective_dt.date().isoformat() if effective_dt else None,
        "datetime": effective_dt.isoformat() if effective_dt else None,
        "message": message,
        "url": detail.get("html_url") or item.get("html_url"),
        "parents": len(parents),
        "is_merge": is_merge,
        "additions": safe_int(stats.get("additions")),
        "deletions": safe_int(stats.get("deletions")),
        "total": safe_int(stats.get("total")),
        "changed_files": len(files),
    }


def search_commits(
    client: GitHubClient,
    org: str,
    login: str,
    start: date,
    end: date,
    workers: int,
) -> list[dict[str, Any]]:
    query = f"org:{org} author:{login} committer-date:>={start.isoformat()}"
    raw = client.paged(
        "/search/commits",
        {"q": query, "sort": "committer-date", "order": "desc"},
        max_pages=10,
        commit_api=True,
    )
    unique = []
    seen: set[tuple[str, str]] = set()
    for item in raw:
        repo = item.get("repository", {}).get("full_name") or ""
        sha = item.get("sha") or ""
        key = (repo, sha)
        if repo and sha and key not in seen:
            unique.append(item)
            seen.add(key)

    commits: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(fetch_commit_detail, client, item, start, end) for item in unique]
        for future in as_completed(futures):
            entry = future.result()
            if entry:
                commits.append(entry)
    return sorted(commits, key=lambda item: item.get("datetime") or "", reverse=True)


def search_pr_keys(client: GitHubClient, org: str, login: str, start: date) -> dict[tuple[str, int], dict[str, Any]]:
    queries = [
        f"org:{org} is:pr author:{login} created:>={start.isoformat()}",
        f"org:{org} is:pr author:{login} merged:>={start.isoformat()}",
        f"org:{org} is:pr author:{login} updated:>={start.isoformat()}",
    ]
    keys: dict[tuple[str, int], dict[str, Any]] = {}
    for query in queries:
        for item in client.paged("/search/issues", {"q": query, "sort": "updated", "order": "desc"}, max_pages=10):
            repo = repo_from_issue_item(item)
            number = item.get("number")
            if repo and number:
                keys[(repo, int(number))] = item
    return keys


def fetch_pr_detail(
    client: GitHubClient,
    repo: str,
    number: int,
    item: dict[str, Any],
    start: date,
    end: date,
) -> dict[str, Any] | None:
    detail = client.get(f"/repos/{repo}/pulls/{number}")
    created = parse_dt(detail.get("created_at"))
    updated = parse_dt(detail.get("updated_at"))
    merged = parse_dt(detail.get("merged_at"))
    closed = parse_dt(detail.get("closed_at"))
    if not any(in_window(value, start, end) for value in (created, updated, merged, closed)):
        return None
    return {
        "repo": repo,
        "number": number,
        "title": detail.get("title") or item.get("title") or "",
        "state": detail.get("state"),
        "draft": bool(detail.get("draft")),
        "url": detail.get("html_url"),
        "created_date": created.date().isoformat() if created else None,
        "updated_date": updated.date().isoformat() if updated else None,
        "merged_date": merged.date().isoformat() if merged else None,
        "closed_date": closed.date().isoformat() if closed else None,
        "additions": safe_int(detail.get("additions")),
        "deletions": safe_int(detail.get("deletions")),
        "changed_files": safe_int(detail.get("changed_files")),
        "commits": safe_int(detail.get("commits")),
    }


def fetch_prs(
    client: GitHubClient,
    org: str,
    login: str,
    start: date,
    end: date,
    workers: int,
) -> list[dict[str, Any]]:
    keys = search_pr_keys(client, org, login, start)
    prs: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [
            pool.submit(fetch_pr_detail, client, repo, number, item, start, end)
            for (repo, number), item in keys.items()
        ]
        for future in as_completed(futures):
            entry = future.result()
            if entry:
                prs.append(entry)
    return sorted(prs, key=lambda item: item.get("updated_date") or item.get("created_date") or "", reverse=True)


def fetch_issues(client: GitHubClient, org: str, login: str, start: date, end: date) -> list[dict[str, Any]]:
    query = f"org:{org} is:issue -is:pr author:{login} created:>={start.isoformat()}"
    issues = []
    for item in client.paged("/search/issues", {"q": query, "sort": "created", "order": "desc"}, max_pages=5):
        created = parse_dt(item.get("created_at"))
        if in_window(created, start, end):
            issues.append(
                {
                    "repo": repo_from_issue_item(item),
                    "number": item.get("number"),
                    "title": item.get("title") or "",
                    "state": item.get("state"),
                    "url": item.get("html_url"),
                    "created_date": created.date().isoformat() if created else None,
                }
            )
    return issues


def empty_code_day() -> dict[str, int]:
    return {
        "commits": 0,
        "commit_lines": 0,
        "commit_additions": 0,
        "commit_deletions": 0,
        "prs_created": 0,
        "prs_merged": 0,
        "issues": 0,
    }


def daily_code_activity(user_data: dict[str, Any], start: date, end: date) -> dict[str, dict[str, int]]:
    daily = {day.isoformat(): empty_code_day() for day in daterange(start, end)}
    for commit in user_data["commits"]:
        commit_date = commit.get("date")
        if not commit_date or commit.get("is_merge") or commit_date not in daily:
            continue
        daily[commit_date]["commits"] += 1
        daily[commit_date]["commit_lines"] += commit["additions"] + commit["deletions"]
        daily[commit_date]["commit_additions"] += commit["additions"]
        daily[commit_date]["commit_deletions"] += commit["deletions"]

    for pr in user_data["prs"]:
        # A PR counts as code contribution only when it carries a code diff.
        if pr["additions"] + pr["deletions"] <= 0:
            continue
        for key, field in (("created_date", "prs_created"), ("merged_date", "prs_merged")):
            value = pr.get(key)
            if value in daily:
                daily[value][field] += 1

    for issue in user_data["issues"]:
        created = issue.get("created_date")
        if created in daily:
            daily[created]["issues"] += 1

    for entry in daily.values():
        entry["code_events"] = entry["commits"] + entry["prs_created"] + entry["prs_merged"]
    return daily


def compact_day_summary(entry: dict[str, int]) -> str:
    parts = []
    if entry["commits"]:
        parts.append(f"{entry['commits']} commit{'s' if entry['commits'] != 1 else ''}")
    if entry["prs_created"]:
        parts.append(f"{entry['prs_created']} PR{'s' if entry['prs_created'] != 1 else ''} raised")
    if entry["prs_merged"]:
        parts.append(f"{entry['prs_merged']} PR{'s' if entry['prs_merged'] != 1 else ''} merged")
    if entry["commit_lines"]:
        parts.append(f"{entry['commit_lines']} lines")
    return ", ".join(parts) if parts else "no code"


def summarize_window(user_data: dict[str, Any], start: date, end: date) -> dict[str, Any]:
    start_s = start.isoformat()
    end_s = end.isoformat()
    commits = [c for c in user_data["commits"] if c.get("date") and start_s <= c["date"] <= end_s]
    non_merge = [c for c in commits if not c["is_merge"]]
    merge = [c for c in commits if c["is_merge"]]
    prs = [
        pr
        for pr in user_data["prs"]
        if any(pr.get(key) and start_s <= pr[key] <= end_s for key in ("created_date", "updated_date", "merged_date", "closed_date"))
    ]
    pr_created = [pr for pr in prs if pr.get("created_date") and start_s <= pr["created_date"] <= end_s]
    pr_merged = [pr for pr in prs if pr.get("merged_date") and start_s <= pr["merged_date"] <= end_s]
    pr_line_set = {(pr["repo"], pr["number"]): pr for pr in pr_created + pr_merged}.values()
    issues = [issue for issue in user_data["issues"] if issue.get("created_date") and start_s <= issue["created_date"] <= end_s]
    github_daily_map = {entry["date"]: entry["count"] for entry in user_data["contrib"]["daily"]}
    code_daily = daily_code_activity(user_data, start, end)
    days = list(daterange(start, end))
    weekdays = [day for day in days if day.weekday() < 5]
    weekend_days = [day for day in days if day.weekday() >= 5]
    active_weekdays = [day for day in weekdays if code_daily[day.isoformat()]["code_events"] > 0]
    missed_weekdays = [day for day in weekdays if code_daily[day.isoformat()]["code_events"] == 0]
    active_days = [day for day in days if code_daily[day.isoformat()]["code_events"] > 0]
    weekend_code_days = [day for day in weekend_days if code_daily[day.isoformat()]["code_events"] > 0]
    issue_only_days = [
        day
        for day in days
        if code_daily[day.isoformat()]["code_events"] == 0 and code_daily[day.isoformat()]["issues"] > 0
    ]

    repo_lines: Counter[str] = Counter()
    repo_commits: Counter[str] = Counter()
    for commit in non_merge:
        repo_lines[commit["repo"]] += commit["additions"] + commit["deletions"]
        repo_commits[commit["repo"]] += 1

    return {
        "start": start_s,
        "end": end_s,
        "official_github_activity_events": sum(github_daily_map.get(day.isoformat(), 0) for day in days),
        "code_activity_events": sum(code_daily[day.isoformat()]["code_events"] for day in days),
        "active_days": len(active_days),
        "active_weekdays": len(active_weekdays),
        "missed_weekdays": [day.isoformat() for day in missed_weekdays],
        "missed_weekday_count": len(missed_weekdays),
        "weekend_code_days": [day.isoformat() for day in weekend_code_days],
        "weekend_code_day_count": len(weekend_code_days),
        "weekend_code_events": sum(code_daily[day.isoformat()]["code_events"] for day in weekend_code_days),
        "weekend_code_summaries": [
            {"date": day.isoformat(), "summary": compact_day_summary(code_daily[day.isoformat()])}
            for day in weekend_code_days
        ],
        "issue_only_days": [day.isoformat() for day in issue_only_days],
        "issue_only_day_count": len(issue_only_days),
        "authored_commits": len(commits),
        "non_merge_commits": len(non_merge),
        "merge_commits": len(merge),
        "commit_additions": sum(commit["additions"] for commit in non_merge),
        "commit_deletions": sum(commit["deletions"] for commit in non_merge),
        "commit_lines_changed": sum(commit["additions"] + commit["deletions"] for commit in non_merge),
        "commit_files_changed": sum(commit["changed_files"] for commit in non_merge),
        "prs_touched": len(prs),
        "prs_created": len(pr_created),
        "prs_merged": len(pr_merged),
        "prs_open": len([pr for pr in prs if pr.get("state") == "open"]),
        "pr_additions": sum(pr["additions"] for pr in pr_line_set),
        "pr_deletions": sum(pr["deletions"] for pr in pr_line_set),
        "issues_created": len(issues),
        "top_repos": [
            {"repo": repo, "lines_changed": lines, "commits": repo_commits[repo]}
            for repo, lines in repo_lines.most_common(5)
        ],
        "recent_prs": prs[:8],
        "recent_commits": commits[:8],
        "recent_issues": issues[:5],
        "daily_code": code_daily,
    }


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    report_end = date.fromisoformat(args.report_end) if args.report_end else datetime.now(IST).date()
    report_start = report_end - timedelta(days=29)
    windows = {
        "last_10_days": report_end - timedelta(days=9),
        "last_20_days": report_end - timedelta(days=19),
        "last_one_month": report_start,
    }
    token = args.token or run(["gh", "auth", "token"])
    client = GitHubClient(token)
    graph_org_id = args.org_id or org_id(client, args.org)
    people = [parse_person(raw) for raw in args.users]

    repos = client.paged(
        f"/orgs/{args.org}/repos",
        {"type": "all", "sort": "updated", "direction": "desc"},
        max_pages=5,
    )
    report: dict[str, Any] = {
        "scope": {
            "org": args.org,
            "org_id": graph_org_id,
            "report_start": report_start.isoformat(),
            "report_end": report_end.isoformat(),
            "generated_at_ist": datetime.now(IST).isoformat(timespec="seconds"),
            "visible_repositories": len(repos),
            "active_repositories_since_start": sum(
                1
                for repo in repos
                if parse_dt(repo.get("pushed_at")) and parse_dt(repo.get("pushed_at")).date() >= report_start
            ),
            "note": "Code contribution signal only. Weekday scoring uses authored non-merge commits and authored PR created/merged days; issues are issue-only planning signal.",
        },
        "users": {},
    }

    for person in people:
        print(f"Collecting {person.login}...", file=sys.stderr)
        user_data = {
            "name": person.name,
            "login": person.login,
            "profile_url": f"https://github.com/{person.login}",
            "contrib": fetch_contribution_calendar(client, graph_org_id, person.login, report_start, report_end),
            "commits": search_commits(client, args.org, person.login, report_start, report_end, args.workers),
            "prs": fetch_prs(client, args.org, person.login, report_start, report_end, args.workers),
            "issues": fetch_issues(client, args.org, person.login, report_start, report_end),
        }
        user_data["windows"] = {key: summarize_window(user_data, start, report_end) for key, start in windows.items()}
        report["users"][person.key] = user_data
    return report


def write_json(report: dict[str, Any], out_dir: Path) -> Path:
    org_slug = report["scope"]["org"].replace("-", "_")
    report_end = report["scope"]["report_end"]
    path = out_dir / f"{org_slug}_github_ops_report_{report_end}_data.json"
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return path


def fmt(value: int) -> str:
    return f"{int(value):,}"


def esc(value: Any) -> str:
    return html.escape(str(value), quote=False)


def render_pdf(report: dict[str, Any], out_dir: Path) -> Path:
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as exc:
        raise SystemExit("PDF output requires reportlab. Run with a Python environment that includes reportlab.") from exc

    red = colors.HexColor("#C00000")
    black = colors.black
    line = colors.HexColor("#D9D9D9")
    soft = colors.HexColor("#F7F7F7")
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleX", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=27, leading=32, alignment=TA_LEFT, textColor=black))
    styles.add(ParagraphStyle(name="H1X", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=black, spaceAfter=9))
    styles.add(ParagraphStyle(name="H2X", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=black, spaceBefore=8, spaceAfter=5))
    styles.add(ParagraphStyle(name="BodyX", parent=styles["Normal"], fontName="Helvetica", fontSize=8.8, leading=12.2, textColor=black, spaceAfter=4))
    styles.add(ParagraphStyle(name="SmallX", parent=styles["Normal"], fontName="Helvetica", fontSize=7.2, leading=9, textColor=black, spaceAfter=2))
    styles.add(ParagraphStyle(name="MetricX", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=14, leading=17, alignment=TA_CENTER, textColor=black))
    styles.add(ParagraphStyle(name="MetricLabelX", parent=styles["Normal"], fontName="Helvetica", fontSize=7.2, leading=8.5, alignment=TA_CENTER, textColor=black))
    styles.add(ParagraphStyle(name="CellX", parent=styles["Normal"], fontName="Helvetica", fontSize=6.7, leading=7.9, textColor=black))
    styles.add(ParagraphStyle(name="CellRedX", parent=styles["CellX"], fontName="Helvetica-Bold", textColor=red))
    styles.add(ParagraphStyle(name="CellHeadX", parent=styles["CellX"], fontName="Helvetica-Bold"))

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    def parse_day(value: str) -> date:
        return date.fromisoformat(value)

    def day_label(value: str | date) -> str:
        current = parse_day(value) if isinstance(value, str) else value
        return f"{month_names[current.month - 1]} {current.day:02d} ({day_names[current.weekday()]})"

    def format_days(values: list[str], limit: int = 7) -> str:
        labels = [day_label(value) for value in values[:limit]]
        if len(values) > limit:
            labels.append(f"+{len(values) - limit} more")
        return ", ".join(labels)

    def weekend_note(window: dict[str, Any]) -> str:
        if not window["weekend_code_days"]:
            return "No weekend code activity in this window."
        summaries = [
            f"{day_label(item['date'])}: {item['summary']}"
            for item in window["weekend_code_summaries"][:4]
        ]
        if len(window["weekend_code_summaries"]) > 4:
            summaries.append(f"+{len(window['weekend_code_summaries']) - 4} more weekend day(s)")
        return "Weekend code activity captured: " + "; ".join(summaries) + "."

    def alert_for(window: dict[str, Any]) -> str:
        if window["non_merge_commits"] == 0 and window["prs_created"] == 0 and window["missed_weekday_count"] >= 5:
            return (
                "RED ALERT: issue-only or no-execution signal; no authored commits or PRs and most weekdays missed. "
                + weekend_note(window)
            )
        if window["non_merge_commits"] == 0 and window["missed_weekday_count"] >= 5:
            return "RED ALERT: no non-merge authored code churn and heavy weekday absence. " + weekend_note(window)
        if window["missed_weekday_count"]:
            return (
                f"Watch: missed {window['missed_weekday_count']} weekday(s): {format_days(window['missed_weekdays'])}. "
                + weekend_note(window)
            )
        if window["weekend_code_days"]:
            return "No weekday code absence in this window. " + weekend_note(window)
        return "No weekday code absence in this window."

    def metric_table(items: list[tuple[str, str]]) -> Table:
        table = Table(
            [[Paragraph(value, styles["MetricX"]) for value, _ in items], [Paragraph(label, styles["MetricLabelX"]) for _, label in items]],
            colWidths=[1.55 * inch] * len(items),
            rowHeights=[0.27 * inch, 0.2 * inch],
        )
        table.setStyle(TableStyle([("LINEBELOW", (0, 1), (-1, 1), 0.4, line), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        return table

    users = list(report["users"].values())
    month_windows = [user["windows"]["last_one_month"] for user in users]
    team_code_events = sum(window["code_activity_events"] for window in month_windows)
    team_lines = sum(window["commit_lines_changed"] for window in month_windows)
    team_pr_created = sum(window["prs_created"] for window in month_windows)
    team_pr_merged = sum(window["prs_merged"] for window in month_windows)
    team_reviews = sum(user["contrib"]["github_review_contributions"] for user in users)

    story: list[Any] = []
    story.append(Paragraph(f"{esc(report['scope']['org'])} GitHub Operations Report", styles["TitleX"]))
    story.append(
        Paragraph(
            f"Reporting window: {day_label(report['scope']['report_start'])} - {day_label(report['scope']['report_end'])}. "
            f"Generated {esc(report['scope']['generated_at_ist'])} IST.",
            styles["BodyX"],
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        metric_table(
            [
                (fmt(team_code_events), "code activity events"),
                (fmt(team_lines), "non-merge commit lines"),
                (f"{fmt(team_pr_created)} / {fmt(team_pr_merged)}", "PRs created / merged"),
                (fmt(team_reviews), "PR reviews"),
            ]
        )
    )
    story.append(Spacer(1, 14))
    story.append(Paragraph("Executive Signal", styles["H1X"]))
    top = sorted(users, key=lambda user: user["windows"]["last_one_month"]["code_activity_events"], reverse=True)
    low = sorted(users, key=lambda user: (user["windows"]["last_10_days"]["non_merge_commits"], user["windows"]["last_10_days"]["prs_created"], -user["windows"]["last_10_days"]["missed_weekday_count"]))[0]
    story.append(
        Paragraph(
            f"{esc(top[0]['name'])} and {esc(top[1]['name']) if len(top) > 1 else 'the next contributor'} carry most of the visible code contribution in this window. "
            "Code contribution is counted from authored non-merge commits and authored PR activity; issue-only Kanban work is shown separately and does not satisfy a workday.",
            styles["BodyX"],
        )
    )
    low_10 = low["windows"]["last_10_days"]
    story.append(
        Paragraph(
            f"<font color=\"#C00000\"><b>Red alert: {esc(low['name'])} has the weakest recent implementation signal. "
            f"Last 10 days: {fmt(low_10['code_activity_events'])} code activity events, {fmt(low_10['authored_commits'])} authored commits, "
            f"{fmt(low_10['prs_created'])} PRs created, and {fmt(low_10['missed_weekday_count'])} missed weekdays.</b></font>",
            styles["BodyX"],
        )
    )
    story.append(PageBreak())

    labels = {"last_10_days": "Segment 1. Last 10 Days", "last_20_days": "Segment 2. Last 20 Days", "last_one_month": "Segment 3. Last One Month"}
    for key, title in labels.items():
        first_window = users[0]["windows"][key]
        story.append(Paragraph(title, styles["H1X"]))
        story.append(
            Paragraph(
                f"Window: {day_label(first_window['start'])} - {day_label(first_window['end'])}. Weekday absence scoring uses code activity only; weekend code is captured separately.",
                styles["BodyX"],
            )
        )
        for user in users:
            window = user["windows"][key]
            expected = window["active_weekdays"] + window["missed_weekday_count"]
            pr_lines = window["pr_additions"] + window["pr_deletions"]
            alert = alert_for(window)
            top_repos = window.get("top_repos") or []
            repos = "; ".join(
                f"{repo['repo'].replace(report['scope']['org'] + '/', '')}: {fmt(repo['lines_changed'])} lines / {fmt(repo['commits'])} commits"
                for repo in top_repos[:3]
            ) or "no non-merge authored commit line churn"
            story.append(Paragraph(f"<b>{esc(user['name'])} (@{esc(user['login'])})</b>", styles["H2X"]))
            story.append(
                Paragraph(
                    f"Code activity events: <b>{fmt(window['code_activity_events'])}</b>. Active weekdays: <b>{window['active_weekdays']}/{expected}</b>. "
                    f"Missed weekdays: <b>{window['missed_weekday_count']}</b>. Weekend code days: <b>{window['weekend_code_day_count']}</b>.",
                    styles["BodyX"],
                )
            )
            story.append(
                Paragraph(
                    f"Authored commits: <b>{fmt(window['authored_commits'])}</b> total, <b>{fmt(window['non_merge_commits'])}</b> non-merge, "
                    f"<b>{fmt(window['merge_commits'])}</b> merge. Non-merge churn: <b>+{fmt(window['commit_additions'])} / -{fmt(window['commit_deletions'])}</b> "
                    f"({fmt(window['commit_lines_changed'])} lines).",
                    styles["BodyX"],
                )
            )
            story.append(
                Paragraph(
                    f"PRs: <b>{fmt(window['prs_created'])}</b> created, <b>{fmt(window['prs_merged'])}</b> merged, <b>{fmt(window['prs_open'])}</b> open. "
                    f"PR diff churn: <b>+{fmt(window['pr_additions'])} / -{fmt(window['pr_deletions'])}</b> ({fmt(pr_lines)} lines). "
                    f"Issue-only planning items: <b>{fmt(window['issues_created'])}</b> across <b>{fmt(window['issue_only_day_count'])}</b> issue-only day(s).",
                    styles["BodyX"],
                )
            )
            story.append(Paragraph(f"Top repos: {esc(repos)}.", styles["BodyX"]))
            if window["weekend_code_days"]:
                story.append(Paragraph(esc(weekend_note(window)), styles["BodyX"]))
            if window["issue_only_days"]:
                story.append(Paragraph(f"Issue-only days do not count as contribution: {esc(format_days(window['issue_only_days']))}.", styles["BodyX"]))
            story.append(Paragraph(f"<font color=\"#C00000\"><b>{esc(alert)}</b></font>" if alert.startswith("RED ALERT") or alert.startswith("Watch") else esc(alert), styles["BodyX"]))
        story.append(PageBreak())

    story.append(Paragraph("Segment 4. Complete Activity Sheet", styles["H1X"]))
    story.append(Paragraph("Monday-Friday misses are red only when there is no code activity. Weekend code activity is marked clearly; issue-only days do not count as contribution.", styles["BodyX"]))
    start = parse_day(report["scope"]["report_start"])
    end = parse_day(report["scope"]["report_end"])
    daily = {user["login"]: daily_code_activity(user, start, end) for user in users}
    rows = [[Paragraph("Date", styles["CellHeadX"]), Paragraph("Day", styles["CellHeadX"])] + [Paragraph(user["name"].split()[0], styles["CellHeadX"]) for user in users]]
    for current in daterange(start, end):
        row = [Paragraph(day_label(current), styles["CellX"]), Paragraph(day_names[current.weekday()], styles["CellX"])]
        for user in users:
            entry = daily[user["login"]][current.isoformat()]
            count = entry["code_events"]
            detail = compact_day_summary(entry)
            if current.weekday() >= 5:
                if count:
                    row.append(Paragraph(f"Weekend code {count}: {esc(detail)}", styles["CellX"]))
                elif entry["issues"]:
                    row.append(Paragraph(f"Weekend issue-only {entry['issues']}", styles["CellX"]))
                else:
                    row.append(Paragraph("Weekend", styles["CellX"]))
            elif count:
                row.append(Paragraph(f"Code {count}: {esc(detail)}", styles["CellX"]))
            elif entry["issues"]:
                row.append(Paragraph(f"MISS; issue-only {entry['issues']}", styles["CellRedX"]))
            else:
                row.append(Paragraph("MISS", styles["CellRedX"]))
        rows.append(row)
    table = Table(rows, colWidths=[1.18 * inch, 0.42 * inch] + [1.16 * inch] * len(users), repeatRows=1)
    commands: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), soft),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 3.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3.5),
    ]
    for idx in range(1, len(rows)):
        commands.append(("LINEBELOW", (0, idx), (-1, idx), 0.25, line))
    table.setStyle(TableStyle(commands))
    story.append(table)
    story.append(PageBreak())

    story.append(Paragraph("High-Signal PRs In Scope", styles["H1X"]))
    for user in users:
        story.append(Paragraph(f"<b>{esc(user['name'])} (@{esc(user['login'])})</b>", styles["BodyX"]))
        for pr in user["windows"]["last_one_month"]["recent_prs"][:5]:
            repo = pr["repo"].replace(report["scope"]["org"] + "/", "")
            merged = pr.get("merged_date") or "open/not merged"
            story.append(Paragraph(f"{esc(repo)} #{pr['number']}: {esc(pr['title'])}. Created {pr.get('created_date')}; merged {merged}; +{fmt(pr['additions'])} / -{fmt(pr['deletions'])}.", styles["SmallX"]))
        story.append(Spacer(1, 4))
    story.append(Paragraph("Methodology", styles["H1X"]))
    story.append(Paragraph(f"Source: GitHub REST and GraphQL APIs for organization {esc(report['scope']['org'])}. Visible repos in scope: {fmt(report['scope']['visible_repositories'])}; repos with pushes since {esc(report['scope']['report_start'])}: {fmt(report['scope']['active_repositories_since_start'])}.", styles["BodyX"]))
    story.append(Paragraph("Code contribution is counted from authored non-merge commits plus authored PRs created or merged in the window when those PRs carry a diff. Issue-only Kanban activity is reported separately and never satisfies a missed workday.", styles["BodyX"]))
    story.append(Paragraph("Authored commit churn excludes merge commits. PR diff churn includes authored PRs created or merged in the window. Deployments and GCP operations are not counted unless they appear as authored code commits or PRs in GitHub.", styles["BodyX"]))
    story.append(Paragraph("<font color=\"#C00000\"><b>Red missing marks mean no code contribution was recorded on an expected Monday-Friday workday. Weekend code activity is shown next to the miss context when present.</b></font>", styles["BodyX"]))

    def footer(canvas: Any, doc: Any) -> None:
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.drawString(54, 28, f"{report['scope']['org']} GitHub Operations Report")
        canvas.drawRightString(letter[0] - 54, 28, f"Page {doc.page}")
        canvas.restoreState()

    org_slug = report["scope"]["org"].replace("-", "_")
    path = out_dir / f"{org_slug}_github_operations_report_{report['scope']['report_end']}.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=letter, rightMargin=54, leftMargin=54, topMargin=52, bottomMargin=42)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a Hushh Labs GitHub operations report.")
    parser.add_argument("--org", default=DEFAULT_ORG, help="GitHub organization login.")
    parser.add_argument("--org-id", help="Optional GraphQL organization ID. Looked up automatically when omitted.")
    parser.add_argument("--users", nargs="+", default=list(DEFAULT_USERS), help="Contributors as 'Name:login'.")
    parser.add_argument("--report-end", help="Last date to include, YYYY-MM-DD. Defaults to today in IST.")
    parser.add_argument("--out-dir", default="ops_reports", help="Output directory.")
    parser.add_argument("--workers", type=int, default=8, help="Parallel GitHub detail fetch workers.")
    parser.add_argument("--token", help="GitHub token. Defaults to `gh auth token`.")
    parser.add_argument("--json-only", action="store_true", help="Write JSON evidence without PDF rendering.")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    report = build_report(args)
    json_path = write_json(report, out_dir)
    print(json_path)
    if not args.json_only:
        pdf_path = render_pdf(report, out_dir)
        print(pdf_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
