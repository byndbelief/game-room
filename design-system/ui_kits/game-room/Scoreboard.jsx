const { StatCard: ScStat, Card: ScCard, Badge: ScBadge } = window.R4boxDesignSystem_3e3a61;

function Scoreboard({ go }) {
  const h2 = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, lineHeight: 1.1, margin: 0 };
  const big = { fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, minWidth: '1.2em', textAlign: 'center' };
  return (
    <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); go('lobby'); }} style={{ fontWeight: 700, alignSelf: 'flex-start' }}>← r4box</a>
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 40px)' }}>🏅 Family scoreboard</h1>
        <p style={{ color: 'var(--r4-muted)' }}>All-time</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', columnGap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
            <ScStat name="phoenix_lord" me streak="🔥 3" stats={[{ value: 14, label: 'wins' }, { value: 3, label: 'titles' }]} kinds={['⚓ 5', '⛳ 4', '💥 3', '🃏 2']} />
            <ScStat name="dad_commander" stats={[{ value: 11, label: 'wins' }, { value: 2, label: 'titles' }]} kinds={['⚓ 4', '⛳ 2', '💥 4', '🃏 1']} />
            <ScStat name="obanai_rocks" stats={[{ value: 9, label: 'wins' }, { value: 1, label: 'titles' }]} kinds={['⚓ 2', '⛳ 5', '💥 1', '🃏 1']} />
          </div>
          <ScCard>
            <h2 style={h2}>🏆 Trophy case</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: 10 }}>
              <ScBadge icon="🕵️" title="Sharpest eye" how="Catch 5 cheaters" got />
              <ScBadge icon="🦊" title="Sneakiest" how="Cheat 10 times, never caught" got />
              <ScBadge icon="🌀" title="Strange Attractor" how="Reach the top chaos rank" progress={.4} count="4 / 10" />
              <ScBadge icon="⛳" title="Hole in one" how="Sink a putt in one stroke" />
            </div>
          </ScCard>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <ScCard>
            <h2 style={h2}>⚔️ Head to head</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['You', 7, 5, 'dad_commander'], ['You', 6, 6, 'obanai_rocks'], ['dad_commander', 4, 3, 'obanai_rocks']].map(([a, x, y, b], i) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto 1fr', gap: 8, alignItems: 'center' }}>
                  <span style={{ textAlign: 'right' }}>{a}</span><b style={{ ...big, color: x > y ? 'var(--r4-ink)' : 'var(--r4-muted)' }}>{x}</b><span style={{ color: 'var(--r4-muted)' }}>–</span><b style={{ ...big, color: y > x ? 'var(--r4-ink)' : 'var(--r4-muted)' }}>{y}</b><span>{b}</span>
                </li>))}
            </ul>
            <p style={{ color: 'var(--r4-muted)', fontSize: 13 }}>One-on-one games, Chaos rounds included.</p>
          </ScCard>
          <ScCard>
            <h2 style={h2}>🌀 Chaos ratings</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['🌪️', '🥇 phoenix_lord 🌀 · 1480 · Edge of Chaos', 'peaks ×12 · golden cuts ×4 · 120 to Strange Attractor'], ['🌊', '🥈 dad_commander · 1210 · Doubling', 'mirrors ×9 · 90 to Edge of Chaos'], ['🌱', '🥉 obanai_rocks · 980 · Calm', 'just started']].map(([i, t, d]) => <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 26, lineHeight: 1 }}>{i}</span><span><strong>{t}</strong><br /><span style={{ color: 'var(--r4-muted)', fontSize: 13 }}>{d}</span></span></li>)}
            </ul>
          </ScCard>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Scoreboard });
