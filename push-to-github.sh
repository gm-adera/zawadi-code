#!/usr/bin/env python3
"""
Zawadi — GitHub Push Script
Pushes all project files to https://github.com/gm-adera/zawadi-code
Run: python3 push-to-github.sh YOUR_GITHUB_TOKEN
OR:  export GITHUB_TOKEN=your_token && python3 push-to-github.sh
"""

import os, sys, base64, json
import urllib.request, urllib.error

REPO = "gm-adera/zawadi-code"
BASE = os.path.dirname(os.path.abspath(__file__))
API_BASE = f"https://api.github.com/repos/{REPO}/contents"

def push_file(token, relpath, filepath):
    with open(filepath, 'rb') as f:
        content = base64.b64encode(f.read()).decode()
    
    # Check if file already exists (get SHA for update)
    sha = None
    req = urllib.request.Request(
        f"{API_BASE}/{relpath}",
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
        }
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read())
            sha = data.get("sha")
    except: pass

    payload = {"message": f"Add {relpath}", "content": content}
    if sha:
        payload["sha"] = sha

    req = urllib.request.Request(
        f"{API_BASE}/{relpath}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"token {token}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json",
        },
        method="PUT"
    )
    try:
        with urllib.request.urlopen(req) as res:
            return True, res.status
    except urllib.error.HTTPError as e:
        return False, e.read().decode()[:200]

def main():
    token = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("GITHUB_TOKEN", "")
    if not token:
        print("Usage: python3 push-to-github.sh YOUR_GITHUB_TOKEN")
        print("   or: export GITHUB_TOKEN=xxx && python3 push-to-github.sh")
        print("\nGet a token at: https://github.com/settings/tokens/new")
        print("Required scopes: repo (Full control of private repositories)")
        sys.exit(1)

    files = []
    skip = {'node_modules', '.git', '.next', '__pycache__', '.env', '.env.local'}
    for root, dirs, filenames in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in skip]
        for fn in filenames:
            if fn.endswith('.pyc'): continue
            if fn == '.env' or fn == '.env.local': continue
            fp = os.path.join(root, fn)
            relpath = fp[len(BASE)+1:]
            files.append((relpath, fp))
    files.sort()

    print(f"\n🌹 Zawadi GitHub Pusher")
    print(f"   Repo: https://github.com/{REPO}")
    print(f"   Files: {len(files)}\n")

    success = 0
    for relpath, filepath in files:
        ok, result = push_file(token, relpath, filepath)
        if ok:
            print(f"  ✅ {relpath}")
            success += 1
        else:
            print(f"  ❌ {relpath}: {result}")

    print(f"\n{'✅' if success == len(files) else '⚠️'} Pushed {success}/{len(files)} files")
    if success > 0:
        print(f"\n🚀 View your repo: https://github.com/{REPO}")
        print(f"🌐 Deploy on Vercel: https://vercel.com/new/git/external?repo-url=https://github.com/{REPO}")

if __name__ == "__main__":
    main()
