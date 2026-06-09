#!/usr/bin/env python3
"""One-off helper: merge KEY=VALUE pairs from a freshly-pulled Vercel env file
into an existing .env.local, updating matching keys in place and appending new
ones — without touching any local-only variables that aren't managed by Vercel.

Usage: python3 merge-env.py <source_file> <target_file>
"""
import re
import sys

KEY_RE = re.compile(r'^([A-Z_][A-Z0-9_]*)=')

def parse_pairs(path):
    pairs = {}
    with open(path) as f:
        for line in f:
            m = KEY_RE.match(line.strip())
            if m:
                pairs[m.group(1)] = line.rstrip("\n")
    return pairs

def main():
    src, dst = sys.argv[1], sys.argv[2]
    new_pairs = parse_pairs(src)

    with open(dst) as f:
        lines = f.read().split("\n")

    seen = set()
    updated = []
    for line in lines:
        m = KEY_RE.match(line.strip())
        if m and m.group(1) in new_pairs:
            key = m.group(1)
            updated.append(new_pairs[key])
            seen.add(key)
        else:
            updated.append(line)

    # Append any keys that weren't already present
    new_keys = [k for k in new_pairs if k not in seen]
    if new_keys:
        updated.append("")
        updated.append("# Added from Vercel (Neon integration)")
        for k in new_keys:
            updated.append(new_pairs[k])

    with open(dst, "w") as f:
        f.write("\n".join(updated))

    print(f"Updated {len(seen)} existing key(s): {', '.join(sorted(seen))}")
    if new_keys:
        print(f"Added {len(new_keys)} new key(s): {', '.join(new_keys)}")

if __name__ == "__main__":
    main()
