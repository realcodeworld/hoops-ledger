#!/usr/bin/env python3
"""
Open WhatsApp Web chats from Hoops Ledger balance-reminder JSON and paste each message into
the compose field (PyWhatKit does not reliably auto-send—you review and tap Send).

Expected JSON (single reminder or array), matching lib/email.ts BalanceReminderPayload:
  { "phone_number": "+44...", "name": "...", "message": "..." }
  [ { ... }, { ... } ]

Uses pywhatkit (WhatsApp Web in a browser). See README-whatsapp.md for setup and limits.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

REQUIRED_KEYS = ("phone_number", "name", "message")


def normalize_phone(raw: str) -> str:
    """Strip spaces; ensure leading + and digits only after + (E.164-style)."""
    s = raw.strip()
    if not s:
        raise ValueError("Empty phone_number")
    digits = re.sub(r"\D", "", s)
    if not digits:
        raise ValueError(f"Invalid phone_number: {raw!r}")
    return "+" + digits


def parse_payload(data: Any) -> list[dict[str, str]]:
    if isinstance(data, dict):
        items = [data]
    elif isinstance(data, list):
        items = data
    else:
        raise ValueError("JSON root must be an object or array")

    out: list[dict[str, str]] = []
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"Item {i} must be an object")
        missing = [k for k in REQUIRED_KEYS if k not in item]
        if missing:
            raise ValueError(f"Item {i} missing keys: {missing}")
        for k in REQUIRED_KEYS:
            if not isinstance(item[k], str):
                raise ValueError(f"Item {i} field {k!r} must be a string")
        out.append({k: str(item[k]) for k in REQUIRED_KEYS})
    if not out:
        raise ValueError("No reminders in JSON")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Send WhatsApp messages from Hoops Ledger reminder JSON "
            "(same format as the balance reminder email body to admins)."
        )
    )
    parser.add_argument(
        "json_file",
        type=Path,
        help="Path to JSON file (single object or array of reminders)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print recipients and exit without opening WhatsApp or importing pywhatkit",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=5.0,
        metavar="SECONDS",
        help="Seconds to wait between opening each chat (default: 5)",
    )
    parser.add_argument(
        "--wait-time",
        type=int,
        default=5,
        metavar="SECONDS",
        help="PyWhatKit wait before opening chat / pasting message (default: 5)",
    )
    parser.add_argument(
        "--tab-close-time",
        type=int,
        default=3,
        metavar="SECONDS",
        help="Seconds before closing tab after compose (default: 3)",
    )
    args = parser.parse_args()

    if not args.json_file.is_file():
        print(f"Error: file not found: {args.json_file}", file=sys.stderr)
        return 1

    try:
        raw = args.json_file.read_text(encoding="utf-8")
        data = json.loads(raw)
        items = parse_payload(data)
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    print(f"Loaded {len(items)} reminder(s).")

    if args.dry_run:
        for i, item in enumerate(items):
            try:
                phone = normalize_phone(item["phone_number"])
            except ValueError as e:
                print(f"  [{i+1}] {item.get('name', '?')}: {e}", file=sys.stderr)
                return 1
            print(f"  [{i+1}] {item['name']!r} -> {phone} ({len(item['message'])} chars)")
        print("Dry run: WhatsApp not opened.")
        return 0

    try:
        import pywhatkit as pw  # type: ignore[import-untyped]
    except ImportError:
        print(
            "Error: pywhatkit is not installed. Run:\n"
            "  pip install -r scripts/requirements-whatsapp.txt",
            file=sys.stderr,
        )
        return 1

    for i, item in enumerate(items):
        try:
            phone = normalize_phone(item["phone_number"])
        except ValueError as e:
            print(f"Error on item {i+1}: {e}", file=sys.stderr)
            return 1
        name = item["name"]
        msg = item["message"]
        print(f"\n[{i + 1}/{len(items)}] {name!r} ({phone}) — opening chat...")
        try:
            pw.sendwhatmsg_instantly(
                phone,
                msg,
                args.wait_time,
                tab_close=True,
                close_time=args.tab_close_time,
            )
        except Exception as e:
            print(f"Error: pywhatkit failed: {e}", file=sys.stderr)
            return 1
        if i < len(items) - 1 and args.delay > 0:
            print(f"Waiting {args.delay}s before next message...")
            time.sleep(args.delay)

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
