import streamlit as st
import pandas as pd
import numpy as np
import os
import re as _re
from datetime import datetime, timedelta, date

st.set_page_config(page_title="Meta Leads Dashboard", page_icon="⚡", layout="wide", initial_sidebar_state="expanded")

try:
    from streamlit_autorefresh import st_autorefresh
    st_autorefresh(interval=300_000, key="autorefresh")
except ImportError:
    pass

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
html,body,[class*="css"],.stApp{font-family:'DM Sans',sans-serif!important;background:#0a0a0f!important;color:#e8e8f0!important}
#MainMenu,footer,header{visibility:hidden}
.block-container{padding:1.25rem 2rem!important;max-width:1500px}
section[data-testid="stSidebar"]{background:#0d0d18!important;border-right:1px solid #1e1e30}
section[data-testid="stSidebar"] *{color:#e8e8f0!important}
[data-testid="stMetric"]{background:#12121a;border:1px solid #2a2a3d;border-radius:10px;padding:0.9rem 1.1rem}
[data-testid="stMetricLabel"] p{font-family:'Space Mono',monospace!important;font-size:0.6rem!important;text-transform:uppercase;letter-spacing:0.1em;color:#6b6b8a!important}
[data-testid="stMetricValue"]{font-family:'Space Mono',monospace!important;font-size:1.6rem!important;color:#e8e8f0!important}
div[data-testid="stExpander"]{background:#12121a;border:1px solid #2a2a3d;border-radius:8px}
.stTabs [data-baseweb="tab-list"]{background:#12121a;border-radius:8px;padding:3px;gap:2px}
.stTabs [data-baseweb="tab"]{background:transparent;border-radius:6px;color:#6b6b8a;font-family:'Space Mono',monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em}
.stTabs [aria-selected="true"]{background:#1e1e30!important;color:#e8e8f0!important}
.stDateInput>div>div{background:#12121a!important;border-color:#2a2a3d!important}
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
DATA_DIR = "data"
MN="#6b6b8a"; TX="#e8e8f0"; BG="#12121a"; BG2="#1a1a26"; BG3="#0d0d18"
BD="#2a2a3d"; MO="Space Mono,monospace"
PURPLE="#7c6af7"; GREEN="#3de8a0"; YELLOW="#f7c96a"; RED="#f76a6a"; PINK="#f76a8a"

_DAY_PAT    = _re.compile(r'^meta_ads_(\d{4}-\d{2}-\d{2})\.csv$')
_DAY_AD_PAT = _re.compile(r'^meta_ads_ad_level_(\d{4}-\d{2}-\d{2})\.csv$')

# ─────────────────────────────────────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────────────────────────────────────
def _safe_num(df, cols):
    for c in cols:
        df[c] = pd.to_numeric(df.get(c, 0), errors="coerce").fillna(0) if c in df.columns else 0
    return df

def _fix_date(df):
    for c in ["date_start","day","Date"]:
        if c in df.columns and "date" not in df.columns:
            df = df.rename(columns={c:"date"})
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"]).dt.normalize()
    return df

def _dedup(df, keys):
    k = [c for c in keys if c in df.columns]
    if k: df = df.drop_duplicates(subset=k, keep="last").reset_index(drop=True)
    return df

@st.cache_data(ttl=300)
def load_data():
    files = []
    if os.path.exists(DATA_DIR):
        for f in sorted(os.listdir(DATA_DIR)):
            if _DAY_PAT.match(f):
                try: files.append(pd.read_csv(os.path.join(DATA_DIR,f)))
                except: pass
    df = pd.concat(files, ignore_index=True) if files else _sample_campaign()
    df = _fix_date(df)
    df = _safe_num(df, ["impressions","clicks","spend","leads","reach","frequency",
                        "form_leads","website_leads","messenger_leads","whatsapp_leads",
                        "link_clicks","landing_page_views","messaging_connections"])
    if df["leads"].sum()==0:
        df["leads"] = df[["form_leads","website_leads","messenger_leads","whatsapp_leads"]].sum(axis=1)
    if "ctr" not in df.columns or df["ctr"].sum()==0:
        df["ctr"] = (df["clicks"]/df["impressions"].replace(0,np.nan)*100).round(2)
    if "cpl" not in df.columns or df["cpl"].sum()==0:
        df["cpl"] = (df["spend"]/df["leads"].replace(0,np.nan)).round(2)
    return _dedup(df, ["date","campaign_name"])

@st.cache_data(ttl=300)
def load_ad_data():
    files = []
    if os.path.exists(DATA_DIR):
        for f in sorted(os.listdir(DATA_DIR)):
            if _DAY_AD_PAT.match(f):
                try: files.append(pd.read_csv(os.path.join(DATA_DIR,f)))
                except: pass
    df = pd.concat(files, ignore_index=True) if files else pd.DataFrame()
    if df.empty: return df
    df = _fix_date(df)
    df = _safe_num(df, ["impressions","clicks","spend","leads","ctr","cpl","cpm","reach",
                        "form_leads","website_leads","messenger_leads","whatsapp_leads"])
    if df["leads"].sum()==0:
        df["leads"] = df[["form_leads","website_leads","messenger_leads","whatsapp_leads"]].sum(axis=1)
    if df["cpl"].sum()==0: df["cpl"]=(df["spend"]/df["leads"].replace(0,np.nan)).round(2)
    if df["ctr"].sum()==0: df["ctr"]=(df["clicks"]/df["impressions"].replace(0,np.nan)*100).round(2)
    return _dedup(df, ["date","campaign_name","ad_name"])

def _sample_campaign():
    np.random.seed(42)
    camps=["Dr Binu - Direct Conversion","Dr Prema - Direct Conversion",
           "Dr GG - HSR","Dr Shashidhar","Leads Forms Campaigns",
           "Website - Landing Pages","Wellness - Website"]
    rows=[]
    base=datetime.today()-timedelta(days=89)
    for i in range(90):
        d=base+timedelta(days=i)
        for c in camps:
            imp=int(np.random.randint(3000,15000))
            clk=int(imp*np.random.uniform(0.01,0.04))
            spd=round(np.random.uniform(400,2500),2)
            leads=int(clk*np.random.uniform(0.05,0.2))
            reach=int(imp*np.random.uniform(0.6,0.9))
            rows.append({"date":d.strftime("%Y-%m-%d"),"campaign_name":c,
                         "impressions":imp,"clicks":clk,"spend":spd,"leads":leads,"reach":reach,
                         "frequency":round(imp/max(reach,1),2),"form_leads":leads,
                         "website_leads":0,"messenger_leads":0,"whatsapp_leads":0,
                         "ctr":round(clk/imp*100,2),"cpl":round(spd/max(leads,1),2),"cpm":round(spd/imp*1000,2)})
    return pd.DataFrame(rows)

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def fmt(n, prefix="", suffix="", dec=0):
    if n is None or (isinstance(n,float) and np.isnan(n)): return "—"
    return f"{prefix}{n:,.{dec}f}{suffix}" if dec>0 else f"{prefix}{int(n):,}{suffix}"

def delta_info(cv, pv, invert=False):
    if pv==0 or pd.isna(pv) or pd.isna(cv): return None,None,None
    pct=(cv-pv)/abs(pv)*100
    good=(pct>0) if not invert else (pct<0)
    return pct, good, ("↑" if pct>0 else "↓")

def section(t, sub=""):
    sub_html = f"<span style='font-size:0.75rem;color:{MN};font-weight:400;margin-left:0.6rem;font-family:DM Sans,sans-serif;'>{sub}</span>" if sub else ""
    st.markdown(f"<div style='display:flex;align-items:center;gap:0.5rem;margin:1.5rem 0 0.75rem 0;'>"
                f"<span style='font-family:{MO};font-size:0.65rem;text-transform:uppercase;"
                f"letter-spacing:0.12em;color:{MN};'>{t}</span>{sub_html}"
                f"<div style='flex:1;height:1px;background:{BD};margin-left:0.5rem;'></div></div>",
                unsafe_allow_html=True)

def agg_range(df_src, d_from, d_to, camps):
    if df_src.empty or "date" not in df_src.columns: return {}
    mask = ((df_src["date"]>=pd.Timestamp(d_from)) & (df_src["date"]<=pd.Timestamp(d_to)))
    if camps and "campaign_name" in df_src.columns: mask &= df_src["campaign_name"].isin(camps)
    s = df_src[mask]
    if s.empty: return {k:0 for k in ["leads","spend","clicks","impressions","reach","form_leads","website_leads","messenger_leads","whatsapp_leads","messaging_connections"]}
    def _s(c): return float(s[c].sum()) if c in s.columns else 0.0
    leads=_s("leads"); spend=_s("spend"); clk=_s("clicks"); imp=_s("impressions"); reach=_s("reach")
    return {"leads":leads,"spend":spend,"clicks":clk,"impressions":imp,"reach":reach,
            "form_leads":_s("form_leads"),"website_leads":_s("website_leads"),
            "messenger_leads":_s("messenger_leads"),"whatsapp_leads":_s("whatsapp_leads"),
            "messaging_connections":_s("messaging_connections"),
            "cpl": spend/leads if leads>0 else None,
            "ctr": clk/imp*100 if imp>0 else None,
            "cpm": spend/imp*1000 if imp>0 else None,
            "freq": imp/reach if reach>0 else None}

def funnel_card(col, icon, label, value, sub, accent, delta_val=None, delta_good=None):
    d_html=""
    if delta_val is not None and delta_good is not None:
        d_col=GREEN if delta_good else RED
        arrow="↑" if delta_val>0 else "↓"
        d_html=(f"<div style='margin-top:0.35rem;display:inline-block;padding:2px 7px;"
                f"border-radius:4px;font-size:0.62rem;font-weight:700;font-family:{MO};"
                f"background:{'rgba(61,232,160,0.12)' if delta_good else 'rgba(247,106,106,0.12)'};"
                f"color:{d_col};'>{arrow}{abs(delta_val):.0f}%</div>")
    with col:
        st.markdown(
            f"<div style='background:{BG};border:1px solid {BD};border-radius:10px;"
            f"padding:1rem 1.1rem;border-top:3px solid {accent};height:100%;'>"
            f"<div style='font-size:1.1rem;margin-bottom:0.3rem;'>{icon}</div>"
            f"<div style='font-family:{MO};font-size:0.58rem;text-transform:uppercase;"
            f"letter-spacing:0.1em;color:{MN};margin-bottom:0.4rem;'>{label}</div>"
            f"<div style='font-family:{MO};font-size:1.5rem;font-weight:700;color:{TX};line-height:1;'>{value}</div>"
            f"<div style='font-size:0.7rem;color:{MN};margin-top:0.25rem;'>{sub}</div>"
            f"{d_html}</div>", unsafe_allow_html=True)

def arrow_connector(col):
    with col:
        st.markdown(
            f"<div style='display:flex;align-items:center;justify-content:center;"
            f"height:100%;padding-top:2.2rem;'>"
            f"<div style='color:{MN};font-size:1.2rem;'>→</div></div>",
            unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(f"<div style='font-family:{MO};font-size:0.85rem;font-weight:700;"
                f"color:{TX};margin-bottom:1.2rem;'>⚡ Meta Leads</div>", unsafe_allow_html=True)

    # ── Date range mode
    range_mode = st.radio("Date mode", ["Preset","Custom"], horizontal=True, label_visibility="collapsed")

    df_all = load_data()
    _max_date = df_all["date"].max().date() if not df_all.empty and "date" in df_all.columns else date.today()
    _min_date = df_all["date"].min().date() if not df_all.empty and "date" in df_all.columns else date.today()-timedelta(days=90)

    if range_mode == "Preset":
        preset = st.selectbox("Range", ["Today","Yesterday","Last 7 days","Last 14 days","Last 30 days","This month","Last month"], index=2)
        _td = _max_date
        if   preset=="Today":        p_start,p_end = _td,_td
        elif preset=="Yesterday":    p_start,p_end = _td-timedelta(1),_td-timedelta(1)
        elif preset=="Last 7 days":  p_start,p_end = _td-timedelta(6),_td
        elif preset=="Last 14 days": p_start,p_end = _td-timedelta(13),_td
        elif preset=="Last 30 days": p_start,p_end = _td-timedelta(29),_td
        elif preset=="This month":
            p_start = _td.replace(day=1); p_end = _td
        else:
            _lm = (_td.replace(day=1)-timedelta(1))
            p_start = _lm.replace(day=1); p_end = _lm
        range_label = preset
    else:
        c1,c2 = st.columns(2)
        with c1: p_start = st.date_input("From", value=_max_date-timedelta(13), min_value=_min_date, max_value=_max_date, label_visibility="visible")
        with c2: p_end   = st.date_input("To",   value=_max_date, min_value=_min_date, max_value=_max_date, label_visibility="visible")
        range_label = f"{p_start.strftime('%d %b')} – {p_end.strftime('%d %b')}"

    # ── Comparison range
    st.markdown(f"<div style='font-size:0.7rem;color:{MN};margin:0.75rem 0 0.3rem 0;font-family:{MO};text-transform:uppercase;letter-spacing:0.08em;'>Compare to</div>", unsafe_allow_html=True)
    comp_mode = st.radio("Compare", ["Previous period","Custom","None"], horizontal=True, label_visibility="collapsed")

    if comp_mode == "Previous period":
        n_days = max((p_end-p_start).days+1,1)
        c_end   = p_start - timedelta(1)
        c_start = c_end - timedelta(n_days-1)
        comp_label = f"prev {n_days}d"
    elif comp_mode == "Custom":
        cc1,cc2 = st.columns(2)
        with cc1: c_start = st.date_input("Cmp from", value=p_start-timedelta(14), min_value=_min_date, max_value=_max_date, label_visibility="visible", key="cmp_from")
        with cc2: c_end   = st.date_input("Cmp to",   value=p_end-timedelta(14),   min_value=_min_date, max_value=_max_date, label_visibility="visible", key="cmp_to")
        comp_label = f"{c_start.strftime('%d %b')} – {c_end.strftime('%d %b')}"
    else:
        c_start = c_end = None
        comp_label = None

    st.divider()

    camps_all = sorted(df_all["campaign_name"].unique().tolist()) if "campaign_name" in df_all.columns else []
    selected  = st.multiselect("Campaigns", camps_all, default=camps_all)

    st.divider()
    show_diag = st.toggle("Diagnostics", value=False)
    if st.button("🔄 Refresh", use_container_width=True):
        st.cache_data.clear(); st.rerun()
    n_files = len([f for f in os.listdir(DATA_DIR) if _DAY_PAT.match(f)]) if os.path.exists(DATA_DIR) else 0
    st.caption(f"{n_files} days on disk · auto-refresh 5min")

# ─────────────────────────────────────────────────────────────────────────────
# DATA FOR SELECTED PERIODS
# ─────────────────────────────────────────────────────────────────────────────
curr = agg_range(df_all, p_start, p_end, selected)
comp = agg_range(df_all, c_start, c_end, selected) if c_start else {}

df_period = df_all[
    (df_all["date"]>=pd.Timestamp(p_start)) &
    (df_all["date"]<=pd.Timestamp(p_end)) &
    df_all["campaign_name"].isin(selected)
].copy() if not df_all.empty else pd.DataFrame()

# ─────────────────────────────────────────────────────────────────────────────
# BANNER
# ─────────────────────────────────────────────────────────────────────────────
issues,goods=[],[]
cpl_c=curr.get("cpl"); cpl_p=comp.get("cpl")
ctr_c=curr.get("ctr"); ctr_p=comp.get("ctr")
if cpl_c and cpl_p and cpl_p>0:
    if   cpl_c>cpl_p*1.2: issues.append(f"CPL up {((cpl_c/cpl_p)-1)*100:.0f}% vs comparison — check creative fatigue")
    elif cpl_c<cpl_p*0.9: goods.append(f"CPL down {((1-cpl_c/cpl_p))*100:.0f}% — campaigns more efficient")
if ctr_c and ctr_p and ctr_p>0 and ctr_c<ctr_p*0.8:
    issues.append("CTR dropped sharply — creative may be fatigued")
if "frequency" in df_period.columns and len(df_period)>0 and df_period["frequency"].mean()>3.5:
    issues.append(f"Avg frequency {df_period['frequency'].mean():.1f}x — saturation risk")
b_col=RED if len(issues)>=2 else (YELLOW if issues else GREEN)
b_bg=f"rgba(247,106,106,0.07)" if len(issues)>=2 else ("rgba(247,201,106,0.07)" if issues else "rgba(61,232,160,0.07)")
b_msg=" · ".join(issues) if issues else (" · ".join(goods)+" · All healthy" if goods else "All metrics healthy")

st.markdown(
    f"<div style='display:flex;align-items:center;justify-content:space-between;"
    f"margin-bottom:0.5rem;'>"
    f"<h2 style='font-family:{MO};font-size:1.2rem;font-weight:700;color:{TX};margin:0;'>"
    f"⚡ Meta Leads"
    f"<span style='font-size:0.75rem;color:{MN};font-weight:400;margin-left:0.75rem;'>{range_label}"
    f"{(' vs '+comp_label) if comp_label else ''}</span></h2>"
    f"<span style='font-size:0.75rem;color:{b_col};font-family:{MO};'>{b_msg}</span></div>",
    unsafe_allow_html=True)
st.markdown(f"<div style='height:2px;background:linear-gradient(90deg,{PURPLE},{GREEN},{YELLOW});border-radius:2px;margin-bottom:1.25rem;'></div>", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# FUNNEL FLOW: Leads → CPL → Spend → CTR → Clicks → Impressions → Reach
# ─────────────────────────────────────────────────────────────────────────────
section("Performance funnel", f"{range_label}")

reach_c=curr.get("reach",0); reach_p=comp.get("reach",0)
imp_c=curr.get("impressions",0); imp_p=comp.get("impressions",0)
clk_c=curr.get("clicks",0); clk_p=comp.get("clicks",0)
ctr_cv=curr.get("ctr"); ctr_pv=comp.get("ctr")
spd_c=curr.get("spend",0); spd_p=comp.get("spend",0)
leads_c=curr.get("leads",0); leads_p=comp.get("leads",0)
cpl_cv=curr.get("cpl"); cpl_pv=comp.get("cpl")

def _d(cv,pv,inv=False):
    pct,good,_ = delta_info(cv,pv,inv) if (cv and pv) else (None,None,None)
    return pct,good

# 7 cards + 6 arrows = 13 cols
cols = st.columns([3,0.6,3,0.6,3,0.6,3,0.6,3,0.6,3,0.6,3])

funnel_card(cols[0],  "🎯","Leads",           fmt(leads_c),       f"{'vs '+fmt(leads_p) if leads_p else 'total leads'}",         PURPLE,  *_d(leads_c,leads_p))
arrow_connector(cols[1])
funnel_card(cols[2],  "📊","CPL",             fmt(cpl_cv,"₹",dec=0) if cpl_cv else "—", f"{'vs '+fmt(cpl_pv,'₹',dec=0) if cpl_pv else 'cost per lead'}", YELLOW, *_d(cpl_cv,cpl_pv,inv=True))
arrow_connector(cols[3])
funnel_card(cols[4],  "💸","Spend",           fmt(spd_c,"₹",dec=0),f"{'vs '+fmt(spd_p,'₹',dec=0) if spd_p else 'total budget'}",   GREEN,   *_d(spd_c,spd_p))
arrow_connector(cols[5])
funnel_card(cols[6],  "📊","CTR",             fmt(ctr_cv,suffix="%",dec=2) if ctr_cv else "—", f"{'vs '+fmt(ctr_pv,suffix='%',dec=2) if ctr_pv else 'click-through rate'}", YELLOW, *_d(ctr_cv,ctr_pv))
arrow_connector(cols[7])
funnel_card(cols[8],  "👆","Clicks",          fmt(clk_c),         f"{'vs '+fmt(clk_p) if clk_p else 'link clicks'}",               "#5bd4ff",*_d(clk_c,clk_p))
arrow_connector(cols[9])
funnel_card(cols[10], "👁","Impressions",     fmt(imp_c),         f"{'vs '+fmt(imp_p) if imp_p else 'total ad views'}",             "#9b8cff",*_d(imp_c,imp_p))
arrow_connector(cols[11])
funnel_card(cols[12], "👥","Acc. Reached",   fmt(reach_c),       f"{'vs '+fmt(reach_p) if reach_p else 'unique people'}",          PURPLE,  *_d(reach_c,reach_p))

# ─────────────────────────────────────────────────────────────────────────────
# LEADS vs RESULTS  +  HOW META IDENTIFIES LEADS
# ─────────────────────────────────────────────────────────────────────────────
section("Leads vs results")

# Compute: total results = all conversions Meta optimised for (lead_grouped covers all)
# "Results" in Meta = the objective-level conversion — same as leads for lead gen campaigns
# Diff = messaging_connections (people who connected but didn't complete the form)
form_leads   = curr.get("form_leads",0)
web_leads    = curr.get("website_leads",0)
msg_conn     = curr.get("messaging_connections",0)
total_leads  = leads_c
# Results = leads + any messaging connections that didn't convert
total_results = int(total_leads + max(msg_conn - total_leads, 0))
drop_off      = max(total_results - total_leads, 0)
conv_rate     = total_leads/total_results*100 if total_results>0 else 0

lv1,lv2,lv3,lv4 = st.columns(4)
for col,icon,label,val,sub,ac in [
    (lv1,"✅","Total Leads",       fmt(total_leads),  "form fills counted by Meta",       GREEN),
    (lv2,"📋","Total Results",     fmt(total_results),"all conversions Meta optimised for",PURPLE),
    (lv3,"📉","Drop-off",          fmt(drop_off),     "started but didn't complete",       RED),
    (lv4,"🔄","Lead Conv. Rate",   f"{conv_rate:.1f}%","results that became leads",         YELLOW),
]:
    with col:
        st.markdown(
            f"<div style='background:{BG};border:1px solid {BD};border-radius:10px;"
            f"padding:1rem 1.1rem;border-left:3px solid {ac};'>"
            f"<div style='font-size:1rem;margin-bottom:0.25rem;'>{icon}</div>"
            f"<div style='font-family:{MO};font-size:0.58rem;text-transform:uppercase;"
            f"letter-spacing:0.1em;color:{MN};margin-bottom:0.3rem;'>{label}</div>"
            f"<div style='font-family:{MO};font-size:1.4rem;font-weight:700;color:{TX};'>{val}</div>"
            f"<div style='font-size:0.7rem;color:{MN};margin-top:0.2rem;'>{sub}</div>"
            f"</div>", unsafe_allow_html=True)

# How Meta identifies leads — inline explanation
st.markdown(
    f"<div style='background:{BG2};border:1px solid {BD};border-radius:8px;"
    f"padding:0.9rem 1.1rem;margin-top:0.75rem;border-left:3px solid {PURPLE};'>"
    f"<div style='font-family:{MO};font-size:0.6rem;text-transform:uppercase;letter-spacing:0.1em;"
    f"color:{PURPLE};margin-bottom:0.5rem;'>How Meta identifies leads</div>"
    f"<div style='display:flex;gap:2rem;flex-wrap:wrap;'>"
    f"<div><span style='color:{GREEN};font-weight:700;font-size:0.8rem;'>Instant Form</span>"
    f"<div style='font-size:0.72rem;color:{MN};margin-top:0.15rem;'>User taps ad → fills Meta's<br>native form → submit</div></div>"
    f"<div><span style='color:{YELLOW};font-weight:700;font-size:0.8rem;'>Website Pixel</span>"
    f"<div style='font-size:0.72rem;color:{MN};margin-top:0.15rem;'>User clicks → lands on your<br>page → pixel fires on submit</div></div>"
    f"<div><span style='color:{PINK};font-weight:700;font-size:0.8rem;'>WhatsApp Click</span>"
    f"<div style='font-size:0.72rem;color:{MN};margin-top:0.15rem;'>User taps → opens WhatsApp<br>→ first message sent</div></div>"
    f"<div><span style='color:#5bd4ff;font-weight:700;font-size:0.8rem;'>Attribution window</span>"
    f"<div style='font-size:0.72rem;color:{MN};margin-top:0.15rem;'>Default: 7-day click<br>+ 1-day view</div></div>"
    f"</div></div>", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# LANDING TYPE BREAKDOWN (where leads come from)
# ─────────────────────────────────────────────────────────────────────────────
section("Lead landing type", "exact source per lead")

# Pull directly from action types in period data — mutually exclusive
if not df_period.empty:
    _fl  = float(df_period["form_leads"].sum())      if "form_leads"      in df_period.columns else 0.0
    _wl  = float(df_period["website_leads"].sum())   if "website_leads"   in df_period.columns else 0.0
    _wap = float(df_period["whatsapp_leads"].sum())  if "whatsapp_leads"  in df_period.columns else 0.0
    _tot = max(_fl+_wl+_wap, 1)
else:
    _fl=_wl=_wap=0.0; _tot=1.0

landing_types = [
    ("📋","Instant Form",    _fl,  PURPLE, "onsite_conversion.lead_grouped"),
    ("🌐","Website Pixel",   _wl,  GREEN,  "onsite_web_lead"),
    ("📱","WhatsApp Click",  _wap, PINK,   "onsite_conversion.messaging_whatsapp_reply"),
]
lt_cols = st.columns(3)
for col,(icon,name,val,ac,action_type) in zip(lt_cols, landing_types):
    cpl_v = curr.get("spend",0)/val if val>0 else 0
    pct   = val/_tot*100
    bar_w = max(int(pct),2) if val>0 else 0
    with col:
        st.markdown(
            f"<div style='background:{BG};border:1px solid {BD};border-radius:10px;"
            f"padding:1.1rem 1.3rem;border-top:3px solid {ac};'>"
            f"<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem;'>"
            f"<div><span style='font-size:1.2rem;'>{icon}</span>"
            f"<div style='font-family:{MO};font-size:0.6rem;text-transform:uppercase;"
            f"letter-spacing:0.08em;color:{MN};margin-top:0.2rem;'>{name}</div></div>"
            f"<div style='font-family:{MO};font-size:0.62rem;color:{MN};text-align:right;'>"
            f"<div style='color:{ac};font-weight:700;font-size:0.75rem;'>{pct:.0f}%</div>of total</div></div>"
            f"<div style='font-family:{MO};font-size:1.6rem;font-weight:700;color:{TX};'>{int(val):,}</div>"
            f"<div style='font-size:0.7rem;color:{MN};margin:0.2rem 0 0.6rem 0;'>₹{cpl_v:,.0f} CPL · {action_type}</div>"
            f"<div style='background:{BD};border-radius:3px;height:4px;'>"
            f"<div style='background:{ac};height:4px;border-radius:3px;width:{bar_w}%;'></div></div>"
            f"</div>", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# DAILY PULSE TABLE (Reach, Imp, Clicks, CTR, Spend, CPL, Leads)
# ─────────────────────────────────────────────────────────────────────────────
section("Daily pulse")

_td   = _max_date
_yest = _td - timedelta(1)
_ws   = _td - timedelta(6)
_pws  = _td - timedelta(13); _pwe = _td - timedelta(7)
_ms   = _td.replace(day=1); _me = _td
_lm_e = _ms - timedelta(1); _lms = _lm_e.replace(day=1)

pulse_windows = [
    ("Today",      agg_range(df_all,_td,  _td,   selected)),
    ("Yesterday",  agg_range(df_all,_yest,_yest,  selected)),
    ("This week",  agg_range(df_all,_ws,  _td,   selected)),
    ("Last week",  agg_range(df_all,_pws, _pwe,  selected)),
    ("This month", agg_range(df_all,_ms,  _me,   selected)),
    ("Last month", agg_range(df_all,_lms, _lm_e, selected)),
]
pw_cmp = {0:1, 1:None, 2:3, 3:None, 4:5, 5:None}

pulse_metrics = [
    ("👥 Reach",   "reach",       "",  0, False, "#9b8cff"),
    ("👁 Impr.",   "impressions", "",  0, False, "#5bd4ff"),
    ("👆 Clicks",  "clicks",      "",  0, False, PURPLE),
    ("📊 CTR",     "ctr",         "",  2, False, YELLOW),
    ("💸 Spend",   "spend",       "₹", 0, False, GREEN),
    ("📊 CPL",     "cpl",         "₹", 0, True,  YELLOW),
    ("🎯 Leads",   "leads",       "",  0, False, PURPLE),
]

th=f"font-family:{MO};font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:{MN};padding:0.65rem 0.9rem;border-bottom:1px solid {BD};text-align:left;font-weight:600;white-space:nowrap;"
td=f"font-family:{MO};font-size:0.85rem;font-weight:700;padding:0.6rem 0.9rem;border-bottom:1px solid {BD};white-space:nowrap;vertical-align:middle;"

ph=(f"<div style='overflow-x:auto;border-radius:10px;border:1px solid {BD};overflow:hidden;margin-bottom:0.5rem;'>"
    f"<table style='width:100%;border-collapse:collapse;background:{BG};'><thead><tr>"
    f"<th style='{th}background:{BG2};min-width:100px;'>Metric</th>")
for wi,(lbl,_) in enumerate(pulse_windows):
    is_t=wi==0
    bg="rgba(124,106,247,0.1)" if is_t else BG2
    col="#a89ef9" if is_t else MN
    dot=f"<span style='width:6px;height:6px;border-radius:50%;background:{PURPLE};display:inline-block;margin-right:4px;vertical-align:middle;'></span>" if is_t else ""
    ph+=f"<th style='{th}background:{bg};color:{col};'>{dot}{lbl}</th>"
ph+="</tr></thead><tbody>"

for mi,(m_lbl,m_key,m_pfx,m_dec,m_inv,m_ac) in enumerate(pulse_metrics):
    rb=f"background:{BG2};" if mi%2==1 else f"background:{BG};"
    ph+=(f"<tr><td style='{td}{rb}font-size:0.7rem;font-weight:600;color:{TX};'>"
         f"<span style='display:inline-block;width:3px;height:1em;background:{m_ac};border-radius:2px;margin-right:7px;vertical-align:middle;'></span>{m_lbl}</td>")
    for wi,(_,wd) in enumerate(pulse_windows):
        is_t=wi==0; cb="background:rgba(124,106,247,0.06);" if is_t else rb
        v=wd.get(m_key)
        if v is None or (isinstance(v,float) and np.isnan(v)): vs=f"<span style='color:#3a3a5a;'>—</span>"
        elif m_key=="ctr": vs=f"{v:.2f}%"
        elif m_dec>0: vs=f"{m_pfx}{v:,.{m_dec}f}"
        else: vs=f"{m_pfx}{int(v):,}"
        bh=""
        ci=pw_cmp.get(wi)
        if ci is not None:
            cv2=pulse_windows[ci][1].get(m_key)
            if v is not None and cv2 and cv2!=0 and not (isinstance(v,float) and np.isnan(v)):
                pct=(v-cv2)/abs(cv2)*100; good=(pct>0) if not m_inv else (pct<0)
                bc="rgba(61,232,160,0.15)" if good else "rgba(247,106,106,0.15)"
                bco=GREEN if good else RED
                bh=(f"<span style='display:inline-block;margin-left:5px;padding:1px 5px;"
                    f"border-radius:4px;font-size:0.58rem;font-weight:700;"
                    f"background:{bc};color:{bco};'>{'↑' if pct>0 else '↓'}{abs(pct):.0f}%</span>")
        vc="#d4cfff" if is_t else TX
        ph+=f"<td style='{td}{cb}color:{vc};'>{vs}{bh}</td>"
    ph+="</tr>"
ph+="</tbody></table></div>"
st.markdown(ph, unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# TREND GRAPHS: Leads, CPL, CTR, Reach
# ─────────────────────────────────────────────────────────────────────────────
section("Trends", range_label)

if not df_period.empty and "date" in df_period.columns:
    daily = df_period.groupby(df_period["date"].dt.date).agg(
        leads=("leads","sum"), spend=("spend","sum"),
        clicks=("clicks","sum"), impressions=("impressions","sum"),
        reach=("reach","sum")
    ).reset_index()
    daily.rename(columns={"date":"Date"}, inplace=True)
    daily["Date"]=pd.to_datetime(daily["Date"])
    daily["cpl"]=(daily["spend"]/daily["leads"].replace(0,np.nan)).round(0)
    daily["ctr"]=(daily["clicks"]/daily["impressions"].replace(0,np.nan)*100).round(2)

    g1,g2,g3,g4 = st.columns(4)
    with g1:
        st.caption("🎯 LEADS")
        st.bar_chart(daily.set_index("Date")["leads"], color=PURPLE, height=160)
    with g2:
        st.caption("📊 CPL (₹)")
        st.line_chart(daily.set_index("Date")["cpl"], color=YELLOW, height=160)
    with g3:
        st.caption("👆 CTR (%)")
        st.line_chart(daily.set_index("Date")["ctr"], color=GREEN, height=160)
    with g4:
        st.caption("👥 ACC. REACH")
        st.area_chart(daily.set_index("Date")["reach"], color="#9b8cff", height=160)

# ─────────────────────────────────────────────────────────────────────────────
# CAMPAIGN / ADSET / AD TABLE (3 tabs)
# ─────────────────────────────────────────────────────────────────────────────
section("Breakdown")

df_ads_all = load_ad_data()

def make_table(df_in, group_cols, label):
    if df_in.empty:
        st.caption(f"No {label} data — run daily_fetch.py to populate.")
        return
    # Filter to period
    mask = ((df_in["date"]>=pd.Timestamp(p_start)) & (df_in["date"]<=pd.Timestamp(p_end)))
    if "campaign_name" in df_in.columns: mask &= df_in["campaign_name"].isin(selected)
    df_f = df_in[mask].copy()
    if df_f.empty:
        st.caption(f"No {label} data for selected period.")
        return
    agg_d = {k:"sum" for k in ["leads","spend","clicks","impressions"] if k in df_f.columns}
    df_g  = df_f.groupby(group_cols).agg(agg_d).reset_index()
    df_g["CPL"]  = (df_g["spend"]/df_g["leads"].replace(0,np.nan)).round(0).apply(lambda x: f"₹{x:.0f}" if not pd.isna(x) else "—")
    df_g["CTR"]  = (df_g["clicks"]/df_g["impressions"].replace(0,np.nan)*100).round(2).apply(lambda x: f"{x:.2f}%")
    df_g["Spend"]= df_g["spend"].apply(lambda x: f"₹{x:,.0f}")
    df_g = df_g.sort_values("leads", ascending=False)
    show_cols = group_cols + ["leads","Spend","CTR","CPL"]
    rename = {c:c.replace("_name","").replace("_"," ").title() for c in group_cols}
    rename.update({"leads":"Leads"})
    st.dataframe(df_g[show_cols].rename(columns=rename), width="stretch", hide_index=True)

tab_camp, tab_adset, tab_ad = st.tabs(["📁 Campaign", "📂 Ad Set", "🎨 Ad"])

with tab_camp:
    # Campaign data from main df
    if not df_period.empty and "campaign_name" in df_period.columns:
        ca = df_period.groupby("campaign_name").agg(
            leads=("leads","sum"), spend=("spend","sum"),
            clicks=("clicks","sum"), impressions=("impressions","sum"),
            reach=("reach","sum")
        ).reset_index().sort_values("leads", ascending=False)
        ca["CPL"]  = (ca["spend"]/ca["leads"].replace(0,np.nan)).round(0).apply(lambda x:f"₹{x:.0f}" if not pd.isna(x) else "—")
        ca["CTR"]  = (ca["clicks"]/ca["impressions"].replace(0,np.nan)*100).round(2).apply(lambda x:f"{x:.2f}%")
        ca["Spend"]= ca["spend"].apply(lambda x:f"₹{x:,.0f}")
        ca["Reach"]= ca["reach"].apply(lambda x:f"{int(x):,}")
        # Action tag
        med_cpl = ca["leads"].median()
        def _act(row):
            if row["leads"]==0: return "⚠ review"
            if row["leads"]>=ca["leads"].quantile(0.75): return "↑ scale"
            return "— hold"
        ca["Action"]=ca.apply(_act,axis=1)
        st.dataframe(ca[["campaign_name","Reach","leads","Spend","CTR","CPL","Action"]]
                     .rename(columns={"campaign_name":"Campaign","leads":"Leads"}),
                     width="stretch", hide_index=True)
    else:
        st.caption("No campaign data for period.")

with tab_adset:
    if not df_ads_all.empty and "adset_name" in df_ads_all.columns:
        make_table(df_ads_all, ["campaign_name","adset_name"], "adset")
    else:
        st.caption("No adset data. Your ad-level CSVs may not have adset_name column yet — run daily_fetch.py --backfill to refresh.")

with tab_ad:
    if not df_ads_all.empty and "ad_name" in df_ads_all.columns:
        make_table(df_ads_all, ["campaign_name","ad_name"], "ad")
    else:
        st.caption("No ad data. Run daily_fetch.py --backfill to fetch ad-level data.")

# ─────────────────────────────────────────────────────────────────────────────
# BEST & WORST ADS
# ─────────────────────────────────────────────────────────────────────────────
section("Best & worst ads", range_label)

if not df_ads_all.empty and "ad_name" in df_ads_all.columns and "date" in df_ads_all.columns:
    _mask = ((df_ads_all["date"]>=pd.Timestamp(p_start)) & (df_ads_all["date"]<=pd.Timestamp(p_end)))
    if "campaign_name" in df_ads_all.columns: _mask &= df_ads_all["campaign_name"].isin(selected)
    aa = df_ads_all[_mask].groupby(["campaign_name","ad_name"]).agg(
        leads=("leads","sum"), spend=("spend","sum"),
        clicks=("clicks","sum"), impressions=("impressions","sum")
    ).reset_index()
    aa["cpl"]=(aa["spend"]/aa["leads"].replace(0,np.nan)).round(0)
    aa["ctr"]=(aa["clicks"]/aa["impressions"].replace(0,np.nan)*100).round(2)
    med_ad_cpl=aa["cpl"].median()
    has_leads=aa[aa["leads"]>0]

    if not has_leads.empty:
        best=has_leads.sort_values(["leads","cpl"],ascending=[False,True]).iloc[0]
        wp=aa[aa["spend"]>aa["spend"].quantile(0.25)].copy()
        wp["waste"]=wp["spend"]/(wp["leads"]+0.1)
        worst=wp.sort_values("waste",ascending=False).iloc[0]

        bc,wc=st.columns(2)
        best_why  = f"CPL ₹{best['cpl']:.0f} · CTR {best['ctr']:.2f}% · {int(best['leads']):,} leads" if not pd.isna(best['cpl']) else f"CTR {best['ctr']:.2f}% · {int(best['leads']):,} leads"
        worst_why = f"₹{worst['spend']:,.0f} spend · {int(worst['leads']):,} leads · waste score {worst.get('waste',0):.0f}" if 'waste' in worst.index else f"₹{worst['spend']:,.0f} spend · {int(worst['leads']):,} leads"
        for col,row,badge,border,why in [
            (bc, best,  "⭐ Best performing ad", GREEN, best_why),
            (wc, worst, "🔥 Bleeding money",     RED,   worst_why),
        ]:
            cpl_v=f"₹{row['cpl']:.0f}" if not pd.isna(row['cpl']) else "—"
            with col:
                st.markdown(
                    f"<div style='background:{BG};border:1px solid {BD};border-radius:10px;"
                    f"padding:1.1rem 1.3rem;border-top:3px solid {border};'>"
                    f"<div style='font-family:{MO};font-size:0.6rem;text-transform:uppercase;"
                    f"letter-spacing:0.08em;color:{border};margin-bottom:0.35rem;'>{badge}</div>"
                    f"<div style='font-size:0.9rem;font-weight:600;color:{TX};overflow:hidden;"
                    f"text-overflow:ellipsis;white-space:nowrap;margin-bottom:0.1rem;'>{row['ad_name']}</div>"
                    f"<div style='font-size:0.7rem;color:{MN};margin-bottom:0.65rem;"
                    f"overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>{row['campaign_name']}</div>"
                    f"<div style='display:flex;gap:1.5rem;flex-wrap:wrap;'>"
                    +("".join([
                        f"<div><div style='font-size:0.58rem;font-family:{MO};color:{MN};text-transform:uppercase;'>{l}</div>"
                        f"<div style='font-family:{MO};font-size:1rem;font-weight:700;color:{vc};'>{v}</div></div>"
                        for l,v,vc in [("Leads",f"{int(row['leads']):,}",border),("CPL",cpl_v,TX),
                                        ("CTR",f"{row['ctr']:.2f}%",TX),("Spend",f"₹{row['spend']:,.0f}",TX)]
                    ]))+
                    f"</div><div style='margin-top:0.6rem;padding-top:0.6rem;border-top:1px solid {BD};"
                    f"font-size:0.72rem;color:{MN};'>{why}</div></div>",
                    unsafe_allow_html=True)

        with st.expander("All ads ranked"):
            show=aa.sort_values("leads",ascending=False).copy()
            show["CPL"]=show["cpl"].apply(lambda x:f"₹{x:.0f}" if not pd.isna(x) else "—")
            show["CTR"]=show["ctr"].apply(lambda x:f"{x:.2f}%")
            show["Spend"]=show["spend"].apply(lambda x:f"₹{x:,.0f}")
            st.dataframe(show[["campaign_name","ad_name","leads","Spend","CTR","CPL"]]
                         .rename(columns={"campaign_name":"Campaign","ad_name":"Ad","leads":"Leads"}),
                         width="stretch", hide_index=True)
    else:
        st.caption("No ad-level lead data for this period.")
else:
    st.caption("No ad-level data — run `python daily_fetch.py --backfill` to fetch.")

# ─────────────────────────────────────────────────────────────────────────────
# INSIGHTS
# ─────────────────────────────────────────────────────────────────────────────
section("Insights")

insights=[]
if cpl_c and cpl_p and cpl_p>0:
    chg=(cpl_c-cpl_p)/cpl_p*100
    if   chg> 20: insights.append((RED,"rgba(247,106,106,0.07)","📈",f"**CPL up {chg:.0f}%** vs comparison period. Check creative fatigue before scaling."))
    elif chg<-15: insights.append((GREEN,"rgba(61,232,160,0.07)","📉",f"**CPL down {abs(chg):.0f}%** vs comparison. Campaigns improving — good time to scale."))
if ctr_c and ctr_p and ctr_p>0 and (ctr_c-ctr_p)/ctr_p*100<-20:
    insights.append((YELLOW,"rgba(247,201,106,0.07)","👁",f"**CTR dropped {abs((ctr_c-ctr_p)/ctr_p*100):.0f}%**. Refresh creatives on lowest-CTR campaigns."))
if "frequency" in df_period.columns and len(df_period)>0 and df_period["frequency"].mean()>3.5:
    insights.append((RED,"rgba(247,106,106,0.07)","🔁",f"**Avg frequency {df_period['frequency'].mean():.1f}x** — audience too small or creatives need refresh."))
if conv_rate>0 and conv_rate<50:
    insights.append((YELLOW,"rgba(247,201,106,0.07)","📋",f"**Lead conv. rate {conv_rate:.0f}%** — {drop_off:,} people started but didn't complete. Simplify form fields."))
if not insights:
    insights.append((GREEN,"rgba(61,232,160,0.07)","✅","**No issues detected.** All metrics healthy for this period."))

for color,bg,icon,text in insights:
    st.markdown(
        f"<div style='background:{bg};border:1px solid {BD};border-left:3px solid {color};"
        f"border-radius:8px;padding:0.9rem 1.1rem;margin-bottom:0.5rem;"
        f"display:flex;align-items:flex-start;gap:0.75rem;'>"
        f"<span style='font-size:1rem;flex-shrink:0;'>{icon}</span>"
        f"<span style='font-size:0.82rem;color:{TX};line-height:1.5;'>{text}</span>"
        f"</div>", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# DIAGNOSTICS
# ─────────────────────────────────────────────────────────────────────────────
if show_diag:
    section("Diagnostics")
    d1,d2,d3,d4=st.columns(4)
    freq_avg=float(df_period["frequency"].mean()) if "frequency" in df_period.columns and len(df_period)>0 else 0.0
    cpm_v=curr.get("cpm",0) or 0
    with d1: st.metric("IMPRESSIONS",    fmt(imp_c))
    with d2: st.metric("REACH",          fmt(reach_c))
    with d3: st.metric("CPM (₹)",        fmt(cpm_v,"₹",dec=2))
    with d4: st.metric("AVG FREQUENCY",  fmt(freq_avg,dec=2))
    with st.expander("Raw data export"):
        st.dataframe(df_period, width="stretch")
        st.download_button("Download CSV", df_period.to_csv(index=False), "meta_export.csv","text/csv")
