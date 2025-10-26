#!/usr/bin/env python3
"""
zip_to_ai_readable.py

Usage:
  python zip_to_ai_readable.py /path/to/input.zip /path/to/output.txt
Options:
  --exts ext1,ext2,...   Comma-separated extensions to keep (default: js,ts,html)
  --keep-markers         Insert a small marker line at top of each file section
  --minify               Remove most newlines (produce very compact output)
  --show-diagnosis       If no matching files found, write a diagnostic listing
"""

import argparse
import zipfile
import re
import os
import sys
from typing import List

# -----------------------
# Utilities - comment removal
# -----------------------

def remove_js_like_comments(text: str) -> str:
    """
    Remove JS/TS/C-like comments while preserving URLs like http:// or https://.
    This uses a conservative approach:
     - Remove block comments /* ... */
     - Remove line comments //... except when they are preceded by ':' (for http:)
    """
    # Normalize newlines
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove block comments /* ... */ (non-greedy)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)

    # Remove // line comments but not those that are part of a protocol (e.g., http://)
    # We remove '//' comments only when the '//' is not immediately preceded by a colon.
    text = re.sub(r'(?<!:)\s*//.*', '', text)

    return text

def remove_html_comments(text: str) -> str:
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    return text

def clean_text(text: str, ext: str) -> str:
    """
    Clean text for a file based on its extension.
    ext: lower-case extension (like 'js', 'ts', 'html')
    """
    if ext in ('js', 'ts', 'jsx', 'tsx', 'css', 'scss'):
        cleaned = remove_js_like_comments(text)
    elif ext in ('html', 'htm'):
        # For HTML we remove HTML comments, but also remove inline JS/C comments if present
        cleaned = remove_html_comments(text)
        cleaned = remove_js_like_comments(cleaned)
    else:
        # Generic cleanup
        cleaned = remove_js_like_comments(text)
    # Trim whitespace on each line and collapse consecutive blank lines to one
    lines = [ln.rstrip() for ln in cleaned.split('\n')]
    out_lines = []
    prev_blank = False
    for ln in lines:
        stripped = ln.strip()
        if stripped == '':
            if not prev_blank:
                out_lines.append('')
            prev_blank = True
        else:
            out_lines.append(stripped)
            prev_blank = False
    return '\n'.join(out_lines).strip()

# -----------------------
# Main processing
# -----------------------

def process_zip(zip_path: str, out_path: str, exts: List[str], keep_markers: bool=False, minify: bool=False, show_diag: bool=False):
    if not os.path.exists(zip_path):
        print(f"ERROR: zip file not found: {zip_path}", file=sys.stderr)
        sys.exit(2)

    sections = []
    file_count = 0
    with zipfile.ZipFile(zip_path, 'r') as z:
        names = z.namelist()
        for name in names:
            if name.endswith('/'):
                continue
            lower = name.lower()
            # Skip files with no extension
            if '.' not in lower:
                continue
            ext = lower.rsplit('.', 1)[1]
            if ext not in exts:
                continue
            try:
                raw = z.read(name)
                try:
                    text = raw.decode('utf-8')
                except:
                    text = raw.decode('latin1', errors='ignore')
            except Exception as e:
                text = f"<error reading {name}: {e}>"
            cleaned = clean_text(text, ext)
            if cleaned == '':
                cleaned = "<empty or comment-only file>"
            header = f"===== FILE: {name} ====="
            if keep_markers:
                # marker is a plain visible marker line (not code-comment); safe and obvious
                marker_line = "=== TELL_EVERY_TIME_PLACEHOLDER ==="
                section = header + "\n" + marker_line + "\n" + cleaned
            else:
                section = header + "\n" + cleaned
            if minify:
                # remove most newlines but keep file separators on their own line
                section = section.replace('\n', ' ').replace('  ', ' ')
                section = section.strip()
                section = f"{header}\n{section[len(header):].strip()}"
            sections.append(section)
            file_count += 1

    if file_count == 0:
        diag = "No matching files found in ZIP for extensions: " + ",".join(exts) + "\nZIP contents:\n" + "\n".join(names)
        if show_diag:
            with open(out_path, 'w', encoding='utf-8') as outf:
                outf.write(diag)
            print("No matching files found. Diagnostic output written to:", out_path)
            return
        else:
            print("No matching files found. Use --show-diagnosis to write a diagnostic file.", file=sys.stderr)
            sys.exit(0)

    combined = "\n\n".join(sections).strip()
    # Final minify pass if requested (collapse multiple spaces)
    if minify:
        combined = re.sub(r'\s+', ' ', combined).strip()

    with open(out_path, 'w', encoding='utf-8') as outf:
        outf.write(combined)

    print(f"Wrote {file_count} files to {out_path}")

# -----------------------
# CLI
# -----------------------

def parse_exts(s: str) -> List[str]:
    return [p.strip().lower() for p in s.split(',') if p.strip()]

def main():
    p = argparse.ArgumentParser(description="Create a compact AI-readable combined file from a ZIP, removing comments.")
    p.add_argument('zipfile', help='Path to input ZIP file')
    p.add_argument('outfile', help='Path to output text file')
    p.add_argument('--exts', default='js,ts,html', help='Comma-separated extensions to keep (default: js,ts,html)')
    p.add_argument('--keep-markers', action='store_true', help='Insert a visible placeholder marker at each file start')
    p.add_argument('--minify', action='store_true', help='Produce very compact output (fewer newlines)')
    p.add_argument('--show-diagnosis', action='store_true', help='If no matching files, write a diagnostic file listing ZIP contents')
    args = p.parse_args()

    exts = parse_exts(args.exts)
    process_zip(args.zipfile, args.outfile, exts, keep_markers=args.keep_markers, minify=args.minify, show_diag=args.show_diagnosis)

if __name__ == '__main__':
    main()
