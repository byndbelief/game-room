A row in "Your games": 80×50 thumb, title + vs, muted sub, optional progress, pill on the right; slides 3px right on hover.
```jsx
<GameRow kind="golf" title="⛳ Putt Post" vs="vs obanai_rocks" sub="Hole 7 of 18 · you lead by 2" progress={7/18} pill={<Pill tone="wait">Their turn</Pill>} />
```
- Stack in a list with 8px gap, grouped under eyebrows "Waiting on others (n)" / "Finished (n)".
