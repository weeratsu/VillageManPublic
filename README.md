# VillageManPublic

Public, read-only **Common-area Utility Report** for residents (GitHub Pages).

It shows, per billing period, how the common-area (shared-meter) electricity/water cost
was calculated and totalled - a transparency page for the housing-estate residents.
No personal data (no household names, phones, addresses) is included.

## How it works
- `index.html` + `pubreport.js` render the report.
- `villageman_data.js` holds a **snapshot** of the data: `window.VILLAGEMAN_DATA = {meters, utility_bills}`.
  Only billing data is included - never households/vendors/emergency/PromptPay.

## Updating the data each month
1. Open the **VillageMan** app on your PC.
2. Go to the **Common-area Summary** page.
3. Click **"Export for web"** -> downloads `villageman_data.js`.
4. Replace this repo's `villageman_data.js` with the downloaded file.
5. Commit & push (GitHub Desktop). GitHub Pages updates in ~1 minute.

## Notes
- Photo / invoice / receipt links are intentionally omitted here (those files live in a
  private Google Drive and cannot be opened publicly).
- Dark mode follows the viewer's system preference.
