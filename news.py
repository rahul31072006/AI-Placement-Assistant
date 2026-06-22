import datetime
import requests
import feedparser

NEWS_CACHE = {
    "mnc": {
        "items": [],
        "last_refresh": None,
    },
    "internship": {
        "items": [],
        "last_refresh": None,
    },
}

MNC_QUERIES = [
    "Google hiring jobs",
    "Amazon internships",
    "Microsoft recruitment",
    "TCS off campus drive",
    "Infosys hiring",
    "Accenture jobs",
]

INTERNSHIP_QUERIES = [
    "software engineering internships 2026",
    "remote internships India",
    "summer internships Google Amazon Microsoft",
    "data science internship",
]

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"


def build_rss_url(query: str) -> str:
    return GOOGLE_NEWS_RSS.format(query=requests.utils.requote_uri(query))


def parse_entry(entry, source_query: str):
    title = entry.get('title', '').strip()
    link = entry.get('link', '').strip()
    published = entry.get('published', entry.get('updated', ''))
    published_date = ''
    try:
        published_date = datetime.datetime(*entry.published_parsed[:6]).strftime('%Y-%m-%d')
    except Exception:
        published_date = published
    
    company = ''
    job_title = title
    parts = title.split(' - ')
    if len(parts) >= 2:
        company = parts[-1].strip()
        job_title = ' - '.join(parts[:-1]).strip()
    
    if not company:
        company = source_query.split()[0]

    return {
        'company': company,
        'job_title': job_title,
        'location': '',
        'apply_link': link,
        'posted_date': published_date,
        'source_query': source_query,
    }


def fetch_feed(query: str):
    url = build_rss_url(query)
    items = []

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        feed = feedparser.parse(response.text)
        for entry in feed.entries[:8]:
            item = parse_entry(entry, query)
            items.append(item)
    except Exception:
        pass

    return items


def merge_and_sort(results):
    entries = [item for sublist in results for item in sublist]
    entries = [item for item in entries if item.get('job_title') or item.get('company')]
    unique = {}
    for item in entries:
        key = (item['apply_link'], item['job_title'])
        if key not in unique:
            unique[key] = item
    sorted_items = sorted(unique.values(), key=lambda x: x.get('posted_date') or '', reverse=True)
    return sorted_items[:20]


def refresh_news_cache():
    mnc_results = [fetch_feed(query) for query in MNC_QUERIES]
    internship_results = [fetch_feed(query) for query in INTERNSHIP_QUERIES]

    NEWS_CACHE['mnc']['items'] = merge_and_sort(mnc_results)
    NEWS_CACHE['mnc']['last_refresh'] = datetime.datetime.utcnow().isoformat()

    NEWS_CACHE['internship']['items'] = merge_and_sort(internship_results)
    NEWS_CACHE['internship']['last_refresh'] = datetime.datetime.utcnow().isoformat()


def get_mnc_news():
    if not NEWS_CACHE['mnc']['items']:
        refresh_news_cache()
    return {
        'items': NEWS_CACHE['mnc']['items'],
        'last_refresh': NEWS_CACHE['mnc']['last_refresh'],
    }


def get_internship_news():
    if not NEWS_CACHE['internship']['items']:
        refresh_news_cache()
    return {
        'items': NEWS_CACHE['internship']['items'],
        'last_refresh': NEWS_CACHE['internship']['last_refresh'],
    }


# Refresh once on module import so app restart refreshes data
refresh_news_cache()
