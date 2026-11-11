"""
Optimized High-Occupancy CSS for Academic & Engineering Whitepaper Print
Maximizes page occupancy (85-95% fill rate), eliminates artificial empty whitespace,
and formats code blocks, data tables, callouts, and prototype screenshots cleanly.
"""

def get_css() -> str:
    return """
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
      @bottom-right {
        content: counter(page);
        font-size: 8pt;
        font-weight: 600;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      @bottom-left {
        content: "MERIDIAN (PLACEFLOW) — ENTERPRISE MONGODB ARCHITECTURE & RESEARCH REPORT";
        font-size: 7pt;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #94a3b8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    }

    @page:first {
      margin: 0;
      @bottom-right { content: none; }
      @bottom-left { content: none; }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 8.8pt;
      line-height: 1.48;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4, h5 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.25;
      margin-top: 1.1em;
      margin-bottom: 0.35em;
      break-after: avoid;
      page-break-after: avoid;
    }

    h1 {
      font-size: 15.5pt;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 4px;
      margin-top: 0;
      color: #0f172a;
    }

    h2 {
      font-size: 11.5pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      color: #0369a1;
      margin-top: 1em;
    }

    h3 {
      font-size: 9.8pt;
      color: #0f172a;
      margin-top: 0.85em;
    }

    h4 {
      font-size: 8.8pt;
      color: #334155;
      margin-top: 0.7em;
    }

    p {
      margin-top: 0;
      margin-bottom: 0.55em;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 0.65em;
      padding-left: 20px;
    }

    li {
      margin-bottom: 0.25em;
      text-align: justify;
    }

    code, pre {
      font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
    }

    code {
      font-size: 7.5pt;
      background-color: #f1f5f9;
      color: #0369a1;
      padding: 1px 3.5px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background-color: #0b1120;
      color: #f8fafc;
      padding: 7px 10px;
      border-radius: 5px;
      font-size: 6.9pt;
      line-height: 1.35;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      border-left: 3.5px solid #0284c7;
      margin-top: 0.35em;
      margin-bottom: 0.65em;
      break-inside: auto;
      page-break-inside: auto;
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.45em;
      margin-bottom: 0.75em;
      font-size: 7.8pt;
      line-height: 1.35;
    }

    table, th, td {
      border: 1px solid #cbd5e1;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 4px 6px;
      font-weight: 600;
    }

    td {
      padding: 3.5px 6px;
      vertical-align: top;
      background-color: #ffffff;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .stat-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0284c7;
      border-radius: 5px;
      padding: 7px 10px;
      margin-bottom: 0.6em;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .stat-card h4 {
      margin-top: 0;
      margin-bottom: 0.25em;
      color: #0369a1;
      font-size: 8.8pt;
    }

    .stat-card p {
      margin-bottom: 0.25em;
      font-size: 8pt;
    }

    .stat-card p:last-child {
      margin-bottom: 0;
    }

    .callout {
      border-radius: 5px;
      padding: 7px 11px;
      margin-top: 0.5em;
      margin-bottom: 0.7em;
      border-left: 3.5px solid;
      font-size: 8.2pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .callout-info {
      background-color: #f0f9ff;
      border-color: #0284c7;
      color: #0369a1;
    }

    .callout-success {
      background-color: #f0fdf4;
      border-color: #16a34a;
      color: #15803d;
    }

    .callout-warning {
      background-color: #fffbeb;
      border-color: #d97706;
      color: #b45309;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-bottom: 0.6em;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 7px;
      margin-bottom: 0.6em;
    }

    .diagram-container {
      margin-top: 0.5em;
      margin-bottom: 0.75em;
      padding: 8px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .diagram-container svg {
      max-width: 100%;
      height: auto;
      max-height: 240px;
    }

    .screenshot-container {
      margin-top: 0.5em;
      margin-bottom: 0.75em;
      padding: 6px;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .screenshot-container img {
      max-width: 100%;
      height: auto;
      max-height: 230px;
      border-radius: 4px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }

    .diagram-caption {
      font-size: 7.3pt;
      color: #64748b;
      margin-top: 4px;
      font-style: italic;
      text-align: center;
    }

    .screenshot-caption {
      font-size: 7.3pt;
      color: #94a3b8;
      margin-top: 4px;
      font-style: italic;
      text-align: center;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 45mm 25mm 25mm 25mm;
      background: linear-gradient(135deg, #0b1120 0%, #0f172a 60%, #0369a1 100%);
      color: #ffffff;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: 800;
      line-height: 1.18;
      margin-bottom: 10px;
      color: #ffffff;
      border: none;
      padding: 0;
      letter-spacing: -0.02em;
    }

    .cover-subtitle {
      font-size: 11pt;
      color: #38bdf8;
      font-weight: 500;
      line-height: 1.4;
      margin-bottom: 25px;
    }

    .cover-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid #38bdf8;
      color: #e0f2fe;
      padding: 3px 9px;
      border-radius: 16px;
      font-size: 7.8pt;
      font-weight: 600;
      margin-bottom: 15px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 15px;
      font-size: 8pt;
      color: #94a3b8;
    }

    .cover-meta-item strong {
      color: #ffffff;
      display: block;
      margin-bottom: 2px;
      font-size: 8.5pt;
    }
    """

