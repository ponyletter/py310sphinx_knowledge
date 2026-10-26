"""Cross-platform CPA probe. Python 3.10+, standard library only.

Only run this script when you want to send real API requests.
No automatic retries; image mode sends the selected local image to BASE_URL.
"""
import argparse
import base64
import json
import mimetypes
import os
from pathlib import Path
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["models", "text", "vision", "generate"])
    parser.add_argument("--base-url", default="https://cpa.yourdomain.cn/v1")
    parser.add_argument("--key-file", type=Path,
                        default=Path.home() / ".config/opencode/cpa-api-key")
    parser.add_argument("--model", default="gpt-6.1-sol")
    parser.add_argument("--image", type=Path)
    parser.add_argument("--prompt")
    parser.add_argument("--output", type=Path, default=Path("generated-image.png"))
    parser.add_argument("--timeout", type=float, default=240)
    args = parser.parse_args()
    key = os.environ.get("CPA_API_KEY", "").strip()
    if not key:
        try:
            key = args.key_file.expanduser().read_text(encoding="utf-8-sig").strip()
        except OSError:
            parser.error("Set CPA_API_KEY or supply a readable --key-file.")
    if not key:
        parser.error("The API key is empty.")
    if args.mode == "vision" and not args.image:
        parser.error("vision requires --image.")
    endpoint = "/models"
    payload = None
    image_bytes = None
    if args.mode in ("text", "vision"):
        content = args.prompt or "Reply with exactly: OK"
        if args.mode == "vision":
            path = args.image.expanduser()
            mime = mimetypes.guess_type(str(path))[0]
            if mime not in ("image/png", "image/jpeg", "image/webp"):
                parser.error("Use a PNG, JPEG, or WebP image.")
            image_bytes = path.read_bytes()
            content = [
                {"type": "text", "text": args.prompt or
                 "Describe the main shape and color in this image in one sentence."},
                {"type": "image_url", "image_url": {"url":
                 "data:" + mime + ";base64," +
                 base64.b64encode(image_bytes).decode("ascii")}},
            ]
        endpoint = "/chat/completions"
        payload = {"model": args.model, "messages": [
            {"role": "user", "content": content}], "stream": False}
    elif args.mode == "generate":
        endpoint = "/images/generations"
        payload = {"model": args.model, "prompt": args.prompt or
                   "A blue circle on a white background, no text.",
                   "n": 1, "size": "1024x1024"}
    data = None if payload is None else json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    url = args.base_url.rstrip("/") + endpoint
    request = urllib.request.Request(url, data=data, headers={
        "Authorization": "Bearer " + key, "Content-Type": "application/json"})
    started = time.monotonic()
    summary = {"endpoint": endpoint, "model": args.model,
               "request_bytes": len(data or b"")}
    if image_bytes is not None:
        summary["image_bytes"] = len(image_bytes)
    try:
        with urllib.request.urlopen(request, timeout=args.timeout) as response:
            summary["status"] = response.status
            result = json.load(response)
        if args.mode == "models":
            ids = [m.get("id") for m in result.get("data", [])]
            summary["model_list_count"] = len(ids)
            summary["listed"] = {name: name in ids for name in (
                "gemini-3.8-flash-high", "gpt-6.1-sol", "gpt-image-2.5")}
        elif args.mode in ("text", "vision"):
            text = result["choices"][0]["message"].get("content")
            if not text:
                raise ValueError("HTTP success but no text content returned.")
            summary["response"] = text
        else:
            item = result["data"][0]
            if item.get("b64_json"):
                args.output.write_bytes(base64.b64decode(item["b64_json"], validate=True))
                summary["image_file"] = str(args.output.resolve())
            elif item.get("url"):
                # Do not automatically forward the API key to an image host.
                summary["image_url_returned"] = True
                summary["image_host"] = urllib.parse.urlsplit(item["url"]).hostname
                args.output.with_suffix(".url.txt").write_text(item["url"], encoding="utf-8")
                summary["url_file"] = str(args.output.with_suffix(".url.txt").resolve())
            else:
                raise ValueError("HTTP success but no image returned.")
        summary["success"] = True
    except urllib.error.HTTPError as error:
        summary.update(success=False, status=error.code,
                       error=error.read(4096).decode("utf-8", errors="replace"))
    except (OSError, ValueError, KeyError, IndexError) as error:
        summary.update(success=False, error=str(error))
    summary["seconds"] = round(time.monotonic() - started, 2)
    print(json.dumps(summary, ensure_ascii=False, indent=2).replace(key, "[REDACTED]"))
    return 0 if summary["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
