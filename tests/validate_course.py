"""Validate content/course.json. Run from the repo root: python3 tests/validate_course.py
Exits non-zero on errors; prints warnings for things worth a human look."""
import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
course = json.loads((ROOT / 'content' / 'course.json').read_text(encoding='utf-8'))
errors, warnings = [], []
err = errors.append
warn = warnings.append

lessons, sections = course['lessons'], course['sections']
section_names = {s['name'] for s in sections}
days = [L['day'] for L in lessons]
if days != list(range(days[0], days[0] + len(days))):
    err(f'lesson day ids must be contiguous and ordered: {days}')

REQUIRED = ['day', 'title', 'category', 'duration', 'description', 'learningObjectives',
            'keyTakeaways', 'readingArticles', 'videos', 'practicalTools', 'quiz']
toolkit_ids = set(re.findall(r'id="([^"]+)"', (ROOT / 'toolkit.html').read_text(encoding='utf-8')))
positions = collections.Counter()
seen_urls = collections.defaultdict(list)

for L in lessons:
    tag = L.get('label') or f"Day {L.get('day')}"
    for k in REQUIRED:
        if k not in L:
            err(f'{tag}: missing "{k}"')
    if L.get('category') not in section_names:
        err(f'{tag}: category "{L.get("category")}" is not a sidebar section, so it would be hidden')
    for kind in ('readingArticles', 'videos'):
        for item in L.get(kind, []):
            url = item.get('url', '')
            if url.startswith('./toolkit.html'):
                frag = url.split('#', 1)[1] if '#' in url else ''
                if frag and frag not in toolkit_ids:
                    err(f'{tag}: toolkit link #{frag} has no matching id in toolkit.html')
            elif not re.match(r'^https://[^\s]+$', url):
                err(f'{tag}: bad URL "{url}"')
            else:
                seen_urls[url].append(tag)
            if not item.get('keyPoints'):
                warn(f'{tag}: "{item.get("title")}" has no key points')
    for t in L.get('practicalTools', []):
        for line in t.get('template', '').split('\n'):
            if len(line) > 80:
                warn(f'{tag}: template line longer than 80 chars ({len(line)})')
                break
    quiz = L.get('quiz', [])
    if len(quiz) != 10:
        err(f'{tag}: expected 10 quiz questions, found {len(quiz)}')
    stems = collections.Counter(q['question'].strip().lower() for q in quiz)
    for s, n in stems.items():
        if n > 1:
            err(f'{tag}: duplicate question "{s[:60]}"')
    for i, q in enumerate(quiz):
        where = f'{tag} Q{i + 1}'
        opts = q.get('options', [])
        if len(opts) != 4:
            err(f'{where}: needs 4 options')
            continue
        if len({o.strip().lower() for o in opts}) != 4:
            err(f'{where}: duplicate options')
        c = q.get('correctAnswer')
        if not isinstance(c, int) or not 0 <= c < 4:
            err(f'{where}: correctAnswer out of range')
            continue
        positions[c] += 1
        if q.get('difficulty') not in ('beginner', 'intermediate', 'advanced'):
            err(f'{where}: difficulty missing or invalid')
        if not q.get('explanation', '').strip():
            err(f'{where}: missing explanation')
        if re.search(r'\b(all|none) of the above\b', ' '.join(opts), re.I):
            warn(f'{where}: uses all/none of the above')
        lens = sorted(len(o) for o in opts)
        if len(opts[c]) == lens[-1] and len(opts[c]) > 1.5 * lens[-2]:
            warn(f'{where}: correct option is much longer than every distractor')

for url, where in seen_urls.items():
    if len(where) > 1:
        warn(f'URL used in more than one lesson ({", ".join(where)}): {url}')

total = sum(positions.values())
for p, n in sorted(positions.items()):
    if total and n / total > 0.4:
        err(f'answer position {"ABCD"[p]} holds {n / total:.0%} of correct answers (pattern a learner can exploit)')

print(f'{len(lessons)} lessons, {total} questions, correct-answer positions '
      + ', '.join(f'{"ABCD"[p]}={n}' for p, n in sorted(positions.items())))
for w in warnings:
    print('WARN ', w)
for e in errors:
    print('ERROR', e)
print('OK' if not errors else f'{len(errors)} error(s)')
sys.exit(1 if errors else 0)
