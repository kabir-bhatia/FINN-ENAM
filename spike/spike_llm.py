"""Spike 2: download a concall transcript from BSE and ask Gemini to extract guidance from the PDF directly."""
import base64, json, os, sys, time
import requests
from pypdf import PdfReader
from io import BytesIO

key = os.environ["GEMINI_API_KEY"]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0", "Referer": "https://www.bseindia.com/"}
url = "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=daa6c172-771a-4af5-b4b3-9813fdf7536a.pdf"
t = time.time()
pdf = requests.get(url, headers=UA, timeout=60).content
print("pdf bytes", len(pdf), "in", round(time.time() - t, 1), "s, magic", pdf[:5])
reader = PdfReader(BytesIO(pdf))
text = "\n".join((p.extract_text() or "") for p in reader.pages)
print("pages", len(reader.pages), "text chars", len(text))
print(text[:300].replace("\n", " "))

prompt = ("From this earnings call transcript, list up to 5 explicit forward-looking guidance statements by management "
          "(growth, margin, capex, store additions etc). Return JSON array of {metric, target, horizon, quote, page}. "
          "Use only the document.")
for model in sys.argv[1:] or ["gemini-3.5-flash-lite"]:
    t = time.time()
    body = {"contents": [{"parts": [{"inline_data": {"mime_type": "application/pdf", "data": base64.b64encode(pdf).decode()}}, {"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}}
    r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                      headers={"x-goog-api-key": key, "Content-Type": "application/json"}, json=body, timeout=180)
    print(f"\n--- {model}: status {r.status_code} in {round(time.time() - t, 1)}s")
    j = r.json()
    if r.ok:
        print("usage", j.get("usageMetadata"))
        print(j["candidates"][0]["content"]["parts"][0]["text"][:1500])
    else:
        print(json.dumps(j)[:400])
