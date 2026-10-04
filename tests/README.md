# Checks

Run from the repository root.

```bash
# Calculator math (uses macOS's built-in JavaScriptCore; any JS shell with load() works)
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
$JSC tests/check_toolkit.js -- assets/toolkit-*.js

# Course data: structure, quiz keys, option quality, links, answer-position balance
python3 tests/validate_course.py
```
