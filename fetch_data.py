import requests
import os
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json

load_dotenv()

ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN") or os.getenv("ACCESS_TOKEN")
AD_ACCOUNT_ID = os.getenv("META_AD_ACCOUNT_ID") or os.getenv("AD_ACCOUNT_ID")


def get_meta_data(start_date=None, end_date=None, level="campaign"):
    """
    Fetch Meta Ads insights data.
    level: "campaign" | "adset" | "ad"
    Returns a DataFrame or empty DataFrame on failure.
    """
    url = f"https://graph.facebook.com/v24.0/{AD_ACCOUNT_ID}/insights"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

    # Normalise to date objects
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    if start_date is None or end_date is None:
        end_date = datetime.now().date() - timedelta(days=1)
        start_date = end_date - timedelta(days=7)

    # ✅ time_range must be a JSON string, not a dict
    params = {
        "fields": "campaign_name,adset_name,ad_name,impressions,reach,clicks,ctr,cpc,frequency,spend,actions,date_start,date_stop",
        "time_increment": 1,
        "level": level,
        "time_range": json.dumps({
            "since": start_date.strftime("%Y-%m-%d"),
            "until": end_date.strftime("%Y-%m-%d"),
        }),
        "limit": 500,
    }

    print(f"[fetch_data] Requesting {level} insights from {start_date} → {end_date}")

    all_rows = []
    next_url = url

    # ✅ Handle pagination
    while next_url:
        if next_url == url:
            response = requests.get(url, params=params, headers=headers)
        else:
            response = requests.get(next_url, headers=headers)

        if response.status_code != 200:
            print(f"[fetch_data] HTTP {response.status_code}: {response.text}")
            return pd.DataFrame()

        payload = response.json()

        if "error" in payload:
            err = payload["error"]
            print(f"[fetch_data] API Error {err.get('code')}: {err.get('message')}")
            return pd.DataFrame()

        rows = payload.get("data", [])
        all_rows.extend(rows)

        # Follow next page
        next_url = payload.get("paging", {}).get("next")

    if not all_rows:
        print("[fetch_data] No data returned for the requested range.")
        return pd.DataFrame()

    df = pd.DataFrame(all_rows)

    # ── Numeric columns ──────────────────────────────────────────────────────
    numeric_cols = ["impressions", "clicks", "ctr", "cpc", "reach", "frequency", "spend"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # ── Extract action types ─────────────────────────────────────────────────
    def extract_action(actions, action_type):
        if not isinstance(actions, list):
            return 0
        for a in actions:
            if a.get("action_type") == action_type:
                return int(float(a.get("value", 0)))
        return 0

    if "actions" in df.columns:
        # ── Total leads — single source of truth, matches Meta "Leads" column exactly ──
        df["leads"] = df["actions"].apply(
            lambda x: extract_action(x, "onsite_conversion.lead_grouped")
        )
        # ── Three landing types — exact action types per source ──
        # Website pixel (landing page conversion)
        _web  = df["actions"].apply(lambda x: extract_action(x, "onsite_web_lead"))
        # WhatsApp click (first message)
        _wap  = df["actions"].apply(lambda x: extract_action(x, "onsite_conversion.messaging_whatsapp_reply"))
        # Messenger
        _msg  = df["actions"].apply(lambda x: extract_action(x, "onsite_conversion.messaging_first_reply"))
        # Messaging connections (started conversation)
        df["messaging_connections"] = df["actions"].apply(
            lambda x: extract_action(x, "onsite_conversion.total_messaging_connection")
        )
        # leads (onsite_conversion.lead_grouped) already includes website leads,
        # so form leads are the remainder. leads = form_leads + website_leads.
        df["website_leads"]   = _web
        df["whatsapp_leads"]  = _wap
        df["messenger_leads"] = _msg
        df["form_leads"]      = (df["leads"] - df["website_leads"]).clip(lower=0).astype(int)
        # Supporting
        df["link_clicks"]       = df["actions"].apply(lambda x: extract_action(x, "link_click"))
        df["landing_page_views"]= df["actions"].apply(lambda x: extract_action(x, "landing_page_view"))
    else:
        for col in ["leads","form_leads","website_leads","whatsapp_leads","messenger_leads",
                    "messaging_connections","link_clicks","landing_page_views"]:
            df[col] = 0

    # Total leads stays as onsite_conversion.lead_grouped — already set above

    # ── Derived metrics ──────────────────────────────────────────────────────
    df["cpm"] = (df["spend"] / df["impressions"].replace(0, float("nan")) * 1000).round(2)
    df["cpl"] = (df["spend"] / df["leads"].replace(0, float("nan"))).round(2)

    # ── Date — rename to 'date' so app.py can find it ────────────────────────
    df["date_start"] = pd.to_datetime(df["date_start"])
    df = df.rename(columns={"date_start": "date"})
    df = df.sort_values("date").reset_index(drop=True)

    print(f"[fetch_data] Fetched {len(df)} rows across {df['campaign_name'].nunique() if 'campaign_name' in df.columns else '?'} campaigns.")
    return df


def get_ad_level_data(start_date=None, end_date=None):
    """Fetch ad-level insights — includes ad_name and adset_name for best/worst ad analysis."""
    return get_meta_data(start_date=start_date, end_date=end_date, level="ad")
