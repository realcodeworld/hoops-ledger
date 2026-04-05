# WhatsApp sender from balance reminder JSON

This folder contains a **standalone** Python script that uses **WhatsApp Web** in a browser (via [PyWhatKit](https://github.com/Ankit404butfound/PyWhatKit)) to open each chat and **paste the reminder into the message field**. You send manually (PyWhatKit does not reliably auto-send). It reads the **same JSON** Hoops Ledger puts in the balance reminder email to admins.

## JSON format

Matches `BalanceReminderPayload` in [`lib/email.ts`](../lib/email.ts):

**Single player:**

```json
{
  "phone_number": "+447700900123",
  "name": "Jane Smith",
  "message": "Hi Jane, ..."
}
```

**Bulk (array):**

```json
[
  {
    "phone_number": "+447700900123",
    "name": "Jane Smith",
    "message": "..."
  },
  {
    "phone_number": "+447700900456",
    "name": "Alex Jones",
    "message": "..."
  }
]
```

Copy the JSON from the email body (the monospace block) and save it as a `.json` file, or paste into a file.

## Phone numbers

Use **international format with country code**, e.g. UK `+44` followed by digits (spaces in the app are fine; the script normalizes to `+` plus digits). Numbers without a country code may fail or go to the wrong region.

## Setup

1. Python 3.10+ recommended.
2. Create a virtual environment (optional but recommended):

   ```bash
   cd /path/to/hoops-ledger
   python3 -m venv .venv-whatsapp
   source .venv-whatsapp/bin/activate   # Windows: .venv-whatsapp\Scripts\activate
   pip install -r scripts/requirements-whatsapp.txt
   ```

3. **Chrome/Chromium** is typically required (PyWhatKit uses it). Log in to [WhatsApp Web](https://web.whatsapp.com/) in that browser at least once so the session exists; the script may open a new tab/window to send.

## Usage

Save the JSON from the admin email to a file (e.g. `reminders.json`), then:

```bash
python scripts/whatsapp_send_reminders.py /path/to/reminders.json
```

**Dry run** (validate JSON and show who would be opened; does not open WhatsApp or require `pywhatkit`):

```bash
python scripts/whatsapp_send_reminders.py /path/to/reminders.json --dry-run
```

**Options:**

| Flag | Default | Meaning |
|------|---------|--------|
| `--dry-run` | off | Print targets only; no browser |
| `--delay` | `5` | Seconds to wait **between** each chat (after one is opened) |
| `--wait-time` | `5` | PyWhatKit’s wait before opening the chat / pasting the message |
| `--tab-close-time` | `3` | Seconds before closing the tab after compose |

## Limitations and risks

- **Not official automation.** WhatsApp may throttle, block, or change behaviour; use for low-volume, manual workflows only.
- **Not for production** bulk marketing. For reliable delivery at scale, use the **WhatsApp Business Platform API** (Meta).
- The script is **independent** of the Next.js app: no database or env from Hoops Ledger is required—only the JSON file.
- First run may require you to **scan the WhatsApp Web QR code** if not already logged in.

## Troubleshooting

- `CountryCodeException` / invalid number: ensure `phone_number` includes `+` and country code.
- Chat didn’t open or message not in the field: increase `--wait-time`; ensure WhatsApp Web works manually in Chrome; check PyWhatKit [issues](https://github.com/Ankit404butfound/PyWhatKit/issues).
