#!/usr/bin/env bash
# Verify crawlers get 200 (not 503) from prod. Exits nonzero if any bot check fails.
set -u
fail=0
for host in www.lilmagnetmemories.com lilmagnetmemories.com; do
  for ua in "Googlebot" "bingbot"; do
    code=$(curl -s -A "$ua" -o /dev/null -w '%{http_code}' --max-time 20 "https://$host/")
    echo "$ua  https://$host/  -> $code"
    [ "$code" = "200" ] || fail=1
  done
done
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://www.lilmagnetmemories.com/")
echo "normal-UA https://www.lilmagnetmemories.com/ -> $code"
[ "$fail" = "0" ] && echo "OK: crawlers healthy" || echo "FAIL: crawlers still blocked"
exit $fail
