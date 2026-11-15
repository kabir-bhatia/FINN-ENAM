"""Data spike: can we reach each source from this machine, and what does the data look like?"""
import json, re, sys, time
import requests

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}
out = {}

def section(name):
    print(f"\n===== {name} =====", flush=True)

# 1. yfinance
section("yfinance")
try:
    import yfinance as yf
    df = yf.download(["RELIANCE.NS", "TITAN.NS", "HDFCBANK.NS"], period="1mo", progress=False, auto_adjust=True)
    print("rows:", len(df), "last date:", df.index[-1].date())
    print(df["Volume"].tail(2).to_string())
except Exception as e:
    print("FAIL", repr(e))

# 2. BSE announcements
section("BSE announcements (Reliance 500325, last 10 days)")
try:
    s = requests.Session(); s.headers.update(UA | {"Referer": "https://www.bseindia.com/", "Origin": "https://www.bseindia.com"})
    url = ("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1"
           "&strPrevDate=20261104&strScrip=500325&strSearch=P&strToDate=20261114&strType=C&subcategory=-1")
    r = s.get(url, timeout=20)
    print("status", r.status_code, "len", len(r.text))
    data = r.json()
    rows = data.get("Table", [])
    print("filings:", len(rows))
    for row in rows[:6]:
        print("-", row.get("NEWS_DT"), "|", row.get("CATEGORYNAME"), "|", row.get("SUBCATNAME"), "|", (row.get("NEWSSUB") or "")[:90], "|", row.get("ATTACHMENTNAME"))
    if rows: print("keys:", list(rows[0].keys()))
except Exception as e:
    print("FAIL", repr(e))

# 2b. BSE all-market feed for one day (for portfolio selection)
section("BSE all announcements, one day")
try:
    url = ("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1"
           "&strPrevDate=20261113&strScrip=&strSearch=P&strToDate=20261113&strType=C&subcategory=-1")
    r = s.get(url, timeout=20)
    d = r.json(); rows = d.get("Table", [])
    print("status", r.status_code, "page1 rows:", len(rows), "total:", (d.get("Table1") or [{}])[0])
except Exception as e:
    print("FAIL", repr(e))

# 3. NSE
section("NSE announcements")
try:
    n = requests.Session(); n.headers.update(UA | {"Accept": "application/json", "Referer": "https://www.nseindia.com/"})
    n.get("https://www.nseindia.com/", timeout=15)
    r = n.get("https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=RELIANCE", timeout=15)
    print("status", r.status_code, "len", len(r.text))
    if r.ok:
        j = r.json(); print("items:", len(j)); print(json.dumps(j[0])[:400] if j else "")
except Exception as e:
    print("FAIL", repr(e))

# 4. Screener
section("Screener (TITAN)")
try:
    r = requests.get("https://www.screener.in/company/TITAN/consolidated/", headers=UA, timeout=20)
    print("status", r.status_code, "len", len(r.text))
    html = r.text
    concalls = re.findall(r'<li class="flex flex-gap-8 flex-wrap">(.*?)</li>', html, re.S)
    print("concall rows:", len(concalls))
    for c in concalls[:5]:
        date = re.search(r'<div class="ink-600 font-size-15[^"]*"[^>]*>\s*([^<]+)', c)
        links = re.findall(r'href="([^"]+)"[^>]*>\s*([A-Za-z ]+)', c)
        print("-", date.group(1).strip() if date else "?", [(t.strip(), u[:80]) for u, t in links])
    q = re.search(r'id="quarters".*?<table.*?</table>', html, re.S)
    if q:
        heads = re.findall(r'<th[^>]*>\s*([^<]+?)\s*</th>', q.group(0))
        print("quarter cols:", heads[-6:])
        for label in ["Sales", "Operating Profit", "Profit before tax", "Net Profit"]:
            m = re.search(label + r'.*?</tr>', q.group(0), re.S)
            if m:
                vals = re.findall(r'<td[^>]*>\s*([-\d,\.%]+)\s*</td>', m.group(0))
                print(label, vals[-6:])
except Exception as e:
    print("FAIL", repr(e))
