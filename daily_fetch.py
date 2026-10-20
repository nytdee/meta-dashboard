"""
daily_fetch.py — Fetches Meta Ads data and saves to CSV.

NORMAL daily use (run via cron at 6am):
  python daily_fetch.py

FIRST TIME / BACKFILL (pull last 30 days, one file per day):
  python daily_fetch.py --backfill
  python daily_fetch.py --backfill --days 60

Cron example (runs at 6am AND 2pm to capture today's intraday data):
  0 6,14 * * * /usr/bin/python3 /path/to/daily_fetch.py >> /path/to/fetch.log 2>&1
"""
import os
import sys
import pandas as pd
from datetime import datetime, timedelta
from fetch_data import get_meta_data, get_ad_level_data

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

DROP_COLS = ["actions", "date_stop"]
today = datetime.now().date()

# ── Parse args ────────────────────────────────────────────────────────────────
backfill = "--backfill" in sys.argv
backfill_days = 30
for i, arg in enumerate(sys.argv):
    if arg == "--days" and i + 1 < len(sys.argv):
        try:
            backfill_days = int(sys.argv[i + 1])
        except ValueError:
            pass

# ── Build list of dates to fetch ──────────────────────────────────────────────
if backfill:
    # Fetch each day individually to avoid duplicate rows when mixed with daily files
    start = today - timedelta(days=max(backfill_days - 1, 0))
    # Include today so dashboard shows live data immediately after backfill
    dates_to_fetch = [(start + timedelta(days=i)) for i in range((today - start).days + 1)]
    print(f"[daily_fetch] 🔄 BACKFILL MODE: fetching {len(dates_to_fetch)} days ({dates_to_fetch[0]} → {dates_to_fetch[-1]})")
else:
    # Always fetch yesterday (complete) AND today (intraday)
    dates_to_fetch = [today - timedelta(days=1), today]
    print(f"[daily_fetch] Fetching yesterday ({dates_to_fetch[0]}) + today ({dates_to_fetch[1]})")


def save(df, label, filepath):
    if df is not None and not df.empty:
        df = df.drop(columns=DROP_COLS, errors="ignore")
        df.to_csv(filepath, index=False)
        print(f"[daily_fetch] ✅ {label}: {len(df)} rows → {filepath}")
    else:
        print(f"[daily_fetch] ⚠️  No {label} data returned.")


# ── Fetch each date individually ──────────────────────────────────────────────
for fetch_date in dates_to_fetch:
    date_str = str(fetch_date)
    camp_path = os.path.join(DATA_DIR, f"meta_ads_{date_str}.csv")
    ad_path   = os.path.join(DATA_DIR, f"meta_ads_ad_level_{date_str}.csv")

    # Campaign level
    df_camp = get_meta_data(start_date=fetch_date, end_date=fetch_date)
    save(df_camp, f"Campaign {date_str}", camp_path)

    # Ad level
    df_ads = get_ad_level_data(start_date=fetch_date, end_date=fetch_date)
    save(df_ads, f"Ad level {date_str}", ad_path)

print(f"[daily_fetch] Done.")
