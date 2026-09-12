"""Playwright automation tools for the eDistrict Kerala clone.

Target site : https://edistrict-kerala.vercel.app/
Target form : <base_url>/?site=edistrict&page=form  (Income Certificate, Form 1A)
Flow        : Stage 1 application details -> Stage 2 document upload ->
              Stage 3 mock payment -> acknowledgement number.

Setup (agent machine / local env):
    pip install langchain-core playwright
    playwright install chromium

Usage with a LangChain agent:
    from tools import submit_income_certificate
    tools = [submit_income_certificate]
"""

from __future__ import annotations

import json
from typing import Optional

from langchain_core.tools import tool
from playwright.sync_api import sync_playwright

BASE_URL = "https://edistrict-kerala.vercel.app"

# doc keys accepted by the Stage-2 upload table (must match DOCS in src/lib/data.js)
REQUIRED_DOCS = ("ration", "income", "landtax", "basictax", "idproof")
OPTIONAL_DOCS = ("affidavit",)

# income break-up keys (Stage 1, Part-II B)
INCOME_KEYS = ("land", "salary", "business", "labour", "nri", "rent")


@tool
def submit_income_certificate(
    full_name: str,
    gender: str,
    mobile: str,
    district: str,
    address: str,
    purpose: str,
    dob: Optional[str] = None,
    guardian_name: Optional[str] = None,
    relation: str = "Self",
    taluk: Optional[str] = None,
    village: Optional[str] = None,
    pincode: Optional[str] = None,
    email: Optional[str] = None,
    aadhaar: Optional[str] = None,
    ration_card: Optional[str] = None,
    cert_language: str = "English",
    incomes: Optional[dict] = None,
    family_members: Optional[list] = None,
    documents: Optional[dict] = None,
    pay_mode: str = "UPI",
    headless: bool = True,
    base_url: str = BASE_URL,
) -> str:
    """Fill and submit the Kerala Income Certificate form (Form 1A) on the eDistrict clone site.

    Opens <base_url>/?site=edistrict&page=form in Chromium, completes all three
    stages (1. application details, 2. document upload, 3. mock Rs.15 payment)
    and returns a JSON string with ok, ack_no, applicant, total_income and fee.

    Required args:
        full_name: applicant name as per Aadhaar.
        gender: one of 'Male', 'Female', 'Other'.
        mobile: 10-digit mobile number (receives demo SMS updates).
        district: one of Thiruvananthapuram, Kollam, Pathanamthitta, Alappuzha,
            Kottayam, Idukki, Ernakulam, Thrissur, Palakkad, Malappuram,
            Kozhikode, Wayanad, Kannur, Kasaragod.
        address: full postal address.
        purpose: one of 'Scholarship / Fee Concession',
            'School / College Admission', 'Bank Loan', 'Pension',
            'Property Tax Relaxation', 'Govt Scheme / Subsidy', 'Other'.

    Optional args:
        dob: date of birth as 'YYYY-MM-DD'.
        guardian_name: father / mother / spouse name.
        relation: applicant relationship, default 'Self'.
        taluk, village, pincode, email: address extras.
        aadhaar: 12-digit Aadhaar number.
        ration_card: ration card number.
        cert_language: 'English' or 'Malayalam'.
        incomes: dict with any of land, salary, business, labour, nri, rent
            mapped to annual Rs. amounts, e.g. {"salary": 240000, "land": 30000}.
        family_members: list of dicts, each with name, relation, occupation,
            income, e.g. [{"name": "Asha", "relation": "Spouse",
            "occupation": "Teacher", "income": "120000"}].
        documents: dict mapping doc key -> local file path (.pdf/.jpg/.png).
            REQUIRED keys: ration, income, landtax, basictax, idproof.
            Optional key: affidavit.
        pay_mode: one of 'UPI', 'Net Banking', 'Debit Card', 'Credit Card',
            'Wallet', 'IMPS'. Default 'UPI'.
        headless: run Chromium headless. Default True.
        base_url: override site root (default production Vercel URL).
    """
    form_url = f"{base_url.rstrip('/')}/?site=edistrict&page=form"
    incomes = incomes or {}
    family_members = family_members or []
    documents = documents or {}

    missing = [d for d in REQUIRED_DOCS if d not in documents]
    if missing:
        return json.dumps(
            {"ok": False, "error": f"missing required document files for: {', '.join(missing)}"}
        )

    browser = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            page = browser.new_page(viewport={"width": 1366, "height": 900})
            page.set_default_timeout(15000)
            page.goto(form_url, wait_until="networkidle")

            def tid(name: str) -> str:
                return f'[data-testid="{name}"]'

            def fill_optional(name: str, value) -> None:
                if value is not None and str(value) != "":
                    page.fill(tid(name), str(value))

            page.wait_for_selector(tid("f-fullName"))

            # ---------- Stage 1 : Part-I + Part-II B ----------
            page.fill(tid("f-fullName"), full_name)
            page.select_option(tid("f-gender"), label=gender)
            fill_optional("f-dob", dob)
            fill_optional("f-guardian", guardian_name)
            page.select_option(tid("f-relation"), label=relation)
            page.fill(tid("f-address"), address)
            page.select_option(tid("f-district"), label=district)
            fill_optional("f-taluk", taluk)
            fill_optional("f-village", village)
            fill_optional("f-pincode", pincode)
            page.fill(tid("f-mobile"), mobile)
            fill_optional("f-email", email)
            fill_optional("f-aadhaar", aadhaar)
            fill_optional("f-ration", ration_card)
            page.select_option(tid("f-certLang"), label=cert_language)
            page.select_option(tid("f-purpose"), value=purpose)

            for key in INCOME_KEYS:
                if key in incomes and str(incomes[key]) != "":
                    page.fill(tid(f"f-{key}"), str(incomes[key]))

            for i, m in enumerate(family_members):
                m = m or {}
                if i > 0:
                    page.click(tid("add-member"))
                if m.get("name"):
                    page.fill(tid(f"m-name-{i}"), str(m["name"]))
                if m.get("relation"):
                    page.fill(tid(f"m-rel-{i}"), str(m["relation"]))
                if m.get("occupation"):
                    page.fill(tid(f"m-occ-{i}"), str(m["occupation"]))
                if m.get("income") not in (None, ""):
                    page.fill(tid(f"m-income-{i}"), str(m["income"]))

            page.click(tid("to-uploads"))

            # ---------- Stage 2 : uploads ----------
            page.wait_for_selector(tid("upload-ration"))
            for key, path in documents.items():
                page.set_input_files(tid(f"upload-{key}"), path)
            page.click(tid("to-payment"))

            # ---------- Stage 3 : mock payment + submit ----------
            page.click(tid(f"paymode-{pay_mode}"))
            page.check(tid("agree-terms"))
            page.click(tid("pay-submit"))

            page.wait_for_selector(tid("ack-number"))
            ack_no = (page.text_content(tid("ack-number")) or "").strip()
            total = sum(int(incomes.get(k) or 0) for k in INCOME_KEYS)

            return json.dumps(
                {
                    "ok": True,
                    "ack_no": ack_no,
                    "applicant": full_name,
                    "district": district,
                    "purpose": purpose,
                    "total_income": total,
                    "fee_paid": 15,
                    "pay_mode": pay_mode,
                }
            )
    except Exception as exc:  # noqa: BLE001 - surface any automation failure as tool output
        return json.dumps({"ok": False, "error": f"{type(exc).__name__}: {exc}"})
    finally:
        try:
            if browser is not None:
                browser.close()
        except Exception:  # noqa: BLE001, S110 - best-effort cleanup
            pass
