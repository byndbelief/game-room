/* @ds-bundle: {"format":4,"namespace":"R4boxDesignSystem_3e3a61","components":[{"name":"Bifurcation","sourcePath":"components/brand/Bifurcation.jsx"},{"name":"R4Mark","sourcePath":"components/brand/R4Mark.jsx"},{"name":"BotStep","sourcePath":"components/core/BotStep.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"EnterButton","sourcePath":"components/core/EnterButton.jsx"},{"name":"Field","sourcePath":"components/core/Field.jsx"},{"name":"LiveDot","sourcePath":"components/core/LiveDot.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"Segmented","sourcePath":"components/core/Segmented.jsx"},{"name":"Status","sourcePath":"components/core/Status.jsx"},{"name":"Board","sourcePath":"components/game/Board.jsx"},{"name":"BoardCell","sourcePath":"components/game/BoardCell.jsx"},{"name":"Stamp","sourcePath":"components/game/Stamp.jsx"},{"name":"GamesDoor","sourcePath":"components/home/GamesDoor.jsx"},{"name":"HubTile","sourcePath":"components/home/HubTile.jsx"},{"name":"Avatar","sourcePath":"components/lobby/Avatar.jsx"},{"name":"GameCard","sourcePath":"components/lobby/GameCard.jsx"},{"name":"GamePreview","sourcePath":"components/lobby/GamePreview.jsx"},{"name":"GameRow","sourcePath":"components/lobby/GameRow.jsx"},{"name":"QuickEntry","sourcePath":"components/lobby/QuickEntry.jsx"},{"name":"UpCard","sourcePath":"components/lobby/UpCard.jsx"},{"name":"Badge","sourcePath":"components/stats/Badge.jsx"},{"name":"StatCard","sourcePath":"components/stats/StatCard.jsx"}],"sourceHashes":{"components/brand/Bifurcation.jsx":"452d00a2f230","components/brand/R4Mark.jsx":"8cf74c71360c","components/core/BotStep.jsx":"51028e983635","components/core/Button.jsx":"8a2de8023d4f","components/core/Card.jsx":"fb522a12ed50","components/core/Chip.jsx":"2ef2ba2d71e4","components/core/EnterButton.jsx":"d6487627494c","components/core/Field.jsx":"fd74a5e8fc38","components/core/LiveDot.jsx":"fbfa896a7edb","components/core/Pill.jsx":"5a985246c2bd","components/core/Segmented.jsx":"e89df2007c7c","components/core/Status.jsx":"c23a11e782f8","components/game/Board.jsx":"32b4eee05d89","components/game/BoardCell.jsx":"12486ec9aa70","components/game/Stamp.jsx":"6fcf89e9fae9","components/home/GamesDoor.jsx":"8e1620a85714","components/home/HubTile.jsx":"a51d5426fa59","components/lobby/Avatar.jsx":"67dc709954bf","components/lobby/GameCard.jsx":"2d02d5b06cd7","components/lobby/GamePreview.jsx":"92152eeb772a","components/lobby/GameRow.jsx":"0a6c6cf3bb04","components/lobby/QuickEntry.jsx":"f7ffda3d80f4","components/lobby/UpCard.jsx":"7fdb57093ddf","components/stats/Badge.jsx":"e957a83a3bb4","components/stats/StatCard.jsx":"21b06dfbc982","ui_kits/game-room/Battleship.jsx":"17d5a99f15ba","ui_kits/game-room/Lobby.jsx":"b21c172e8a13","ui_kits/game-room/Login.jsx":"08c605724bd7","ui_kits/game-room/Scoreboard.jsx":"dbd7c4841934","ui_kits/r4box-apps/apps-data.jsx":"4757d4a3091c","ui_kits/r4box-apps/apps-shell.jsx":"b2a602b4b6ef","ui_kits/r4box-apps/screens-a.jsx":"508352a71253","ui_kits/r4box-apps/screens-b.jsx":"1eae53791670","ui_kits/r4box-apps/tweaks-panel.jsx":"d259e3a86f73","ui_kits/r4box-home/CockpitA.jsx":"695d501bed3d","ui_kits/r4box-home/CockpitB.jsx":"37ffca1c2573","ui_kits/r4box-home/CockpitC.jsx":"ab327c04f616","ui_kits/r4box-home/FunKnock.jsx":"80f17ff6e847","ui_kits/r4box-home/FunR.jsx":"d667151665dc","ui_kits/r4box-home/FunStars.jsx":"bcb2e65f4dff","ui_kits/r4box-home/FunTree.jsx":"84a0de71d517","ui_kits/r4box-home/Home.jsx":"5e2a42848c3a","ui_kits/r4box-home/LoginA.jsx":"4e23a695ebc5","ui_kits/r4box-home/LoginB.jsx":"f399d6c70efe","ui_kits/r4box-home/LoginC.jsx":"010f4065bd13","ui_kits/r4box-home/cockpit-shared.jsx":"c5f231b8f12f","ui_kits/r4box-home/diary-tree-data.js":"77a45f0f1acf","ui_kits/r4box-home/diary-tree.js":"d39c12acd893","ui_kits/r4box-home/fun-shared.jsx":"91e9c27f10ec","ui_kits/r4box-home/login-shared.jsx":"41df6891988f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.R4boxDesignSystem_3e3a61 = window.R4boxDesignSystem_3e3a61 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Bifurcation.jsx
try { (() => {
// The bifurcation diagram of x -> r·x(1−x), r sweeping 2.5 -> 4. Algorithm and colours copied from r4box.com.
function Bifurcation({
  height = 320,
  animate = true,
  r0 = 2.5,
  r1 = 4,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const ONSET = 3.5699;
    const colour = r => r < 3 ? [61, 214, 198] : r < 3.449 ? [185, 166, 255] : r < ONSET ? [245, 197, 66] : r > 3.8284 && r < 3.857 ? [201, 255, 248] : [255, 90, 74];
    let w,
      h,
      col = 0,
      raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2),
      b = cv.getBoundingClientRect();
    w = cv.width = Math.round(b.width * dpr);
    h = cv.height = Math.round(b.height * dpr);
    const column = i => {
      const r = r0 + (r1 - r0) * (i / w),
        [cr, cg, cb] = colour(r);
      const pts = r < ONSET ? 60 : 260,
        a = r < ONSET ? .5 : .14;
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + a + ')';
      let x = .5;
      for (let k = 0; k < 300; k++) x = r * x * (1 - x);
      for (let k = 0; k < pts; k++) {
        x = r * x * (1 - x);
        ctx.fillRect(i, h * .08 + (1 - x) * h * .84, 1, 1);
      }
    };
    const frame = () => {
      const step = Math.max(2, Math.round(w / 140));
      for (let n = 0; n < step && col < w; n++) column(col++);
      if (col < w) raf = requestAnimationFrame(frame);
    };
    if (!animate) {
      while (col < w) column(col++);
    } else frame();
    return () => cancelAnimationFrame(raf);
  }, [height, animate, r0, r1]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: 'block',
      width: '100%',
      height,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Bifurcation });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Bifurcation.jsx", error: String((e && e.message) || e) }); }

// components/brand/R4Mark.jsx
try { (() => {
function R4Mark({
  size = 22,
  sub = 'r = 4',
  spin = true,
  href,
  style
}) {
  const Tag = href ? 'a' : 'span';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '-.02em',
      color: 'var(--r4-ink)',
      textDecoration: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true",
    style: {
      width: '1.05em',
      height: '1.05em',
      borderRadius: '22%',
      background: 'var(--grad-mark)',
      boxShadow: 'inset 0 0 0 .18em var(--r4-bg), 0 0 18px #3DD6C666',
      animation: spin ? 'r4-spin 18s linear infinite' : 'none',
      display: 'inline-block'
    }
  }), "r4box", sub ? /*#__PURE__*/React.createElement("small", {
    style: {
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-body)',
      fontWeight: 800,
      fontSize: '.5em',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--r4-muted)',
      alignSelf: 'flex-end',
      marginBottom: '.2em'
    }
  }, sub) : null);
}
Object.assign(__ds_scope, { R4Mark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/R4Mark.jsx", error: String((e && e.message) || e) }); }

// components/core/BotStep.jsx
try { (() => {
function BotStep({
  value = 0,
  max = 3,
  onChange,
  label = '🤖 Robots',
  style
}) {
  const on = value > 0;
  const b = {
    width: 32,
    height: 32,
    padding: 0,
    borderRadius: '50%',
    font: '800 18px/1 system-ui, sans-serif',
    border: '1.5px solid var(--r4-line)',
    background: 'var(--r4-panel)',
    color: 'var(--r4-ink)',
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("span", {
    role: "group",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 4px 3px 12px',
      borderRadius: 999,
      border: on ? '1.5px solid var(--gold)' : '1.5px dashed #ffffff33',
      background: on ? '#F2C14E22' : 'transparent',
      fontWeight: 800,
      fontSize: 14,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "One robot fewer",
    style: b,
    onClick: () => onChange && onChange(Math.max(0, value - 1))
  }, "\u2212"), /*#__PURE__*/React.createElement("b", {
    style: {
      minWidth: 20,
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "One more robot",
    style: b,
    onClick: () => onChange && onChange(Math.min(max, value + 1))
  }, "+"));
}
Object.assign(__ds_scope, { BotStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/BotStep.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const V = {
  default: {
    background: 'var(--r4-panel)',
    borderColor: 'var(--r4-line)',
    color: 'var(--r4-ink)'
  },
  primary: {
    background: 'var(--pal)',
    borderColor: 'var(--pal)',
    color: 'var(--pal-ink)',
    boxShadow: '0 8px 24px color-mix(in srgb, var(--pal) 30%, transparent)'
  },
  fire: {
    background: 'var(--hot)',
    borderColor: 'var(--hot)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 18,
    letterSpacing: '.04em',
    minHeight: 52,
    minWidth: 110
  },
  danger: {
    background: 'var(--r4-panel)',
    borderColor: 'var(--r4-line)',
    color: 'var(--hot)'
  },
  link: {
    background: 'none',
    border: 0,
    padding: 0,
    color: 'var(--teal)',
    textDecoration: 'underline'
  }
};
function Button({
  variant = 'default',
  size = 'md',
  display = false,
  disabled,
  children,
  style,
  ...rest
}) {
  const sm = size === 'sm' ? {
    padding: '6px 12px',
    fontSize: 14
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled
  }, rest, {
    style: {
      font: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      borderRadius: 12,
      border: '1.5px solid',
      padding: '10px 16px',
      fontWeight: 700,
      opacity: disabled ? .45 : 1,
      animation: variant === 'fire' && !disabled ? 'r4-ready 1s ease-in-out infinite alternate' : 'none',
      ...V[variant],
      ...(display ? {
        fontFamily: 'var(--font-display)',
        minHeight: 46,
        padding: '0 22px'
      } : {}),
      ...sm,
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  selected = false,
  as = 'section',
  children,
  style,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    style: {
      background: 'var(--r4-panel)',
      border: '1px solid var(--r4-line)',
      borderRadius: 18,
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      minWidth: 0,
      ...(selected ? {
        borderColor: 'var(--gold)',
        boxShadow: '0 0 0 2px var(--gold)'
      } : {}),
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  pressed = false,
  tone = 'teal',
  children,
  style,
  ...rest
}) {
  const on = tone === 'gold' ? {
    borderColor: 'var(--gold)',
    background: 'var(--gold)',
    color: 'var(--gold-ink)'
  } : {
    borderColor: 'var(--teal)',
    background: 'var(--water)'
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-pressed": pressed
  }, rest, {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      border: '1.5px solid var(--r4-line)',
      borderRadius: 999,
      padding: '6px 12px',
      cursor: 'pointer',
      font: 'inherit',
      fontSize: 14,
      fontWeight: 700,
      background: 'var(--r4-panel)',
      color: 'var(--r4-ink)',
      ...(pressed ? on : {}),
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/EnterButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function EnterButton({
  alt = false,
  size = 'md',
  href,
  children,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  const big = size === 'lg';
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: big ? 12 : 8,
    minHeight: 48,
    padding: big ? '16px 26px' : '10px 22px',
    borderRadius: big ? 16 : 14,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 17,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 0,
    transition: 'transform .15s, box-shadow .15s, filter .15s'
  };
  const look = alt ? {
    background: '#ffffff0e',
    color: 'var(--r4-ink)',
    border: '1px solid #ffffff22',
    fontSize: 16
  } : {
    background: 'var(--pal)',
    color: 'var(--pal-ink)',
    boxShadow: big ? h ? '0 14px 40px #3DD6C673' : '0 10px 34px #3DD6C64d' : '0 8px 24px #3DD6C633',
    transform: big && h ? 'translateY(-2px)' : 'none',
    filter: !big && h ? 'brightness(1.08)' : 'none'
  };
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false)
  }, rest, {
    style: {
      ...base,
      ...look,
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { EnterButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EnterButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      fontWeight: 700,
      fontSize: 14,
      ...style
    }
  }, label, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder
  }, rest, {
    style: {
      font: 'inherit',
      fontWeight: 400,
      fontSize: 16,
      color: 'var(--r4-ink)',
      background: 'var(--r4-bg)',
      border: '1.5px solid var(--r4-line)',
      borderRadius: 10,
      padding: '10px 12px',
      width: '100%',
      boxSizing: 'border-box'
    }
  })));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Field.jsx", error: String((e && e.message) || e) }); }

// components/core/LiveDot.jsx
try { (() => {
function LiveDot({
  off = false,
  children = 'Live',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: 'var(--r4-muted)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: off ? 'var(--r4-muted)' : 'var(--live)',
      display: 'inline-block'
    }
  }), children);
}
Object.assign(__ds_scope, { LiveDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/LiveDot.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
const T = {
  turn: {
    background: 'var(--gold)',
    color: 'var(--gold-ink)'
  },
  wait: {
    background: 'var(--r4-panel-2)',
    color: 'var(--r4-ink)'
  },
  done: {
    background: 'var(--r4-line)',
    color: 'var(--r4-ink)'
  },
  out: {
    background: 'var(--hot-soft)',
    color: 'var(--r4-ink)'
  },
  chaos: {
    background: 'var(--violet)',
    color: 'var(--violet-ink)'
  },
  streak: {
    background: 'var(--hot)',
    color: '#fff',
    fontWeight: 800
  }
};
function Pill({
  tone = 'wait',
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 999,
      padding: '2px 10px',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      ...T[tone],
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/Segmented.jsx
try { (() => {
function Segmented({
  options = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'inline-flex',
      borderRadius: 99,
      overflow: 'hidden',
      border: '1.5px solid #ffffff22',
      ...style
    }
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o,
      l = typeof o === 'object' ? o.label : o,
      on = v === value;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      type: "button",
      role: "radio",
      "aria-checked": on,
      onClick: () => onChange && onChange(v),
      style: {
        padding: '8px 12px',
        cursor: 'pointer',
        font: 'inherit',
        fontWeight: 700,
        fontSize: 14,
        border: 0,
        borderRadius: 0,
        background: on ? 'var(--gold)' : 'transparent',
        color: on ? 'var(--gold-ink)' : 'var(--r4-ink)'
      }
    }, l);
  }));
}
Object.assign(__ds_scope, { Segmented });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Segmented.jsx", error: String((e && e.message) || e) }); }

// components/core/Status.jsx
try { (() => {
function Status({
  tone = 'info',
  children,
  style
}) {
  const t = tone === 'bad' ? {
    background: 'var(--hot-soft)'
  } : tone === 'good' ? {
    background: 'var(--gold)',
    color: 'var(--gold-ink)'
  } : {
    background: 'var(--r4-panel-2)'
  };
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      borderRadius: 12,
      padding: '12px 14px',
      fontWeight: 700,
      color: 'var(--r4-ink)',
      ...t,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Status });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Status.jsx", error: String((e && e.message) || e) }); }

// components/game/BoardCell.jsx
try { (() => {
function BoardCell({
  state = 'water',
  onClick,
  style
}) {
  const base = {
    aspectRatio: '1',
    border: 0,
    padding: 0,
    borderRadius: 4,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    background: 'var(--water)',
    cursor: onClick ? 'crosshair' : 'default'
  };
  const dot = (w, bg, extra) => /*#__PURE__*/React.createElement("span", {
    style: {
      width: w,
      height: w,
      borderRadius: '50%',
      background: bg,
      ...extra
    }
  });
  let s = {},
    inner = null;
  if (state === 'ship') s = {
    background: 'linear-gradient(160deg, #7C8BA0, var(--ship) 55%, #3E4A5A)',
    boxShadow: 'inset 0 1px 0 #ffffff33'
  };
  if (state === 'miss') inner = dot('28%', 'var(--miss)', {
    boxShadow: '0 0 0 1.5px var(--r4-line)'
  });
  if (state === 'hit') {
    s = {
      background: 'var(--hot-soft)'
    };
    inner = dot('60%', 'var(--hot)', {
      boxShadow: '0 0 10px #FF7A30',
      animation: 'r4-burn .9s ease-in-out infinite alternate'
    });
  }
  if (state === 'sunk') {
    s = {
      background: 'radial-gradient(circle at 50% 60%, #FF8A3D, var(--hot) 55%, #5A1410)'
    };
    inner = /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 'clamp(10px, 2.6vw, 16px)'
      }
    }, "\u2715");
  }
  if (state === 'aim') {
    s = {
      background: 'var(--gold)'
    };
    inner = /*#__PURE__*/React.createElement("span", {
      style: {
        width: '40%',
        height: '40%',
        border: '2px solid var(--gold-ink)',
        borderRadius: '50%',
        boxSizing: 'border-box'
      }
    });
  }
  if (state === 'peek') s = {
    boxShadow: 'inset 0 0 0 2px #B37BFF, 0 0 10px #B37BFF'
  };
  const Tag = onClick ? 'button' : 'span';
  return /*#__PURE__*/React.createElement(Tag, {
    onClick: onClick,
    style: {
      ...base,
      ...s,
      ...style
    }
  }, inner);
}
Object.assign(__ds_scope, { BoardCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/BoardCell.jsx", error: String((e && e.message) || e) }); }

// components/game/Board.jsx
try { (() => {
const L = 'ABCDEFGHIJKLMNOP';
function Board({
  size = 10,
  cells = {},
  onCell,
  labels = true,
  style
}) {
  const cols = labels ? size + 1 : size;
  const lbl = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--r4-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  const out = [];
  if (labels) {
    out.push(/*#__PURE__*/React.createElement("span", {
      key: "c"
    }));
    for (let c = 0; c < size; c++) out.push(/*#__PURE__*/React.createElement("span", {
      key: 'h' + c,
      style: lbl
    }, c + 1));
  }
  for (let r = 0; r < size; r++) {
    if (labels) out.push(/*#__PURE__*/React.createElement("span", {
      key: 'r' + r,
      style: lbl
    }, L[r]));
    for (let c = 0; c < size; c++) {
      const k = L[r] + (c + 1);
      out.push(/*#__PURE__*/React.createElement(__ds_scope.BoardCell, {
        key: k,
        state: cells[k] || 'water',
        onClick: onCell ? () => onCell(k) : undefined
      }));
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))',
      gap: 2,
      width: '100%',
      maxWidth: 440,
      margin: '0 auto',
      fontVariantNumeric: 'tabular-nums',
      ...style
    }
  }, out);
}
Object.assign(__ds_scope, { Board });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Board.jsx", error: String((e && e.message) || e) }); }

// components/game/Stamp.jsx
try { (() => {
const T = {
  gold: ['#FFE08A', '#3A1D00', '#F2C230'],
  red: ['#FF6B5E', '#2A0000', '#FF5A4E'],
  blue: ['#BDE7FF', '#0A2238', '#5AB8FF'],
  purple: ['#E3CCFF', '#22103A', '#B37BFF']
};
function Stamp({
  tone = 'gold',
  animate = true,
  children,
  style
}) {
  const [c, s, g] = T[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(38px, 11vw, 88px)',
      lineHeight: .95,
      color: c,
      WebkitTextStroke: '3px ' + s,
      paintOrder: 'stroke fill',
      textShadow: '0 6px 0 ' + s + ', 0 0 40px ' + g,
      animation: animate ? 'r4-stampin 2.4s cubic-bezier(.2, 1.6, .4, 1) both' : 'none',
      textAlign: 'center',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Stamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Stamp.jsx", error: String((e && e.message) || e) }); }

// components/home/GamesDoor.jsx
try { (() => {
function GamesDoor({
  title = 'games.r4box.com',
  desc,
  go = 'Enter the room →',
  games = [],
  href = '#',
  style
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
      gap: 28,
      padding: 'clamp(22px, 4vw, 40px)',
      borderRadius: 28,
      overflow: 'hidden',
      background: 'var(--grad-door)',
      border: '1px solid ' + (h ? '#3DD6C680' : 'var(--r4-line)'),
      transform: h ? 'translateY(-2px)' : 'none',
      transition: 'border-color .2s, transform .2s',
      color: 'var(--r4-ink)',
      textDecoration: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(600px 300px at 0% 0%, #3DD6C622, transparent 60%), radial-gradient(500px 300px at 100% 100%, #FF5A4A1c, transparent 60%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px, 4vw, 40px)',
      letterSpacing: '-.03em',
      margin: '0 0 10px'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      margin: '0 0 22px'
    }
  }, desc), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: 'var(--teal)'
    }
  }, go)), /*#__PURE__*/React.createElement("ul", {
    style: {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      alignContent: 'center',
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, games.map((g, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 14,
      background: '#ffffff08',
      border: '1px solid #ffffff12',
      fontWeight: g.arcade ? 400 : 600,
      fontSize: 14,
      color: g.arcade ? 'var(--r4-muted)' : 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      lineHeight: 1
    }
  }, g.icon), g.name))));
}
Object.assign(__ds_scope, { GamesDoor });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/home/GamesDoor.jsx", error: String((e && e.message) || e) }); }

// components/home/HubTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function HubTile({
  glyph,
  title,
  desc,
  host,
  color = 'var(--violet)',
  href = '#',
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href
  }, rest, {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minHeight: 150,
      padding: 20,
      borderRadius: 20,
      background: h ? 'color-mix(in srgb, ' + color + ' 7%, var(--r4-panel))' : 'var(--r4-panel)',
      border: '1px solid ' + (h ? color : 'var(--r4-line)'),
      color: 'var(--r4-ink)',
      textDecoration: 'none',
      transition: 'border-color .2s, background .2s',
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      display: 'grid',
      placeItems: 'center',
      fontSize: 20,
      background: 'color-mix(in srgb, ' + color + ' 18%, transparent)',
      color: color,
      border: '1px solid color-mix(in srgb, ' + color + ' 35%, transparent)'
    }
  }, glyph), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17,
      letterSpacing: '-.01em'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 14,
      lineHeight: 1.45
    }
  }, desc), host ? /*#__PURE__*/React.createElement("code", {
    style: {
      marginTop: 'auto',
      font: '12px ui-monospace, Menlo, monospace',
      color: 'var(--r4-code)'
    }
  }, host) : null);
}
Object.assign(__ds_scope, { HubTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/home/HubTile.jsx", error: String((e && e.message) || e) }); }

// components/lobby/Avatar.jsx
try { (() => {
function Avatar({
  name = '',
  src,
  emoji,
  size = 34,
  online,
  style
}) {
  const s = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-grid',
    placeItems: 'center',
    overflow: 'hidden',
    flex: 'none',
    fontFamily: 'var(--font-display)',
    fontSize: Math.round(size * .47),
    background: 'var(--grad-avatar)',
    color: 'var(--r4-bg)',
    objectFit: 'cover',
    ...(emoji ? {
      fontFamily: 'inherit',
      fontSize: Math.round(size * .59),
      background: 'var(--r4-panel)',
      boxShadow: '0 0 0 1px var(--r4-line)'
    } : {}),
    ...(online === true ? {
      boxShadow: '0 0 0 2px var(--r4-bg), 0 0 0 4px #3DDC84'
    } : {}),
    ...(online === false ? {
      filter: 'grayscale(.8)',
      opacity: .55
    } : {}),
    ...style
  };
  if (src) return /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      ...s,
      background: '#000'
    }
  });
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": name,
    style: s
  }, emoji || (name[0] || '?').toUpperCase());
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lobby/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/lobby/GamePreview.jsx
try { (() => {
const ICON = {
  battleship: '⚓',
  golf: '⛳',
  duel: '💥',
  cards: '🃏',
  war: '⚔️',
  gauntlet: '🌀'
};
// Stand-in for the app's canvas-drawn live previews: the dark preview well with the game's emoji.
function GamePreview({
  kind = 'battleship',
  ratio = '16 / 10',
  radius = 0,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      aspectRatio: ratio,
      background: 'radial-gradient(120% 90% at 50% 120%, #1A1640, #0E0A24 70%)',
      borderRadius: radius,
      fontSize: 34,
      ...style
    }
  }, children || ICON[kind]);
}
Object.assign(__ds_scope, { GamePreview });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lobby/GamePreview.jsx", error: String((e && e.message) || e) }); }

// components/lobby/GameCard.jsx
try { (() => {
function GameCard({
  kind = 'battleship',
  icon,
  name,
  blurb,
  who,
  checked = false,
  onClick,
  style
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "radio",
    "aria-checked": checked,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      textAlign: 'left',
      borderRadius: 18,
      overflow: 'hidden',
      background: 'var(--r4-panel)',
      border: '2px solid ' + (checked ? 'var(--teal)' : 'var(--r4-line)'),
      color: 'var(--r4-ink)',
      font: 'inherit',
      fontWeight: 400,
      cursor: 'pointer',
      transform: h ? 'translateY(-3px)' : 'none',
      boxShadow: checked ? '0 0 0 3px #3DD6C655, 0 10px 24px #0006' : h ? '0 10px 24px #0003' : 'none',
      transition: 'transform .15s, box-shadow .15s, border-color .15s',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.GamePreview, {
    kind: kind
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '10px 12px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("strong", null, name), blurb ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, blurb) : null, who ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--violet)'
    }
  }, who) : null));
}
Object.assign(__ds_scope, { GameCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lobby/GameCard.jsx", error: String((e && e.message) || e) }); }

// components/lobby/GameRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function GameRow({
  kind = 'battleship',
  title,
  vs,
  sub,
  pill,
  progress,
  mine = false,
  over = false,
  href = '#',
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href
  }, rest, {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '80px minmax(0, 1fr) auto',
      gap: 12,
      alignItems: 'center',
      padding: '8px 12px 8px 8px',
      background: 'var(--r4-panel)',
      border: '1.5px solid ' + (mine ? 'var(--gold)' : 'var(--r4-line)'),
      borderRadius: 16,
      color: 'var(--r4-ink)',
      textDecoration: 'none',
      boxShadow: (mine ? 'inset 4px 0 0 var(--gold)' : '') + (h ? (mine ? ', ' : '') + '0 6px 16px #0002' : '') || 'none',
      transform: h ? 'translateX(3px)' : 'none',
      transition: 'transform .12s, box-shadow .12s',
      opacity: over ? .75 : 1,
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.GamePreview, {
    kind: kind,
    ratio: "auto",
    radius: 8,
    style: {
      width: 80,
      height: 50,
      fontSize: 22
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("strong", null, title), " ", vs ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, vs) : null), sub ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, sub) : null, progress != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      height: 4,
      borderRadius: 99,
      background: 'var(--r4-panel-2)',
      overflow: 'hidden',
      maxWidth: 220,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      display: 'block',
      height: '100%',
      width: Math.round(Math.max(0, Math.min(1, progress)) * 100) + '%',
      background: 'var(--teal)',
      borderRadius: 99
    }
  })) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 4
    }
  }, pill));
}
Object.assign(__ds_scope, { GameRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lobby/GameRow.jsx", error: String((e && e.message) || e) }); }

// components/lobby/QuickEntry.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function QuickEntry({
  icon,
  title,
  sub,
  href = '#',
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href
  }, rest, {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 14px',
      borderRadius: 16,
      background: 'var(--r4-panel)',
      border: '1.5px solid ' + (h ? 'var(--teal)' : 'var(--r4-line)'),
      color: 'var(--r4-ink)',
      textDecoration: 'none',
      ...style
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 44,
      height: 44,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      borderRadius: 12,
      background: '#ffffff0c',
      fontSize: 20
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("strong", null, title), sub ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, sub) : null), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: 26,
      color: 'var(--r4-muted)'
    }
  }, "\u203A"));
}
Object.assign(__ds_scope, { QuickEntry });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lobby/QuickEntry.jsx", error: String((e && e.message) || e) }); }

// components/lobby/UpCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function UpCard({
  kind = 'battleship',
  title,
  vs,
  sub,
  clock,
  cta = 'Play',
  href = '#',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href
  }, rest, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 16,
      overflow: 'hidden',
      background: 'var(--r4-panel)',
      border: '2px solid var(--gold)',
      boxShadow: '0 0 0 2px var(--gold)',
      color: 'var(--r4-ink)',
      textDecoration: 'none',
      minWidth: 0,
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.GamePreview, {
    kind: kind
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '10px 12px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("strong", null, title), vs ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, vs) : null, sub ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, sub) : null, clock ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: '#FF8A7A',
      fontWeight: 700
    }
  }, clock) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6,
      alignSelf: 'flex-start',
      background: 'var(--pal)',
      color: 'var(--pal-ink)',
      fontWeight: 700,
      borderRadius: 99,
      padding: '4px 14px',
      boxShadow: '0 8px 24px color-mix(in srgb, var(--pal) 30%, transparent)'
    }
  }, cta, " \u203A")));
}
Object.assign(__ds_scope, { UpCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lobby/UpCard.jsx", error: String((e && e.message) || e) }); }

// components/stats/Badge.jsx
try { (() => {
function Badge({
  icon,
  title,
  how,
  got = false,
  progress,
  count,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 3,
      padding: '12px 8px',
      borderRadius: 14,
      background: got ? 'linear-gradient(180deg, #3A2E10, var(--r4-panel) 70%)' : 'var(--r4-panel)',
      border: '1.5px solid ' + (got ? 'var(--gold)' : 'var(--r4-line)'),
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 34,
      lineHeight: 1.1,
      filter: got ? 'none' : 'grayscale(1)',
      opacity: got ? 1 : .35
    }
  }, icon), /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: 14,
      color: got ? 'var(--r4-ink)' : 'var(--r4-muted)'
    }
  }, title), how ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--r4-muted)'
    }
  }, how) : null, progress != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: '80%',
      height: 6,
      borderRadius: 99,
      background: 'var(--water)',
      overflow: 'hidden',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      display: 'block',
      height: '100%',
      width: Math.round(progress * 100) + '%',
      background: 'var(--teal)'
    }
  })) : null, count ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--r4-muted)',
      fontWeight: 700
    }
  }, count) : null);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/Badge.jsx", error: String((e && e.message) || e) }); }

// components/stats/StatCard.jsx
try { (() => {
function StatCard({
  name,
  me = false,
  stats = [],
  kinds = [],
  streak,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--r4-panel)',
      border: '1.5px solid ' + (me ? 'var(--gold)' : 'var(--r4-line)'),
      boxShadow: me ? '0 0 0 2px var(--gold)' : 'none',
      borderRadius: 16,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      color: 'var(--r4-ink)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: 18
    }
  }, name), streak ? /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--hot)',
      color: '#fff',
      fontWeight: 800,
      fontSize: 12,
      borderRadius: 99,
      padding: '2px 10px'
    }
  }, streak) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--teal)'
    }
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      flexWrap: 'wrap',
      alignItems: 'baseline'
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 30
    }
  }, s.value), " ", /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--r4-muted)',
      fontWeight: 700
    }
  }, s.label)))), kinds.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      fontSize: 14,
      color: 'var(--r4-muted)',
      fontWeight: 700
    }
  }, kinds.map((k, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, k))) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/StatCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game-room/Battleship.jsx
try { (() => {
const {
  Board: BsBoard,
  Button: BsButton,
  Card: BsCard,
  LiveDot: BsLive,
  Stamp: BsStamp,
  Status: BsStatus,
  Pill: BsPill
} = window.R4boxDesignSystem_3e3a61;
const bsS = {
  h2: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 19,
    lineHeight: 1.1,
    margin: 0
  },
  pdot: c => ({
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: c,
    boxShadow: '0 0 0 1.5px #fff9',
    marginRight: 5,
    verticalAlign: 'middle'
  })
};
const SHIPS = {
  B3: 1,
  B4: 1,
  B5: 1,
  B6: 1,
  F8: 1,
  G8: 1,
  H8: 1,
  D2: 1,
  E2: 1
};
const MINE = {
  A1: 'ship',
  A2: 'ship',
  A3: 'ship',
  A4: 'ship',
  A5: 'ship',
  D6: 'ship',
  E6: 'ship',
  F6: 'ship',
  H2: 'ship',
  H3: 'ship',
  I9: 'ship',
  J9: 'ship',
  C4: 'miss',
  E6x: null,
  G1: 'miss',
  D6h: null
};
MINE.D6 = 'hit';
function FleetList({
  gone = []
}) {
  const ships = [['Carrier', 5], ['Battleship', 4], ['Cruiser', 3], ['Submarine', 3], ['Destroyer', 2]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      fontSize: 13
    }
  }, ships.map(([n, l]) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      border: '1px solid var(--r4-line)',
      borderRadius: 999,
      padding: '2px 10px',
      textDecoration: gone.includes(n) ? 'line-through' : 'none',
      color: gone.includes(n) ? 'var(--r4-muted)' : 'inherit'
    }
  }, n, " \xB7 ", l)));
}
function Battleship({
  go
}) {
  const [theirs, setTheirs] = React.useState({
    D7: 'miss',
    E2: 'hit',
    C9: 'miss',
    H1: 'miss'
  });
  const [aim, setAim] = React.useState([]);
  const [stamp, setStamp] = React.useState(null);
  const [feed, setFeed] = React.useState([['dad_commander fired at C4: miss', false], ['dad_commander hit your cruiser at D6', true], ['You hit at E2', true]]);
  const [cheats, setCheats] = React.useState(2);
  const [peek, setPeek] = React.useState(false);
  const per = 3;
  const cells = {
    ...theirs
  };
  aim.forEach(k => {
    cells[k] = 'aim';
  });
  const onCell = k => {
    if (theirs[k]) return;
    if (peek) {
      const nt = {
        ...theirs
      };
      if (SHIPS[k]) nt[k] = 'peek';
      setTheirs(nt);
      setPeek(false);
      setCheats(cheats - 1);
      return;
    }
    setAim(aim.includes(k) ? aim.filter(x => x !== k) : aim.length < per ? [...aim, k] : aim);
  };
  const fire = () => {
    const nt = {
      ...theirs
    };
    let hits = 0;
    const lines = [];
    aim.forEach(k => {
      if (SHIPS[k]) {
        nt[k] = 'hit';
        hits++;
        lines.push(['You hit at ' + k, true]);
      } else {
        nt[k] = 'miss';
        lines.push(['You fired at ' + k + ': miss', false]);
      }
    });
    setTheirs(nt);
    setAim([]);
    setFeed([...lines.reverse(), ...feed]);
    setStamp(hits ? ['gold', hits > 1 ? 'DOUBLE HIT!' : 'HIT!'] : ['blue', 'SPLASH']);
    setTimeout(() => setStamp(null), 2400);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      paddingBottom: 120
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement(BsButton, {
    variant: "link",
    onClick: () => go('lobby')
  }, "\u2190 r4box"), /*#__PURE__*/React.createElement(BsLive, null)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(28px, 7vw, 40px)'
    }
  }, "Your turn"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)'
    }
  }, "Pick ", per, " squares on dad_commander's board, then fire."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      border: '1.5px solid var(--gold)',
      background: 'var(--gold)',
      color: 'var(--gold-ink)',
      borderRadius: 999,
      padding: '4px 12px',
      fontWeight: 700,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: bsS.pdot('#3DD6C6')
  }), "You"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      border: '1.5px solid var(--r4-line)',
      borderRadius: 999,
      padding: '4px 12px',
      fontWeight: 700,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: bsS.pdot('#FF5A4A')
  }), "dad_commander"))), /*#__PURE__*/React.createElement("section", {
    style: {
      border: '1.5px dashed #D8403A99',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      background: 'color-mix(in srgb, var(--hot-soft) 45%, var(--r4-panel))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...bsS.h2,
      color: 'var(--hot)'
    }
  }, "Cheat (if you dare)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, '🃏'.repeat(cheats) || '—', " ", cheats, " left this game")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(BsButton, {
    disabled: !cheats,
    "aria-pressed": peek,
    onClick: () => setPeek(!peek),
    style: peek ? {
      borderColor: '#B37BFF',
      boxShadow: '0 0 0 2px #B37BFF55'
    } : {}
  }, "\uD83D\uDC40 Peek"), /*#__PURE__*/React.createElement(BsButton, {
    disabled: !cheats
  }, "\u2795 Extra shot"), /*#__PURE__*/React.createElement(BsButton, {
    disabled: !cheats
  }, "\uD83D\uDEA2 Sneak a ship away")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, peek ? 'Tap any square on an opponent’s board to spy on the 3×3 patch around it.' : 'Anyone can call cheater after your turn. Caught: you lose your next turn.')), peek ? /*#__PURE__*/React.createElement(BsStatus, null, "\uD83D\uDC40 Tap a square on an opponent's board to peek.") : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(BsCard, {
    selected: aim.length > 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: bsS.h2
  }, /*#__PURE__*/React.createElement("i", {
    style: bsS.pdot('#FF5A4A')
  }), "dad_commander's waters")), /*#__PURE__*/React.createElement(BsBoard, {
    cells: cells,
    onCell: onCell
  }), /*#__PURE__*/React.createElement(FleetList, null)), /*#__PURE__*/React.createElement(BsCard, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: bsS.h2
  }, "Your fleet")), /*#__PURE__*/React.createElement(BsBoard, {
    cells: MINE
  }), /*#__PURE__*/React.createElement(FleetList, null), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, "Yellow outlines mark the latest shots."))), /*#__PURE__*/React.createElement(BsCard, null, /*#__PURE__*/React.createElement("h2", {
    style: bsS.h2
  }, "Latest shots"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontSize: 14
    }
  }, feed.slice(0, 6).map(([t, h], i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      borderLeft: '3px solid ' + (h ? 'var(--hot)' : 'var(--r4-line)'),
      paddingLeft: 10
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 16,
      width: 'min(900px, calc(100vw - 48px))',
      zIndex: 5,
      background: 'var(--r4-panel)',
      border: '1px solid var(--r4-line)',
      borderRadius: 18,
      boxShadow: '0 14px 34px #0003',
      padding: '12px 18px',
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, Array.from({
    length: per
  }).map((_, i) => /*#__PURE__*/React.createElement("i", {
    key: i,
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      border: '2px solid var(--hot)',
      background: i < aim.length ? 'var(--hot)' : 'transparent'
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, aim.length ? 'Aiming at ' + aim.join(', ') : 'Tap ' + per + ' squares to aim')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--r4-muted)',
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, "\uD83C\uDF92 ", /*#__PURE__*/React.createElement(BsButton, {
    size: "sm"
  }, "\uD83D\uDCE1 Sonar Ping"), /*#__PURE__*/React.createElement(BsButton, {
    size: "sm"
  }, "\uD83C\uDF86 Double Salvo")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, aim.length ? /*#__PURE__*/React.createElement(BsButton, {
    variant: "link",
    onClick: () => setAim([])
  }, "Clear") : null, /*#__PURE__*/React.createElement(BsButton, {
    variant: "fire",
    disabled: aim.length < per,
    onClick: fire
  }, "Fire!"))), stamp ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 45,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement(BsStamp, {
    tone: stamp[0]
  }, stamp[1])) : null);
}
Object.assign(window, {
  Battleship
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game-room/Battleship.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game-room/Lobby.jsx
try { (() => {
const {
  R4Mark,
  Avatar,
  Bifurcation,
  EnterButton,
  Chip,
  BotStep,
  Segmented,
  UpCard,
  QuickEntry,
  GameRow,
  Pill,
  Card,
  LiveDot,
  GameCard
} = window.R4boxDesignSystem_3e3a61;
const lobbyS = {
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--violet)'
  },
  h2: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 19,
    lineHeight: 1.1,
    letterSpacing: '-.01em',
    margin: 0
  },
  muted: {
    color: 'var(--r4-muted)',
    fontSize: 13
  }
};
function HereNow() {
  const fam = [['phoenix_lord', true, '../../assets/avatars/phoenix_lord.jpg'], ['dad_commander', true], ['obanai_rocks', false]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: 'center',
      fontSize: 12,
      fontWeight: 800,
      color: 'var(--r4-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#3DDC84',
      marginRight: 6,
      boxShadow: '0 0 0 3px #3DDC8433',
      animation: 'r4-pulse 1.8s ease-in-out infinite'
    }
  }), "Here now"), fam.map(([n, on, src]) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      minWidth: 46
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    src: src,
    online: on
  }), /*#__PURE__*/React.createElement("small", {
    style: {
      fontSize: 11,
      lineHeight: 1.1,
      color: on ? '#3DDC84' : 'var(--r4-muted)',
      fontWeight: on ? 800 : 400
    }
  }, n === 'phoenix_lord' ? 'You' : n))));
}
function BoxHero() {
  const [open, setOpen] = React.useState(false);
  const [opp, setOpp] = React.useState({
    dad_commander: true
  });
  const [bots, setBots] = React.useState(0);
  const [rounds, setRounds] = React.useState(5);
  const any = Object.values(opp).some(Boolean) || bots > 0;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      background: 'var(--grad-box)',
      border: '1px solid var(--r4-line)',
      boxShadow: 'var(--shadow-hero)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: 1.5,
      pointerEvents: 'none',
      background: 'var(--grad-hero-border)',
      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 16,
      overflow: 'hidden',
      background: '#0B0918',
      boxShadow: '0 0 0 1px #ffffff12, 0 10px 30px #0008',
      aspectRatio: '12 / 5',
      maxHeight: 320
    }
  }, /*#__PURE__*/React.createElement(Bifurcation, {
    height: '100%'
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lobbyS.eyebrow
  }, "The Box \xB7 chaos \xB7 symmetry \xB7 fractals \xB7 fibonacci"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...lobbyS.h2,
      fontSize: 'clamp(22px, 5vw, 30px)',
      margin: '4px 0 0'
    }
  }, "Route to Chaos"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...lobbyS.muted,
      margin: '4px 0 10px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "This is Fig's mind."), " Every game here runs on one curve, x \u2192 r\xB7x\xB7(1\u2212x): its mood. A Chaos is rounds of the games against your rivals, wilder as r climbs; win the most rounds for the crown, and the next Chaos starts on its own. The games are won by playing Chaos."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(EnterButton, {
    onClick: () => setOpen(true)
  }, "Enter Chaos \uD83C\uDF00"), /*#__PURE__*/React.createElement(EnterButton, {
    alt: true
  }, "\uD83E\uDDEC Solo run")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
      padding: '6px 14px 6px 6px',
      borderRadius: 99,
      background: '#ffffff0a',
      border: '1px solid #ffffff18',
      color: 'var(--r4-ink)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      fontSize: 22,
      background: 'radial-gradient(circle at 50% 60%, #1C1640, #0B0918 75%)'
    }
  }, "\uD83D\uDFE2"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, "Fig"), /*#__PURE__*/React.createElement("small", {
    style: {
      fontSize: 12,
      color: 'var(--r4-muted)'
    }
  }, "lives here \xB7 meet its four personalities \u203A"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 14,
      background: '#ffffff08',
      border: '1px solid #ffffff10'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: 'none',
      border: 0,
      cursor: 'pointer',
      fontWeight: 800,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      fontSize: 12,
      color: 'var(--violet)',
      font: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      letterSpacing: '.08em',
      fontSize: 12
    }
  }, "\u2795 Start a rivalry"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      lineHeight: 1,
      transform: open ? 'rotate(90deg)' : 'none',
      transition: 'transform .2s',
      color: 'var(--r4-ink)'
    }
  }, "\u203A")), open ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '0 12px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, ['dad_commander', 'obanai_rocks'].map(n => /*#__PURE__*/React.createElement(Chip, {
    key: n,
    tone: "gold",
    pressed: !!opp[n],
    onClick: () => setOpp({
      ...opp,
      [n]: !opp[n]
    }),
    style: opp[n] ? {} : {
      background: '#ffffff0c',
      borderColor: '#ffffff22'
    }
  }, n)), /*#__PURE__*/React.createElement(BotStep, {
    value: bots,
    max: 3,
    onChange: setBots
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    options: [3, 5, 7].map(r => ({
      value: r,
      label: r + ' rounds'
    })),
    value: rounds,
    onChange: setRounds
  }), /*#__PURE__*/React.createElement("button", {
    disabled: !any,
    style: {
      marginLeft: 'auto',
      minHeight: 46,
      padding: '0 22px',
      borderRadius: 99,
      border: 0,
      background: 'linear-gradient(180deg, #FFD77A, #F5C542)',
      color: 'var(--gold-ink)',
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      boxShadow: '0 8px 22px #F5C54233',
      cursor: 'pointer',
      opacity: any ? 1 : .5
    }
  }, "Start \uD83C\uDFC6"))) : null));
}
function YourMove({
  onOpen
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: lobbyS.h2
  }, "Your move ", /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-grid',
      placeItems: 'center',
      minWidth: '1.6em',
      height: '1.6em',
      padding: '0 .4em',
      borderRadius: 99,
      background: 'var(--gold)',
      color: 'var(--gold-ink)',
      font: '700 .7em/1 var(--font-body)',
      verticalAlign: 'middle'
    }
  }, "2"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'min(46%, 300px)',
      gap: 12,
      overflowX: 'auto',
      padding: '4px 2px 10px'
    }
  }, /*#__PURE__*/React.createElement(UpCard, {
    kind: "battleship",
    title: "\u2693 Battleship",
    vs: "vs dad_commander, admiral_bot",
    sub: "3 shots per turn \xB7 \uD83C\uDF0A shared ocean",
    clock: "Chaos in 3h",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpen('battleship');
    }
  }), /*#__PURE__*/React.createElement(UpCard, {
    kind: "golf",
    title: "\u26F3 Putt Post",
    vs: "vs obanai_rocks",
    sub: "Hole 7 of 18 \xB7 you lead by 2",
    clock: "Chaos in 9h"
  })));
}
function SideRail({
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(QuickEntry, {
    icon: "\uD83C\uDFC5",
    title: "Family scoreboard",
    sub: "All-time titles, wins, streaks and bragging rights",
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('stats');
    }
  }), /*#__PURE__*/React.createElement(QuickEntry, {
    icon: "\uD83C\uDFA8",
    title: "Design Studio",
    sub: "Fig's four personalities, live: poke them"
  }), /*#__PURE__*/React.createElement(QuickEntry, {
    icon: "\uD83C\uDFAF",
    title: "Practice",
    sub: "One game on its own, off the Route to Chaos: it still feeds your chaos rating",
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('quick');
    }
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: lobbyS.h2
  }, "Your games"), /*#__PURE__*/React.createElement(LiveDot, null)), /*#__PURE__*/React.createElement("span", {
    style: lobbyS.eyebrow
  }, "Waiting on others (2)"), /*#__PURE__*/React.createElement(GameRow, {
    kind: "duel",
    title: "\uD83D\uDCA5 Hilltop Duel",
    vs: "vs phoenix_lord",
    sub: "dad_commander's turn \xB7 wind 4 \u2192",
    pill: /*#__PURE__*/React.createElement(Pill, {
      tone: "wait"
    }, "Their turn")
  }), /*#__PURE__*/React.createElement(GameRow, {
    kind: "cards",
    title: "\uD83C\uDCCF Chaos Cards",
    vs: "vs obanai_rocks, admiral_bot",
    sub: "You hold 3 cards",
    pill: /*#__PURE__*/React.createElement(Pill, {
      tone: "chaos"
    }, "Round 2 of 5: \uD83C\uDCCF"),
    progress: .4
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...lobbyS.eyebrow,
      marginTop: 6
    }
  }, "Finished (1)"), /*#__PURE__*/React.createElement(GameRow, {
    over: true,
    kind: "war",
    title: "\u2694\uFE0F War",
    vs: "vs dad_commander",
    sub: "\uD83D\uDC51 You won",
    pill: /*#__PURE__*/React.createElement(Pill, {
      tone: "done"
    }, "Over")
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h2", {
    style: lobbyS.h2
  }, "\uD83C\uDF92 Backpack"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['📡', 'Sonar Ping', 'Battleship: ping a 3×3 patch'], ['🏌️', 'Golden Tee', 'Putt Post: a perfect first stroke'], ['📜', 'Curse Scroll', 'Hex anyone, from the lobby']].map(([i, n, d]) => /*#__PURE__*/React.createElement("li", {
    key: n,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      lineHeight: 1
    }
  }, i), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, n), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: lobbyS.muted
  }, d)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h2", {
    style: lobbyS.h2
  }, "\uD83C\uDF00 Chaos"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['☄️', 'Meteor shower', 'hit Hilltop Duel: three craters in the hills', true], ['📜', 'dad_commander cursed you', 'in Putt Post: next hole is foggy'], ['🎆', 'You found a Double Salvo', 'for sinking a cruiser']].map(([i, n, d, nw]) => /*#__PURE__*/React.createElement("li", {
    key: n,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      fontWeight: nw ? 700 : 400
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      lineHeight: 1,
      filter: nw ? 'drop-shadow(0 0 6px #F2C230)' : 'none'
    }
  }, i), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, n), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      ...lobbyS.muted,
      fontWeight: 400
    }
  }, d)))))));
}
function Lobby({
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      width: '100%',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 380px',
      columnGap: 28,
      rowGap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      gridColumn: '1 / -1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 10,
      paddingBottom: 6,
      borderBottom: '1px solid var(--r4-line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement(R4Mark, null), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(22px, 5.5vw, 34px)',
      margin: '6px 0 6px'
    }
  }, "Ready to get wild, phoenix_lord?")), /*#__PURE__*/React.createElement(HereNow, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(BoxHero, null), /*#__PURE__*/React.createElement(YourMove, {
    onOpen: () => go('battleship')
  })), /*#__PURE__*/React.createElement(SideRail, {
    go: go
  }));
}
const KINDS = [['battleship', '⚓ Battleship', 'Hide your fleet, hunt theirs. Peeking is allowed.', '2–3 players'], ['golf', '⛳ Putt Post', '🧘 Calm within the chaos: 18 wild holes, sneak attacks and mulligans.', 'Solo or up to 4 · 🧘 calm'], ['duel', '💥 Hilltop Duel', '🧘 Calm within the chaos: tanks on hills. Mind the wind. Up to 4 in a free-for-all.', '2–4 players · 🧘 calm'], ['cards', '🃏 Chaos Cards', '🧘 Calm within the chaos: match colours, dump your hand. Chaos cards and card storms.', '2–4 players · 🧘 calm'], ['war', '⚔️ War', 'Flip, flip, WAR! Highest card takes the lot. Pure chaos, no mercy.', '2–4 players']];
function Practice({
  go
}) {
  const [k, setK] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('lobby');
    },
    style: {
      fontWeight: 700
    }
  }, "\u2190 r4box"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(28px, 7vw, 40px)'
    }
  }, "Practice"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)'
    }
  }, "One game on its own, off the Route to Chaos. One of each kind per group of players at a time. It still counts toward your chaos rating.")), /*#__PURE__*/React.createElement("h2", {
    style: lobbyS.h2
  }, "Pick a game"), /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
      gap: 12
    }
  }, KINDS.map(([kind, n, b, w]) => /*#__PURE__*/React.createElement(GameCard, {
    key: kind,
    kind: kind,
    name: n,
    blurb: b,
    who: w,
    checked: k === kind,
    onClick: () => setK(kind)
  }))));
}
Object.assign(window, {
  Lobby,
  Practice
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game-room/Lobby.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game-room/Login.jsx
try { (() => {
const {
  R4Mark: LgMark,
  Card: LgCard,
  Field: LgField,
  Button: LgButton
} = window.R4boxDesignSystem_3e3a61;
function Login({
  onIn
}) {
  const [u, setU] = React.useState('phoenix_lord');
  const [p, setP] = React.useState('');
  const [err, setErr] = React.useState('');
  const submit = e => {
    e.preventDefault();
    if (!p) {
      setErr(`That username and password don't match (tried ${u}@players.r4box.com). Check the spelling and try again.`);
      return;
    }
    onIn();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(LgMark, null), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(28px, 7vw, 40px)'
    }
  }, "Game on"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)'
    }
  }, "Sign in with your player name to jump into the Route to Chaos.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '120px minmax(0, 1fr)',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 120,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      fontSize: 54,
      background: 'radial-gradient(circle at 50% 60%, #1C1640, #0B0918 75%)',
      boxShadow: '0 0 40px #3DD6C633'
    },
    "aria-hidden": "true"
  }, "\uD83D\uDFE2"), /*#__PURE__*/React.createElement("p", {
    style: {
      position: 'relative',
      padding: '12px 16px',
      borderRadius: 16,
      background: 'var(--r4-panel)',
      border: '1px solid var(--r4-line)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: -8,
      top: '50%',
      width: 14,
      height: 14,
      background: 'var(--r4-panel)',
      borderLeft: '1px solid var(--r4-line)',
      borderBottom: '1px solid var(--r4-line)',
      transform: 'translateY(-50%) rotate(45deg)'
    }
  }), "Hi, I'm Fig. I live in r4box. Four personalities, one curve: come and see.")), /*#__PURE__*/React.createElement(LgCard, {
    as: "form",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement(LgField, {
    label: "Username",
    value: u,
    onChange: e => setU(e.target.value),
    autoComplete: "username"
  }), /*#__PURE__*/React.createElement(LgField, {
    label: "Password",
    type: "password",
    value: p,
    onChange: e => setP(e.target.value),
    placeholder: "any password works here"
  }), err ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--hot)',
      fontWeight: 700
    }
  }, err) : null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(LgButton, {
    type: "submit",
    variant: "primary",
    display: true,
    style: {
      background: 'var(--teal)',
      borderColor: 'var(--teal)',
      color: 'var(--teal-ink)'
    }
  }, "Sign in"))));
}
Object.assign(window, {
  Login
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game-room/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game-room/Scoreboard.jsx
try { (() => {
const {
  StatCard: ScStat,
  Card: ScCard,
  Badge: ScBadge
} = window.R4boxDesignSystem_3e3a61;
function Scoreboard({
  go
}) {
  const h2 = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 19,
    lineHeight: 1.1,
    margin: 0
  };
  const big = {
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 22,
    minWidth: '1.2em',
    textAlign: 'center'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('lobby');
    },
    style: {
      fontWeight: 700,
      alignSelf: 'flex-start'
    }
  }, "\u2190 r4box"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(28px, 7vw, 40px)'
    }
  }, "\uD83C\uDFC5 Family scoreboard"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)'
    }
  }, "All-time")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 400px',
      columnGap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(ScStat, {
    name: "phoenix_lord",
    me: true,
    streak: "\uD83D\uDD25 3",
    stats: [{
      value: 14,
      label: 'wins'
    }, {
      value: 3,
      label: 'titles'
    }],
    kinds: ['⚓ 5', '⛳ 4', '💥 3', '🃏 2']
  }), /*#__PURE__*/React.createElement(ScStat, {
    name: "dad_commander",
    stats: [{
      value: 11,
      label: 'wins'
    }, {
      value: 2,
      label: 'titles'
    }],
    kinds: ['⚓ 4', '⛳ 2', '💥 4', '🃏 1']
  }), /*#__PURE__*/React.createElement(ScStat, {
    name: "obanai_rocks",
    stats: [{
      value: 9,
      label: 'wins'
    }, {
      value: 1,
      label: 'titles'
    }],
    kinds: ['⚓ 2', '⛳ 5', '💥 1', '🃏 1']
  })), /*#__PURE__*/React.createElement(ScCard, null, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "\uD83C\uDFC6 Trophy case"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ScBadge, {
    icon: "\uD83D\uDD75\uFE0F",
    title: "Sharpest eye",
    how: "Catch 5 cheaters",
    got: true
  }), /*#__PURE__*/React.createElement(ScBadge, {
    icon: "\uD83E\uDD8A",
    title: "Sneakiest",
    how: "Cheat 10 times, never caught",
    got: true
  }), /*#__PURE__*/React.createElement(ScBadge, {
    icon: "\uD83C\uDF00",
    title: "Strange Attractor",
    how: "Reach the top chaos rank",
    progress: .4,
    count: "4 / 10"
  }), /*#__PURE__*/React.createElement(ScBadge, {
    icon: "\u26F3",
    title: "Hole in one",
    how: "Sink a putt in one stroke"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(ScCard, null, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "\u2694\uFE0F Head to head"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['You', 7, 5, 'dad_commander'], ['You', 6, 6, 'obanai_rocks'], ['dad_commander', 4, 3, 'obanai_rocks']].map(([a, x, y, b], i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto 1fr',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, a), /*#__PURE__*/React.createElement("b", {
    style: {
      ...big,
      color: x > y ? 'var(--r4-ink)' : 'var(--r4-muted)'
    }
  }, x), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)'
    }
  }, "\u2013"), /*#__PURE__*/React.createElement("b", {
    style: {
      ...big,
      color: y > x ? 'var(--r4-ink)' : 'var(--r4-muted)'
    }
  }, y), /*#__PURE__*/React.createElement("span", null, b)))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, "One-on-one games, Chaos rounds included.")), /*#__PURE__*/React.createElement(ScCard, null, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "\uD83C\uDF00 Chaos ratings"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['🌪️', '🥇 phoenix_lord 🌀 · 1480 · Edge of Chaos', 'peaks ×12 · golden cuts ×4 · 120 to Strange Attractor'], ['🌊', '🥈 dad_commander · 1210 · Doubling', 'mirrors ×9 · 90 to Edge of Chaos'], ['🌱', '🥉 obanai_rocks · 980 · Calm', 'just started']].map(([i, t, d]) => /*#__PURE__*/React.createElement("li", {
    key: t,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      lineHeight: 1
    }
  }, i), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, t), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, d)))))))));
}
Object.assign(window, {
  Scoreboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game-room/Scoreboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-apps/apps-data.jsx
try { (() => {
// Shared data + skins for the r4box apps restyle. Content mirrors byndbelief/r4os static/*.html
// (os, activity, approvals, term) and byndbelief/clearing (diary); code/browser/ntfy are the
// services r4os wires up (code-server, noVNC live view, ntfy r4-* topics).
const AP = window.R4boxDesignSystem_3e3a61;
const apApps = [{
  k: 'os',
  g: '◎',
  c: 'var(--teal)',
  name: 'os'
}, {
  k: 'diary',
  g: '✎',
  c: 'var(--gold)',
  name: 'diary'
}, {
  k: 'term',
  g: '›_',
  c: 'var(--mint)',
  name: 'term'
}, {
  k: 'code',
  g: '{ }',
  c: 'var(--violet)',
  name: 'code'
}, {
  k: 'browser',
  g: '◫',
  c: 'var(--hot)',
  name: 'browser'
}, {
  k: 'ntfy',
  g: '◉',
  c: 'var(--gold)',
  name: 'ntfy'
}];
const apProjects = [{
  name: 'leanbrokers',
  path: '~/projects/leanbrokers',
  branch: 'main',
  dirty: 3
}, {
  name: 'leanhealth',
  path: '~/projects/leanhealth',
  branch: 'main',
  dirty: 0
}, {
  name: 'clearing',
  path: '~/projects/clearing',
  branch: 'master',
  dirty: 1
}, {
  name: 'r4os',
  path: '~/projects/r4os',
  branch: 'main',
  dirty: 0
}, {
  name: 'game-room',
  path: '~/projects/game-room',
  branch: 'main',
  dirty: 2
}];
const apSessions = [{
  name: 'leanbrokers',
  cmd: 'claude',
  cwd: '~/projects/leanbrokers',
  ago: '2m ago',
  on: true,
  state: 'working',
  now: 'Editing pricing.php'
}, {
  name: 'clearing',
  cmd: 'claude',
  cwd: '~/projects/clearing',
  ago: '14m ago',
  on: false,
  state: 'your turn',
  now: 'Asked: keep the rollup at 23:30?'
}, {
  name: 'r4os',
  cmd: 'bash',
  cwd: '~/projects/r4os',
  ago: '1h ago',
  on: false,
  state: 'idle',
  now: ''
}];
const apPending = {
  what: 'Click "Place order" on leanbrokers.com',
  who: 'r4-browser-mcp',
  left: 4
};
const apIdeas = [{
  title: 'LeanBrokers 2.0 launch',
  stage: 'ship',
  last: '2d'
}, {
  title: 'r4os agent payments',
  stage: 'branch',
  last: '3d'
}, {
  title: 'Session panel',
  stage: 'deepen',
  last: '5d'
}, {
  title: 'Family Battleship',
  stage: 'ship',
  last: '8d'
}, {
  title: 'Dynamic UI',
  stage: 'spark',
  last: '30d',
  parked: true
}];
const apStageCol = {
  spark: 'var(--violet)',
  branch: 'var(--hot)',
  pivot: 'var(--hot)',
  deepen: 'var(--teal)',
  ship: 'var(--gold)'
};
const apNotes = [{
  t: 'Approve?',
  b: 'Pay with card "Ops Visa" on leanbrokers.com',
  ago: 'now',
  topic: 'r4-alerts',
  approve: true,
  c: 'var(--gold)'
}, {
  t: 'clearing needs you',
  b: 'Claude is waiting for an answer in tmux session clearing.',
  ago: '14m',
  topic: 'r4-alerts',
  c: 'var(--teal)'
}, {
  t: 'leanbrokers finished',
  b: 'Stop: pricing page updated, 3 files changed.',
  ago: '41m',
  topic: 'r4-alerts',
  c: 'var(--teal)'
}, {
  t: 'Clearing rollup',
  b: 'Nightly write-up for Oct 16 is in the diary.',
  ago: '23:30',
  topic: 'r4-diary',
  c: 'var(--violet)'
}];
const apSteps = [['◫', 'Opened leanbrokers.com/pricing', '1m'], ['⌨', 'Typed in "Company name"', '1m'], ['◎', 'Asked to click "Place order"', 'now']];
const apTerm = [['dim', '~/projects/leanbrokers (main) $ claude'], ['ink', '● Reading pricing.php'], ['ink', '● Editing pricing.php (+18 −6)'], ['teal', '✓ Tests passed: 42'], ['ink', '● Running php -l pricing.php'], ['dim', 'No syntax errors detected'], ['gold', '? Commit these changes? (y/n)']];
// Two skins: A Soft (rounded panels, display headings, bottom dock) · B Console (hairlines, mono labels, top strip)
const apSkins = {
  A: {
    id: 'A',
    r: 20,
    rIn: 14,
    pad: '14px 16px',
    panel: {
      background: 'var(--r4-panel)',
      border: '1px solid var(--r4-line)',
      borderRadius: 20,
      overflow: 'hidden'
    },
    h1: {
      font: '800 28px/1 var(--font-display)',
      letterSpacing: '-.035em',
      margin: 0
    },
    eyebrow: {
      font: '800 11px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--r4-muted)',
      margin: '0 0 10px 4px'
    },
    rowLine: '1px solid var(--r4-line)',
    accent: 'var(--teal)',
    accentInk: 'var(--teal-ink)',
    nav: 'dock',
    btnR: 12
  },
  B: {
    id: 'B',
    r: 8,
    rIn: 6,
    pad: '11px 2px',
    panel: {
      borderTop: '1px solid var(--r4-line)',
      borderBottom: '1px solid var(--r4-line)'
    },
    h1: {
      font: '600 13px/1 var(--font-mono)',
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      margin: 0,
      color: 'var(--r4-muted)'
    },
    eyebrow: {
      font: '600 11px/1 var(--font-mono)',
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--gold)',
      margin: '0 0 6px'
    },
    rowLine: '1px dashed #ffffff14',
    accent: 'var(--gold)',
    accentInk: '#1A1405',
    nav: 'strip',
    btnR: 8
  }
};
Object.assign(window, {
  AP,
  apApps,
  apProjects,
  apSessions,
  apPending,
  apIdeas,
  apStageCol,
  apNotes,
  apSteps,
  apTerm,
  apSkins
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-apps/apps-data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-apps/apps-shell.jsx
try { (() => {
// Shell + primitives shared by every app screen; S = skin from apSkins.
function ApBtn({
  S,
  primary,
  danger,
  children,
  onClick,
  style
}) {
  const base = {
    appearance: 'none',
    font: '700 14px/1 var(--font-body)',
    minHeight: 44,
    padding: '0 16px',
    borderRadius: S.btnR,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    border: '1px solid var(--r4-line)',
    background: '#ffffff0a',
    color: 'var(--r4-ink)'
  };
  const p = primary ? {
    background: S.accent,
    borderColor: S.accent,
    color: S.accentInk
  } : danger ? {
    borderColor: 'color-mix(in oklab, var(--hot) 55%, transparent)',
    color: 'var(--hot)'
  } : {};
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      ...base,
      ...p,
      ...style
    }
  }, children);
}
function ApSection({
  S,
  title,
  right,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: S.eyebrow
  }, title), right && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--r4-faint)',
      marginBottom: 8
    }
  }, right)), /*#__PURE__*/React.createElement("div", {
    style: S.panel
  }, children));
}
function ApRow({
  S,
  first,
  children,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: S.id === 'A' ? '13px 16px' : '12px 2px',
      minHeight: 44,
      borderTop: first ? 'none' : S.rowLine,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, children);
}
function ApDot({
  c,
  size = 8,
  glow
}) {
  return /*#__PURE__*/React.createElement("i", {
    style: {
      width: size,
      height: size,
      flex: 'none',
      borderRadius: 99,
      background: c,
      boxShadow: glow ? `0 0 8px ${c}` : 'none'
    }
  });
}
function ApGlyph({
  a,
  size = 32,
  S
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      borderRadius: S && S.id === 'B' ? 6 : size * .3,
      font: `600 ${size * .42}px/1 var(--font-mono)`,
      color: a.c,
      background: `color-mix(in oklab, ${a.c} 14%, transparent)`
    }
  }, a.g);
}
function ApShell({
  S,
  app,
  onApp,
  children,
  badge
}) {
  const a = apApps.find(x => x.k === app);
  const dock = S.nav === 'dock';
  const strip = /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      padding: '0 16px 10px',
      scrollbarWidth: 'none'
    }
  }, apApps.map(x => {
    const on = x.k === app;
    return /*#__PURE__*/React.createElement("button", {
      key: x.k,
      onClick: () => onApp(x.k),
      style: {
        all: 'unset',
        cursor: 'pointer',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        padding: '0 12px',
        borderRadius: 6,
        font: '600 12px/1 var(--font-mono)',
        color: on ? 'var(--r4-ink)' : 'var(--r4-muted)',
        background: on ? '#ffffff12' : 'transparent',
        border: `1px solid ${on ? 'var(--r4-line)' : 'transparent'}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: x.c
      }
    }, x.g), x.name, x.k === 'ntfy' && badge ? /*#__PURE__*/React.createElement(ApDot, {
      c: "var(--hot)",
      size: 6
    }) : null);
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--r4-bg)',
      color: 'var(--r4-ink)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      flex: 'none',
      paddingTop: 'max(14px, env(safe-area-inset-top))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px 12px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "../r4box-home/cockpit.html",
    "aria-label": "Back to cockpit",
    style: {
      width: 36,
      height: 36,
      display: 'grid',
      placeItems: 'center',
      borderRadius: S.btnR,
      color: 'var(--r4-muted)',
      textDecoration: 'none',
      border: '1px solid var(--r4-line)',
      fontSize: 16
    }
  }, "\u2039"), S.id === 'A' ? /*#__PURE__*/React.createElement(ApGlyph, {
    a: a,
    S: S,
    size: 36
  }) : null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, S.id === 'B' ? `r4box / ${a.name}` : a.name), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: "var(--teal)",
    size: 6,
    glow: true
  }), a.name, ".r4box.com")), !dock && strip), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '4px 16px 24px',
      display: 'grid',
      alignContent: 'start',
      gridAutoRows: 'max-content',
      gap: S.id === 'A' ? 22 : 18
    }
  }, children), dock && /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 'none',
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      padding: '8px 6px max(10px, env(safe-area-inset-bottom))',
      background: 'var(--r4-panel)',
      borderTop: '1px solid var(--r4-line)'
    }
  }, apApps.map(x => {
    const on = x.k === app;
    return /*#__PURE__*/React.createElement("button", {
      key: x.k,
      onClick: () => onApp(x.k),
      style: {
        all: 'unset',
        cursor: 'pointer',
        position: 'relative',
        display: 'grid',
        justifyItems: 'center',
        gap: 4,
        minHeight: 48,
        alignContent: 'center',
        font: `700 10px/1 var(--font-body)`,
        color: on ? 'var(--r4-ink)' : 'var(--r4-faint)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: '600 15px/1 var(--font-mono)',
        color: on ? x.c : 'var(--r4-faint)'
      }
    }, x.g), x.name, x.k === 'ntfy' && badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 6,
        right: '26%'
      }
    }, /*#__PURE__*/React.createElement(ApDot, {
      c: "var(--hot)",
      size: 7
    })) : null);
  })));
}
Object.assign(window, {
  ApBtn,
  ApSection,
  ApRow,
  ApDot,
  ApGlyph,
  ApShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-apps/apps-shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-apps/screens-a.jsx
try { (() => {
// os, diary, ntfy screens
function OsScreen({
  S,
  pending,
  setPending
}) {
  const [proj, setProj] = React.useState('leanbrokers');
  const [task, setTask] = React.useState('');
  const [started, setStarted] = React.useState(null);
  const field = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 44,
    padding: '12px 14px',
    font: '400 16px/1.35 var(--font-body)',
    color: 'var(--r4-ink)',
    background: '#0E0A24',
    border: '1px solid var(--r4-line)',
    borderRadius: S.rIn,
    outline: 'none'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, pending && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.panel,
      borderRadius: S.r,
      border: `1px solid color-mix(in oklab, var(--gold) 50%, transparent)`,
      background: 'color-mix(in oklab, var(--gold) 9%, var(--r4-panel))',
      padding: 16,
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      font: '800 11px/1 var(--font-body)',
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--gold)'
    }
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: "var(--gold)",
    glow: true
  }), "Needs your OK \xB7 ", apPending.left, " min left"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 18px/1.3 var(--font-display)',
      letterSpacing: '-.02em'
    }
  }, apPending.what), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--r4-muted)'
    }
  }, "from ", apPending.who), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    danger: true,
    onClick: () => setPending(false)
  }, "Deny"), /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    primary: true,
    onClick: () => setPending(false)
  }, "Approve"))), /*#__PURE__*/React.createElement(ApSection, {
    S: S,
    title: "Start a task"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      if (task.trim()) {
        setStarted(proj);
        setTask('');
      }
    },
    style: {
      display: 'grid',
      gap: 10,
      padding: S.id === 'A' ? 16 : '12px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, apProjects.map(p => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: p.name,
    onClick: () => setProj(p.name),
    style: {
      all: 'unset',
      cursor: 'pointer',
      flex: 'none',
      minHeight: 34,
      padding: '0 12px',
      display: 'flex',
      alignItems: 'center',
      borderRadius: S.id === 'A' ? 99 : 6,
      font: '600 13px/1 var(--font-body)',
      background: proj === p.name ? S.accent : '#ffffff0a',
      color: proj === p.name ? S.accentInk : 'var(--r4-muted)'
    }
  }, p.name))), /*#__PURE__*/React.createElement("textarea", {
    rows: "3",
    value: task,
    onChange: e => setTask(e.target.value),
    placeholder: `What should Claude do in ${proj}?`,
    style: {
      ...field,
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    primary: true,
    style: {
      width: '100%'
    }
  }, "Start in ", proj, " \u2192"), started && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--teal)'
    }
  }, "Started a session in ", started, ". It shows up below."))), /*#__PURE__*/React.createElement(ApSection, {
    S: S,
    title: "Sessions",
    right: `${apSessions.length} running`
  }, apSessions.map((s, i) => /*#__PURE__*/React.createElement(ApRow, {
    S: S,
    key: s.name,
    first: i === 0
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: s.state === 'working' ? 'var(--teal)' : s.state === 'your turn' ? 'var(--gold)' : 'var(--r4-faint)',
    glow: s.state !== 'idle'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 15
    }
  }, s.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, s.cmd)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: s.state === 'your turn' ? 'var(--gold)' : 'var(--r4-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, s.now || 'Idle', " \xB7 ", s.ago)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-faint)'
    }
  }, "\u203A")))));
}
function DiaryScreen({
  S
}) {
  const [f, setF] = React.useState('active');
  const list = apIdeas.filter(i => f === 'parked' ? i.parked : !i.parked);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.panel,
      borderRadius: S.r,
      padding: 16,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, "Last night \xB7 23:30 rollup"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 18px/1.3 var(--font-display)',
      letterSpacing: '-.02em'
    }
  }, "Four sessions, two ideas moved."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--r4-muted)'
    }
  }, "LeanBrokers 2.0 shipped its pricing page. r4os agent payments branched into a card-approval flow.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['active', 'parked'].map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setF(k),
    style: {
      all: 'unset',
      cursor: 'pointer',
      minHeight: 36,
      padding: '0 14px',
      display: 'flex',
      alignItems: 'center',
      borderRadius: S.id === 'A' ? 99 : 6,
      font: '700 13px/1 var(--font-body)',
      textTransform: 'capitalize',
      background: f === k ? '#ffffff14' : 'transparent',
      border: '1px solid var(--r4-line)',
      color: f === k ? 'var(--r4-ink)' : 'var(--r4-muted)'
    }
  }, k))), /*#__PURE__*/React.createElement(ApSection, {
    S: S,
    title: "Ideas",
    right: `${list.length}`
  }, list.map((i, n) => /*#__PURE__*/React.createElement(ApRow, {
    S: S,
    key: i.title,
    first: n === 0
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: i.parked ? 'var(--r4-faint)' : apStageCol[i.stage],
    size: 10,
    glow: !i.parked
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 15,
      display: 'block'
    }
  }, i.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--r4-faint)'
    }
  }, i.stage, " \xB7 ", i.last, " ago")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--r4-faint)'
    }
  }, "\u203A")))));
}
function NtfyScreen({
  S,
  pending,
  setPending
}) {
  const notes = pending ? apNotes : apNotes.filter(n => !n.approve);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, ['r4-alerts', 'r4-diary'].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      minHeight: 30,
      padding: '0 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      borderRadius: S.id === 'A' ? 99 : 6,
      font: '600 12px/1 var(--font-mono)',
      border: '1px solid var(--r4-line)',
      color: 'var(--r4-muted)'
    }
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: "var(--teal)",
    size: 6
  }), t))), /*#__PURE__*/React.createElement(ApSection, {
    S: S,
    title: "Today",
    right: `${notes.length}`
  }, notes.map((n, i) => /*#__PURE__*/React.createElement(ApRow, {
    S: S,
    key: n.t,
    first: i === 0,
    style: {
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: n.c,
    glow: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'grid',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 15
    }
  }, n.t), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, n.ago)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1.4,
      color: 'var(--r4-muted)'
    }
  }, n.b), n.approve && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    danger: true,
    onClick: () => setPending(false)
  }, "Deny"), /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    primary: true,
    onClick: () => setPending(false)
  }, "Approve")))))));
}
Object.assign(window, {
  OsScreen,
  DiaryScreen,
  NtfyScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-apps/screens-a.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-apps/screens-b.jsx
try { (() => {
// term, code, browser screens
function TermScreen({
  S
}) {
  const [tab, setTab] = React.useState('leanbrokers');
  const [lines, setLines] = React.useState(apTerm);
  const [v, setV] = React.useState('');
  const col = {
    dim: 'var(--r4-faint)',
    ink: 'var(--r4-ink)',
    teal: 'var(--teal)',
    gold: 'var(--gold)'
  };
  const key = {
    all: 'unset',
    cursor: 'pointer',
    flex: 'none',
    minWidth: 44,
    minHeight: 40,
    display: 'grid',
    placeItems: 'center',
    padding: '0 10px',
    borderRadius: S.rIn,
    font: '600 13px/1 var(--font-mono)',
    background: '#ffffff0c',
    border: '1px solid var(--r4-line)',
    color: 'var(--r4-muted)',
    boxSizing: 'border-box'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, apSessions.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.name,
    onClick: () => setTab(s.name),
    style: {
      ...key,
      color: tab === s.name ? 'var(--r4-ink)' : 'var(--r4-muted)',
      background: tab === s.name ? '#ffffff16' : 'transparent'
    }
  }, s.name)), /*#__PURE__*/React.createElement("button", {
    style: key,
    "aria-label": "New session"
  }, "+")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#07060F',
      border: '1px solid var(--r4-line)',
      borderRadius: S.r,
      padding: 14,
      minHeight: 330,
      display: 'grid',
      alignContent: 'start',
      gap: 6,
      font: '400 13px/1.5 var(--font-mono)'
    }
  }, lines.map(([c, t], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: col[c],
      overflowWrap: 'anywhere'
    }
  }, t)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      color: 'var(--r4-ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--mint)'
    }
  }, "\u203A"), v, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 16,
      background: 'var(--mint)',
      opacity: .8
    }
  }))), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      if (v) {
        setLines(l => [...l, ['dim', '› ' + v]]);
        setV('');
      }
    },
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: v,
    onChange: e => setV(e.target.value),
    placeholder: "Type to the session\u2026",
    autoCapitalize: "off",
    autoCorrect: "off",
    style: {
      minHeight: 44,
      padding: '0 14px',
      font: '400 16px/1 var(--font-mono)',
      color: 'var(--r4-ink)',
      background: '#0E0A24',
      border: '1px solid var(--r4-line)',
      borderRadius: S.rIn,
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, ['esc', 'tab', 'ctrl', '↑', '↓', '←', '→', 'y', 'n'].map(k => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: k,
    onClick: () => (k === 'y' || k === 'n') && setLines(l => [...l, ['teal', k === 'y' ? '✓ Committed: update pricing copy' : '✗ Skipped commit']]),
    style: key
  }, k)))));
}
function CodeScreen({
  S
}) {
  const [open, setOpen] = React.useState(null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ApSection, {
    S: S,
    title: "Projects",
    right: "code-server"
  }, apProjects.map((p, i) => /*#__PURE__*/React.createElement(ApRow, {
    S: S,
    key: p.name,
    first: i === 0,
    onClick: () => setOpen(p.name)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 14px/1 var(--font-mono)',
      color: 'var(--violet)'
    }
  }, '{ }'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 15,
      display: 'block'
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1.4 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, p.path, " \xB7 ", p.branch)), p.dirty ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 11px/1 var(--font-mono)',
      color: 'var(--gold)',
      padding: '5px 8px',
      borderRadius: 6,
      background: 'color-mix(in oklab, var(--gold) 14%, transparent)'
    }
  }, p.dirty, " changed") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--r4-faint)'
    }
  }, "clean")))), open && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.panel,
      borderRadius: S.r,
      padding: 16,
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      font: '700 17px/1.2 var(--font-display)'
    }
  }, "Open ", open), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--r4-muted)'
    }
  }, "The editor is easier with a keyboard. On a phone, review the changes here or hand off to a session."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    onClick: () => setOpen(null)
  }, "Review diff"), /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    primary: true,
    onClick: () => setOpen(null)
  }, "Open editor"))));
}
function BrowserScreen({
  S
}) {
  const [mode, setMode] = React.useState('watch');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--r4-line)',
      borderRadius: S.r,
      overflow: 'hidden',
      background: '#07060F'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      borderBottom: '1px solid var(--r4-line)'
    }
  }, /*#__PURE__*/React.createElement(ApDot, {
    c: mode === 'watch' ? 'var(--hot)' : 'var(--teal)',
    glow: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--r4-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "leanbrokers.com/pricing"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 10px/1 var(--font-body)',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: mode === 'watch' ? 'var(--hot)' : 'var(--teal)'
    }
  }, mode === 'watch' ? 'Agent driving' : 'You’re driving')), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3 / 4',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--r4-faint)',
      fontSize: 13,
      textAlign: 'center',
      padding: 20,
      backgroundImage: 'repeating-linear-gradient(45deg, #ffffff05 0 10px, transparent 10px 20px)'
    }
  }, "Live view of the agent\u2019s browser", /*#__PURE__*/React.createElement("br", null), "(noVNC stream)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    onClick: () => setMode('watch'),
    style: mode === 'watch' ? {
      background: '#ffffff16'
    } : {}
  }, "Watch"), /*#__PURE__*/React.createElement(ApBtn, {
    S: S,
    primary: mode !== 'watch',
    onClick: () => setMode('drive')
  }, "Take over")), /*#__PURE__*/React.createElement(ApSection, {
    S: S,
    title: "Steps"
  }, apSteps.map(([g, t, ago], i) => /*#__PURE__*/React.createElement(ApRow, {
    S: S,
    key: t,
    first: i === 0
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      textAlign: 'center',
      color: 'var(--r4-muted)'
    }
  }, g), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, ago)))));
}
Object.assign(window, {
  TermScreen,
  CodeScreen,
  BrowserScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-apps/screens-b.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-apps/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-apps/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/CockpitA.jsx
try { (() => {
function CockpitA({
  mobile
}) {
  const {
    R4Mark,
    Bifurcation,
    EnterButton
  } = CK;
  const x = useLogistic();
  const now = ckClock();
  const panel = {
    background: 'var(--r4-panel)',
    border: '1px solid var(--r4-line)',
    borderRadius: 20,
    padding: 20
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: mobile ? '16px 16px 24px' : '20px 28px 28px',
      display: 'grid',
      gap: mobile ? 14 : 18
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(R4Mark, null), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12px/1 var(--font-mono)',
      color: 'var(--r4-muted)'
    }
  }, mobile ? '' : now.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }) + ' · ', now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...panel,
      padding: 0,
      position: 'relative',
      overflow: 'hidden',
      height: mobile ? 180 : 230
    }
  }, /*#__PURE__*/React.createElement(Bifurcation, {
    height: mobile ? 180 : 230,
    style: {
      opacity: .85
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: mobile ? 16 : 24,
      bottom: mobile ? 16 : 22,
      display: 'grid',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: ckEyebrow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: 'none',
      fontFamily: 'var(--font-mono)',
      letterSpacing: 0
    }
  }, "r = 4"), " \xB7 live"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `400 ${mobile ? 36 : 56}px/1 var(--font-display)`,
      letterSpacing: '-.02em'
    }
  }, "x = ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--teal)'
    }
  }, x.toFixed(4))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1.4fr) minmax(0,1fr)',
      gap: mobile ? 14 : 18
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: panel
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 20px/1 var(--font-display)',
      margin: 0
    }
  }, "The box"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--r4-muted)'
    }
  }, "Tailnet only")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'repeat(2, minmax(0,1fr))',
      gap: mobile ? 8 : 10
    }
  }, ckHub.map(s => /*#__PURE__*/React.createElement("a", {
    key: s.t,
    href: 'https://' + s.h + '/',
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      background: '#ffffff06',
      border: '1px solid #ffffff10',
      color: 'inherit',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: ckGlyph(s.c)
  }, s.g), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      display: 'block',
      fontSize: 15
    }
  }, s.t), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1.3 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, s.h)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--r4-muted)'
    }
  }, "\u2192"))))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...panel,
      display: 'grid',
      gap: 14,
      alignContent: 'start',
      order: mobile ? -1 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 20px/1 var(--font-display)',
      margin: 0
    }
  }, "Game room"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--r4-muted)'
    }
  }, "Open anywhere")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8
    }
  }, ckGames.map(([e, n]) => /*#__PURE__*/React.createElement("a", {
    key: n,
    href: "https://games.r4box.com/",
    title: n,
    style: {
      aspectRatio: '1',
      display: 'grid',
      placeItems: 'center',
      fontSize: 26,
      borderRadius: 12,
      background: '#0E0A24',
      border: '1px solid var(--r4-line)',
      textDecoration: 'none'
    }
  }, e))), /*#__PURE__*/React.createElement(EnterButton, {
    href: "https://games.r4box.com/",
    style: {
      background: 'var(--teal)',
      color: '#062A26',
      justifyContent: 'center'
    }
  }, "Play ", /*#__PURE__*/React.createElement("span", null, "\u2192")))));
}
window.CockpitA = CockpitA;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/CockpitA.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/CockpitB.jsx
try { (() => {
function CockpitB({
  mobile
}) {
  const {
    R4Mark,
    Bifurcation
  } = CK;
  const x = useLogistic();
  const items = [...ckHub.map(s => ({
    ...s,
    href: 'https://' + s.h + '/'
  })), {
    g: '⚓',
    t: 'game room',
    d: 'Battleship, Putt Post, Hilltop Duel, Chaos Cards, War, The Gauntlet, the arcade.',
    h: 'games.r4box.com',
    c: 'var(--teal)',
    href: 'https://games.r4box.com/'
  }];
  const [hot, setHot] = React.useState(-1);
  React.useEffect(() => {
    const k = e => {
      const i = '1234567'.indexOf(e.key);
      if (i >= 0) {
        setHot(i);
        setTimeout(() => setHot(-1), 400);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)',
      gridTemplateRows: mobile ? '300px auto' : 'none',
      minHeight: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      borderRight: mobile ? 'none' : '1px solid var(--r4-line)',
      borderBottom: mobile ? '1px solid var(--r4-line)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: mobile ? 16 : 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      opacity: .9
    }
  }, /*#__PURE__*/React.createElement(Bifurcation, {
    height: "100%"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...ckEyebrow,
      color: 'var(--teal)',
      textTransform: 'none',
      fontFamily: 'var(--font-mono)',
      letterSpacing: 0
    }
  }, "x \u2192 4x(1 \u2212 x)"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 clamp(48px, 7vw, 88px)/1 var(--font-display)',
      letterSpacing: '-.03em',
      fontVariantNumeric: 'tabular-nums'
    }
  }, x.toFixed(4)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--r4-muted)',
      fontSize: 13
    }
  }, "One step every half second. It never settles."))), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: mobile ? '16px 8px' : '28px 28px',
      display: 'grid',
      alignContent: mobile ? 'start' : 'center',
      gap: mobile ? 0 : 4
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...ckEyebrow,
      marginBottom: 12,
      paddingLeft: mobile ? 14 : 0
    }
  }, mobile ? 'Launch' : 'Launch · press 1–7'), items.map((s, i) => /*#__PURE__*/React.createElement("a", {
    key: s.t,
    href: s.href,
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '40px minmax(0,1fr) auto' : '28px 40px minmax(0,1fr) auto',
      gap: mobile ? 12 : 14,
      alignItems: 'center',
      padding: '12px 14px',
      borderRadius: 14,
      color: 'inherit',
      textDecoration: 'none',
      background: hot === i ? '#ffffff14' : 'transparent',
      transition: 'background .15s'
    }
  }, !mobile && /*#__PURE__*/React.createElement("kbd", {
    style: {
      font: '600 12px/1 var(--font-mono)',
      color: 'var(--r4-faint)',
      border: '1px solid var(--r4-line)',
      borderRadius: 6,
      padding: '5px 0',
      textAlign: 'center'
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: ckGlyph(s.c)
  }, s.g), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      display: 'block',
      font: '700 17px/1.2 var(--font-display)'
    }
  }, s.t), !mobile && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--r4-muted)'
    }
  }, s.d), mobile && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1.3 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, s.h)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, mobile ? '→' : s.h)))));
}
window.CockpitB = CockpitB;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/CockpitB.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/CockpitC.jsx
try { (() => {
function CockpitC({
  mobile,
  bg = 'curve'
}) {
  const {
    R4Mark,
    Bifurcation
  } = CK;
  const x = useLogistic();
  const [q, setQ] = React.useState('');
  const all = [...ckHub.map(s => ({
    ...s,
    href: 'https://' + s.h + '/'
  })), ...ckGames.map(([e, n]) => ({
    g: e,
    t: n,
    d: 'Game room',
    h: 'games.r4box.com',
    c: 'var(--teal)',
    href: 'https://games.r4box.com/',
    emoji: true
  }))];
  const hits = q ? all.filter(s => (s.t + ' ' + s.d).toLowerCase().includes(q.toLowerCase())) : [];
  const mask = 'linear-gradient(180deg, #000 0%, #0000 85%)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      minHeight: '100%',
      padding: mobile ? '16px 16px 20px' : '20px 28px 28px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, bg !== 'tree' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      opacity: bg === 'both' ? .35 : .55,
      maskImage: mask,
      WebkitMaskImage: mask
    }
  }, /*#__PURE__*/React.createElement(Bifurcation, {
    height: "100%"
  })), bg !== 'curve' && /*#__PURE__*/React.createElement(DiaryTreeBg, {
    style: {
      zIndex: -1,
      top: mobile ? 60 : 70,
      bottom: mobile ? 200 : 130,
      opacity: .9
    }
  }), /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(R4Mark, null), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12px/1 var(--font-mono)',
      color: 'var(--r4-muted)',
      padding: '8px 12px',
      border: '1px solid var(--r4-line)',
      borderRadius: 99,
      whiteSpace: 'nowrap'
    }
  }, "x = ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--teal)'
    }
  }, x.toFixed(4)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      alignContent: 'center',
      justifyItems: 'center',
      gap: 22,
      padding: '40px 0'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '800 clamp(30px, 5vw, 52px)/1 var(--font-display)',
      letterSpacing: '-.035em',
      margin: 0,
      textAlign: 'center'
    }
  }, "Where to?"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(560px, 100%)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "os, diary, battleship\u2026",
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '16px 20px',
      font: '400 17px/1.2 var(--font-body)',
      color: 'var(--r4-ink)',
      background: 'var(--r4-panel)',
      border: '1.5px solid var(--r4-line)',
      borderRadius: 14,
      outline: 'none'
    }
  }), hits.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 'calc(100% + 8px)',
      zIndex: 3,
      background: 'var(--r4-panel-2)',
      border: '1px solid var(--r4-line)',
      borderRadius: 14,
      padding: 6,
      boxShadow: '0 10px 24px #0003'
    }
  }, hits.slice(0, 6).map(s => /*#__PURE__*/React.createElement("a", {
    key: s.t,
    href: s.href,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: 10,
      color: 'inherit',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: s.emoji ? {
      width: 32,
      textAlign: 'center',
      fontSize: 20
    } : ckGlyph(s.c, 32)
  }, s.g), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 15
    }
  }, s.t), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--r4-faint)'
    }
  }, s.h)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'repeat(4, minmax(0,1fr))' : 'repeat(7, minmax(0,1fr))',
      gap: mobile ? 8 : 10
    }
  }, [...ckHub, {
    g: '⚓',
    t: 'games',
    h: 'games.r4box.com',
    c: 'var(--teal)'
  }].map(s => /*#__PURE__*/React.createElement("a", {
    key: s.t,
    href: 'https://' + s.h + '/',
    style: {
      display: 'grid',
      justifyItems: 'center',
      gap: 10,
      padding: mobile ? '12px 4px' : '16px 8px',
      borderRadius: mobile ? 16 : 20,
      background: 'var(--r4-panel)',
      border: '1px solid var(--r4-line)',
      color: 'inherit',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: ckGlyph(s.c, mobile ? 36 : 44)
  }, s.g), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: mobile ? 12 : 14
    }
  }, s.t)))));
}
window.CockpitC = CockpitC;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/CockpitC.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/FunKnock.jsx
try { (() => {
// 4c: knock on the box. Three knocks; each one steps the curve.
function FunKnock({
  mobile
}) {
  const [knocks, setKnocks] = React.useState([]);
  const [x, setX] = React.useState(.2);
  const [mode, setMode] = React.useState('play'); // play | fallback | in
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const timer = React.useRef(0);
  const knock = () => {
    if (st !== 'idle') return;
    clearTimeout(timer.current);
    setX(v => 4 * v * (1 - v));
    setKnocks(k => {
      const n = [...k, Date.now()];
      if (n.length >= 3) {
        setTimeout(go, 350);
        return n;
      }
      return n;
    });
    timer.current = setTimeout(() => setKnocks(k => k.length < 3 ? [] : k), 1600);
  };
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: "you",
    onBack: () => {
      setMode('play');
      setKnocks([]);
      cancel();
    }
  });
  if (mode === 'fallback') return /*#__PURE__*/React.createElement(LoginC, {
    mobile: mobile
  });
  const n = knocks.length,
    size = mobile ? 168 : 220;
  const ring = i => ({
    position: 'absolute',
    inset: 0,
    borderRadius: '24%',
    border: `2px solid ${['#3DD6C6', '#F5C542', '#FF5A4A'][i]}`,
    opacity: n > i ? 1 : 0,
    transform: `scale(${n > i ? 1.25 + i * .22 : 1})`,
    transition: 'transform .35s cubic-bezier(.2,1.8,.4,1), opacity .2s'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: mobile ? '20px 16px 28px' : '24px 48px 40px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(LoginBg, {
    mobile: mobile,
    strength: .35
  }), /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(LG.R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      alignContent: 'center',
      justifyItems: 'center',
      gap: mobile ? 36 : 44,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: `800 ${mobile ? 30 : 52}px/1 var(--font-display)`,
      letterSpacing: '-.035em',
      margin: 0
    }
  }, n === 0 ? 'Knock three times.' : n === 1 ? 'Again.' : n === 2 ? 'Once more.' : 'Come in.'), /*#__PURE__*/React.createElement("button", {
    onClick: knock,
    "aria-label": "Knock",
    style: {
      all: 'unset',
      cursor: 'pointer',
      position: 'relative',
      width: size,
      height: size,
      transform: n ? 'scale(.97)' : 'none',
      transition: 'transform .1s'
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: ring(i)
  })), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icon.svg",
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      display: 'block',
      filter: `drop-shadow(0 0 ${18 + n * 14}px #3DD6C666)`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 13px/1 var(--font-mono)',
      color: 'var(--r4-muted)'
    }
  }, "x = ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--teal)'
    }
  }, x.toFixed(4)))), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: 'center',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(FallbackLink, {
    onClick: () => setMode('fallback')
  })), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: "you",
    onCancel: () => {
      cancel();
      setKnocks([]);
    }
  }));
}
window.FunKnock = FunKnock;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/FunKnock.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/FunR.jsx
try { (() => {
// 4a: drag r up to 4. The diagram draws as you go; chaos opens the box.
function FunR({
  mobile
}) {
  const [r, setR] = React.useState(2.6);
  const [mode, setMode] = React.useState('play'); // play | fallback | in
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const cv = useCanvas((ctx, w, h) => drawAttractor(ctx, w, h, r), [r]);
  const track = React.useRef(null);
  const drag = e => {
    const b = track.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
    const nr = 2.6 + 1.4 * p;
    setR(nr);
    if (nr >= 3.995 && st === 'idle') go();
  };
  const down = e => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag(e);
  };
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: "you",
    onBack: () => {
      setMode('play');
      setR(2.6);
      cancel();
    }
  });
  if (mode === 'fallback') return /*#__PURE__*/React.createElement(LoginC, {
    mobile: mobile
  });
  const word = r < 3 ? 'calm' : r < 3.5699 ? 'doubling' : r < 3.83 ? 'the window' : r < 3.995 ? 'almost…' : 'chaos';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: mobile ? '20px 16px 28px' : '24px 48px 40px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: mobile ? '120px 0 200px' : '100px 0 180px',
      zIndex: -1
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: cv
  })), /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(LG.R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: mobile ? 28 : 36
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: `800 ${mobile ? 30 : 52}px/1 var(--font-display)`,
      letterSpacing: '-.035em',
      margin: 0
    }
  }, "Turn r up to 4.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'grid',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `400 ${mobile ? 40 : 56}px/1 var(--font-display)`,
      color: lgPhase(r),
      fontVariantNumeric: 'tabular-nums'
    }
  }, "r = ", r.toFixed(3)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 12,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: lgPhase(r)
    }
  }, word)), /*#__PURE__*/React.createElement("div", {
    ref: track,
    onPointerDown: down,
    onPointerMove: e => e.buttons && drag(e),
    style: {
      position: 'relative',
      height: 56,
      borderRadius: 999,
      background: 'var(--r4-panel)',
      border: '1px solid var(--r4-line)',
      touchAction: 'none',
      cursor: 'grab'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 4,
      right: 'auto',
      width: `calc(48px + ${(r - 2.6) / 1.4} * (100% - 56px))`,
      borderRadius: 999,
      background: 'var(--grad-curve)',
      opacity: .9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 4,
      left: `calc(4px + ${(r - 2.6) / 1.4} * (100% - 56px))`,
      width: 48,
      height: 48,
      borderRadius: 999,
      background: 'var(--r4-ink)',
      display: 'grid',
      placeItems: 'center',
      color: '#0B0918',
      fontWeight: 800
    }
  }, "\u2192")), /*#__PURE__*/React.createElement(FallbackLink, {
    onClick: () => setMode('fallback')
  })), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: "you",
    onCancel: () => {
      cancel();
      setR(3.9);
    }
  }));
}
window.FunR = FunR;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/FunR.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/FunStars.jsx
try { (() => {
// 4b: your constellation. Trace your secret through stars sitting on the attractor.
function FunStars({
  mobile
}) {
  const [path, setPath] = React.useState([]);
  const [mode, setMode] = React.useState('play'); // play | fallback | in
  const [bad, setBad] = React.useState(false);
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const stars = React.useMemo(() => {
    const rs = [3.2, 3.5, 3.74, 3.83, 3.9, 3.96, 3.62, 3.99, 3.45];
    return rs.map((r, i) => {
      let x = .3 + i * .05;
      for (let k = 0; k < 300 + i; k++) x = r * x * (1 - x);
      return {
        r,
        x: (r - 2.6) / 1.4,
        y: 1 - x
      };
    });
  }, []);
  const cv = useCanvas((ctx, w, h) => drawAttractor(ctx, w, h, 4), []);
  const box = React.useRef(null);
  const hit = e => {
    const o = box.current.getBoundingClientRect(),
      b = {
        left: o.left + 28,
        top: o.top + 28,
        width: o.width - 56,
        height: o.height - 56
      };
    const i = stars.findIndex(s => Math.hypot(s.x * b.width - (e.clientX - b.left), s.y * b.height - (e.clientY - b.top)) < 26);
    if (i >= 0 && !path.includes(i)) setPath(p => [...p, i]);
  };
  const up = () => {
    if (path.length >= 4) go();else if (path.length) {
      setBad(true);
      setTimeout(() => {
        setBad(false);
        setPath([]);
      }, 600);
    }
  };
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: "you",
    onBack: () => {
      setMode('play');
      setPath([]);
      cancel();
    }
  });
  if (mode === 'fallback') return /*#__PURE__*/React.createElement(LoginC, {
    mobile: mobile
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: mobile ? '20px 16px 28px' : '24px 48px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: mobile ? 20 : 28
    }
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(LG.R4Mark, null)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: `800 ${mobile ? 30 : 52}px/1 var(--font-display)`,
      letterSpacing: '-.035em',
      margin: 0
    }
  }, "Trace your stars."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      margin: '10px 0 0'
    }
  }, "Connect at least four, in your order.")), /*#__PURE__*/React.createElement("div", {
    ref: box,
    onPointerDown: e => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setPath([]);
      hit(e);
    },
    onPointerMove: e => e.buttons && hit(e),
    onPointerUp: up,
    style: {
      position: 'relative',
      flex: 1,
      touchAction: 'none',
      borderRadius: 20,
      border: '1px solid var(--r4-line)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: .35
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: cv
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'visible'
    }
  }, path.slice(1).map((i, k) => {
    const a = stars[path[k]],
      b = stars[i];
    return /*#__PURE__*/React.createElement("line", {
      key: k,
      x1: `${a.x * 100}%`,
      y1: `${a.y * 100}%`,
      x2: `${b.x * 100}%`,
      y2: `${b.y * 100}%`,
      stroke: bad ? '#FF5A4A' : lgPhase(b.r),
      strokeWidth: "3",
      strokeLinecap: "round"
    });
  })), stars.map((s, i) => {
    const on = path.includes(i);
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        position: 'absolute',
        left: `${s.x * 100}%`,
        top: `${s.y * 100}%`,
        width: on ? 22 : 14,
        height: on ? 22 : 14,
        transform: 'translate(-50%,-50%)',
        borderRadius: 99,
        background: bad && on ? '#FF5A4A' : lgPhase(s.r),
        boxShadow: `0 0 ${on ? 26 : 14}px ${lgPhase(s.r)}`,
        transition: 'all .15s'
      }
    });
  }))), /*#__PURE__*/React.createElement(FallbackLink, {
    onClick: () => setMode('fallback')
  }), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: "you",
    onCancel: () => {
      cancel();
      setPath([]);
    }
  }));
}
window.FunStars = FunStars;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/FunStars.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/FunTree.jsx
try { (() => {
// 4b v2: a baby diary tree. Its buds, blossoms and fruit are the code.
const ftDay = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const ftSapling = (() => {
  // 6 limbs off the trunk, 3 of them forking once: shape only, every event is a plain leaf
  const roots = [['r1', 16], ['r2', 14], ['r3', 12], ['r4', 9], ['r5', 7], ['r6', 4]];
  const ideas = roots.map(([id, n]) => ({
    id,
    created: ftDay(n),
    stage: 'explored',
    parent: null
  }));
  const events = [];
  roots.forEach(([id, n]) => {
    for (let i = 0; i < 4; i++) events.push({
      id: `ev-${id}-${i}`,
      date: ftDay(Math.max(0, n - i * 1)),
      idea: id,
      kind: 'deepen',
      effort: 1 + i % 2,
      backfilled: false
    });
  });
  [['r1', 2], ['r3', 1], ['r5', 2]].forEach(([p, at], j) => {
    const d = ftDay(Math.max(0, roots.find(r => r[0] === p)[1] - at)),
      id = 'k' + j;
    ideas.push({
      id,
      created: d,
      stage: 'explored',
      parent: p
    });
    for (let i = 0; i < 3; i++) events.push({
      id: `ev-${id}-${i}`,
      date: d,
      idea: id,
      kind: 'deepen',
      effort: 1,
      backfilled: false
    });
  });
  events.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return {
    ideas,
    events
  };
})();
// 9 code dots on a loose 3x3 grid centred on the trunk, each nudged by a fixed offset so the
// grid reads hand-grown, and each tied back to the tree by its own twig (anchor = nearest
// tree point below it). Rows: fruit, blossoms, buds.
const ftJitter = [[-.14, .1], [.06, -.12], [.16, .04], [.1, -.08], [-.05, .13], [-.12, -.06], [-.08, .05], [.13, .12], [.02, -.1]];
function ftPickCode(nodes, w, h) {
  if (nodes.length < 9) return [];
  const ys = nodes.map(n => n.y),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  const sx = Math.min(w * .3, 150),
    sy = Math.min((y1 - y0) * .42, sx * 1.9);
  const cy = (y0 + y1) / 2 - sy * .1,
    kinds = ['ship', 'branch', 'spark'],
    out = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const [jx, jy] = ftJitter[row * 3 + col];
    const x = w / 2 + (col - 1 + jx) * sx,
      y = cy + (row - 1 + jy) * sy;
    let a = null,
      bd = Infinity;
    nodes.forEach(n => {
      if (n.y < y + 18) return;
      const d = (n.x - x) ** 2 + (n.y - y) ** 2;
      if (d < bd) {
        bd = d;
        a = n;
      }
    });
    if (!a) nodes.forEach(n => {
      const d = (n.x - x) ** 2 + (n.y - y) ** 2;
      if (d < bd) {
        bd = d;
        a = n;
      }
    });
    const bend = (col - 1 || (row % 2 ? 1 : -1)) * 14;
    out.push({
      x,
      y,
      kind: kinds[row],
      ax: a.x,
      ay: a.y,
      cx: (a.x + x) / 2 + bend,
      cy: (a.y + y) / 2 + 6
    });
  }
  return out;
}
const ftKindCol = {
  spark: '#B9A6FF',
  branch: '#FF5A4A',
  pivot: '#FF5A4A',
  ship: '#F5C542'
};
const ftKindName = {
  spark: 'bud',
  branch: 'blossom',
  pivot: 'blossom',
  ship: 'fruit'
};
function FunTree({
  mobile
}) {
  const [nodes, setNodes] = React.useState([]);
  const [path, setPath] = React.useState([]);
  const [bad, setBad] = React.useState(false);
  const [mode, setMode] = React.useState('play');
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const cv = React.useRef(null),
    box = React.useRef(null);
  React.useEffect(() => {
    if (mode !== 'play') return;
    return window.mountDiaryTree(cv.current, ftSapling, {
      palette: ckTreePalette,
      flow: {
        ...ckTreeFlow,
        wave: 70
      },
      spin: false,
      fill: true,
      segScale: 1.7,
      withTips: true,
      onLayout: (n, w, h) => setNodes(ftPickCode(n, w, h))
    });
  }, [mode]);
  const hit = e => {
    const b = box.current.getBoundingClientRect(),
      mx = e.clientX - b.left,
      my = e.clientY - b.top;
    let best = -1,
      bd = 30 * 30;
    nodes.forEach((n, i) => {
      const d = (n.x - mx) ** 2 + (n.y - my) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) setPath(p => p.includes(best) ? p : [...p, best]);
  };
  const up = () => {
    if (path.length >= 4) go();else if (path.length) {
      setBad(true);
      setTimeout(() => {
        setBad(false);
        setPath([]);
      }, 600);
    }
  };
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: "you",
    onBack: () => {
      setMode('play');
      setPath([]);
      cancel();
    }
  });
  if (mode === 'fallback') return /*#__PURE__*/React.createElement(LoginC, {
    mobile: mobile
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: mobile ? '20px 16px 28px' : '24px 48px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: mobile ? 12 : 20
    }
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(LG.R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    ref: box,
    onPointerDown: e => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setPath([]);
      hit(e);
    },
    onPointerMove: e => e.buttons && hit(e),
    onPointerUp: up,
    style: {
      position: 'relative',
      flex: 1,
      touchAction: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: cv,
    style: {
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'none'
    }
  }, path.slice(1).map((i, k) => {
    const a = nodes[path[k]],
      b = nodes[i];
    return a && b ? /*#__PURE__*/React.createElement("line", {
      key: k,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      stroke: bad ? '#FF5A4A' : '#F3F1FF',
      strokeOpacity: ".75",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeDasharray: "1 7"
    }) : null;
  }), nodes.map((n, i) => /*#__PURE__*/React.createElement("g", {
    key: 'b' + i
  }, /*#__PURE__*/React.createElement("path", {
    d: `M${n.ax} ${n.ay} Q${n.cx} ${n.cy} ${n.x} ${n.y}`,
    fill: "none",
    stroke: "#3A335F",
    strokeWidth: "4.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: `M${n.ax} ${n.ay} Q${n.cx} ${n.cy} ${n.x} ${n.y}`,
    fill: "none",
    stroke: ftKindCol[n.kind],
    strokeOpacity: ".35",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }))), nodes.map((n, i) => /*#__PURE__*/React.createElement("g", {
    key: 'd' + i
  }, /*#__PURE__*/React.createElement("circle", {
    cx: n.x,
    cy: n.y,
    r: "16",
    fill: ftKindCol[n.kind],
    opacity: ".22"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: n.x,
    cy: n.y,
    r: "8.5",
    fill: ftKindCol[n.kind],
    style: {
      filter: `drop-shadow(0 0 8px ${ftKindCol[n.kind]})`
    }
  }))), path.map(i => nodes[i] && /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: nodes[i].x,
    cy: nodes[i].y,
    r: "22",
    fill: "none",
    stroke: bad ? '#FF5A4A' : ftKindCol[nodes[i].kind],
    strokeWidth: "2"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      justifyContent: 'center',
      fontSize: 12,
      color: 'var(--r4-muted)'
    }
  }, ['spark', 'branch', 'ship'].map(k => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 9,
      background: ftKindCol[k],
      boxShadow: `0 0 8px ${ftKindCol[k]}`
    }
  }), ftKindName[k]))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(FallbackLink, {
    onClick: () => setMode('fallback')
  })), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: "you",
    onCancel: () => {
      cancel();
      setPath([]);
    }
  }));
}
window.FunTree = FunTree;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/FunTree.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/Home.jsx
try { (() => {
const {
  R4Mark: HmMark,
  Bifurcation: HmBif,
  EnterButton: HmCta,
  GamesDoor: HmDoor,
  HubTile: HmTile
} = window.R4boxDesignSystem_3e3a61;
const homeS = {
  wrap: {
    width: 'min(1100px, 100% - 32px)',
    marginInline: 'auto'
  },
  h2: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 'clamp(22px, 3.4vw, 30px)',
    letterSpacing: '-.02em',
    margin: 0
  },
  note: {
    color: 'var(--r4-muted)',
    fontSize: 14,
    margin: 0
  },
  dot: c => ({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: 8,
    verticalAlign: 1,
    background: c
  }),
  head: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 20
  }
};
function XValue() {
  const [x, setX] = React.useState(() => Math.random() * .8 + .1);
  React.useEffect(() => {
    const t = setInterval(() => setX(v => {
      let n = 4 * v * (1 - v);
      if (n < 1e-6 || n > 1 - 1e-6) n = Math.random();
      return n;
    }), 500);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    title: "the curve itself, x \u2192 4x(1 \u2212 x), one step every half second",
    style: {
      font: '600 12px/1 var(--font-mono)',
      color: 'var(--r4-muted)',
      padding: '8px 12px',
      border: '1px solid var(--r4-line)',
      borderRadius: 99,
      background: '#ffffff06',
      whiteSpace: 'nowrap'
    }
  }, "x = ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--teal)',
      fontWeight: 600,
      display: 'inline-block',
      minWidth: '6.5ch'
    }
  }, x.toFixed(4)));
}
function Hero() {
  const mask = 'linear-gradient(180deg, transparent, #000 18%, #000 70%, transparent), linear-gradient(90deg, #0000001a 0 30%, #000 72%)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      padding: 'clamp(40px, 9vw, 110px) 0 clamp(56px, 10vw, 120px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      opacity: .9,
      maskImage: mask,
      WebkitMaskImage: mask,
      maskComposite: 'intersect',
      WebkitMaskComposite: 'source-in'
    }
  }, /*#__PURE__*/React.createElement(HmBif, {
    height: "100%"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 800,
      fontSize: 12,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--teal)',
      margin: '0 0 18px'
    }
  }, "r = 4 \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: 'none',
      fontFamily: 'var(--font-mono)',
      letterSpacing: 0
    }
  }, "x \u2192 r\xB7x(1 \u2212 x)")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 'clamp(38px, 8.4vw, 92px)',
      lineHeight: .98,
      letterSpacing: '-.035em',
      margin: 0,
      maxWidth: '11ch'
    }
  }, "Order, right up to ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'normal',
      background: 'var(--grad-curve)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent'
    }
  }, "the edge of chaos.")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      fontSize: 'clamp(16px, 2.1vw, 19px)',
      maxWidth: '34ch',
      margin: '22px 0 34px'
    }
  }, "The family game room, and the box that runs everything else. Turn r up to 4 and see what happens."), /*#__PURE__*/React.createElement(HmCta, {
    size: "lg",
    href: "https://games.r4box.com/",
    style: {
      background: 'var(--teal)',
      color: '#062A26'
    }
  }, "Play ", /*#__PURE__*/React.createElement("span", null, "\u2192")));
}
const GAMES = [['⚓', 'Battleship'], ['⛳', 'Putt Post'], ['💥', 'Hilltop Duel'], ['🃏', 'Chaos Cards'], ['⚔️', 'War'], ['🏆', 'The Gauntlet'], ['🏁', 'Rally', 1], ['🕹️', 'Pinball, Squirrel, Run…', 1]].map(([icon, name, a]) => ({
  icon,
  name,
  arcade: !!a
}));
const HUB = [['◎', 'os', 'Start a task, approve what Claude wants to do, see the approvals log.', 'os.r4box.com', 'var(--teal)'], ['✎', 'diary', 'Clearing: every session written up nightly, and the ideas they grow.', 'diary.r4box.com', 'var(--gold)'], ['›_', 'term', 'A shell on the box, in the browser.', 'term.r4box.com', 'var(--mint)'], ['{ }', 'code', 'The editor, with every project checked out.', 'code.r4box.com', 'var(--violet)'], ['◫', 'browser', 'Watch, or take over, the browser the agent drives.', 'browser.r4box.com', 'var(--hot)'], ['◉', 'ntfy', 'The notification relay that reaches the phone.', 'ntfy.r4box.com', 'var(--gold)']];
function Home() {
  return /*#__PURE__*/React.createElement("div", {
    style: homeS.wrap
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement(HmMark, {
    href: "./"
  }), /*#__PURE__*/React.createElement(XValue, null)), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '28px 0 56px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: homeS.head
  }, /*#__PURE__*/React.createElement("h2", {
    style: homeS.h2
  }, "Game room"), /*#__PURE__*/React.createElement("p", {
    style: homeS.note
  }, /*#__PURE__*/React.createElement("span", {
    style: homeS.dot('var(--teal)')
  }), "Open to the family, anywhere")), /*#__PURE__*/React.createElement(HmDoor, {
    href: "https://games.r4box.com/",
    desc: "Live turn-based games for three players and a few robots. Cheating is allowed, catching a cheater pays, and Fig is watching.",
    games: GAMES
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '28px 0 56px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: homeS.head
  }, /*#__PURE__*/React.createElement("h2", {
    style: homeS.h2
  }, "The box"), /*#__PURE__*/React.createElement("p", {
    style: homeS.note
  }, /*#__PURE__*/React.createElement("span", {
    style: homeS.dot('var(--violet)')
  }), "Tailnet only: these open from our own devices, nowhere else")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
      gap: 14
    }
  }, HUB.map(([g, t, d, h, c]) => /*#__PURE__*/React.createElement(HmTile, {
    key: t,
    glyph: g,
    title: t,
    desc: d,
    host: h,
    color: c,
    href: 'https://' + h + '/'
  })))), /*#__PURE__*/React.createElement("footer", {
    style: {
      padding: '30px 0 40px',
      color: 'var(--r4-faint)',
      fontSize: 13,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
      borderTop: '1px solid #ffffff10'
    }
  }, /*#__PURE__*/React.createElement("span", null, "r4box \xB7 at r = 4 the curve never settles, and never repeats"), /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'normal',
      fontFamily: 'var(--font-mono)'
    }
  }, "3.5699\u2026 \u2192 chaos")));
}
Object.assign(window, {
  Home
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/LoginA.jsx
try { (() => {
// 3a: pick yourself, then passkey. Password and email link are fallbacks.
function LoginA({
  mobile
}) {
  const {
    R4Mark,
    Avatar,
    Button,
    Field,
    Card
  } = LG;
  const [who, setWho] = React.useState(null);
  const [mode, setMode] = React.useState('pick'); // pick | pw | mail | sent | in
  const [email, setEmail] = React.useState('');
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: who,
    onBack: () => {
      setMode('pick');
      setWho(null);
      cancel();
    }
  });
  const pad = mobile ? 20 : 48;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: pad,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(LoginBg, {
    mobile: mobile
  }), /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 22,
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 800,
      fontSize: 12,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--teal)',
      margin: '0 0 12px'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: `800 ${mobile ? 40 : 64}px/.98 var(--font-display)`,
      letterSpacing: '-.035em',
      margin: 0
    }
  }, who ? `Hi, ${who}.` : "Who's here?")), !who && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, lgFamily.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.name,
    onClick: () => setWho(f.name),
    style: {
      all: 'unset',
      cursor: 'pointer',
      padding: mobile ? '12px 16px' : '14px 20px',
      borderRadius: 14,
      background: '#ffffff0e',
      border: '1px solid #ffffff22',
      fontSize: mobile ? 14 : 15,
      fontWeight: 700
    }
  }, f.name))), who && mode === 'pick' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    display: true,
    onClick: go,
    style: {
      background: 'var(--teal)',
      borderColor: 'var(--teal)',
      color: 'var(--teal-ink)',
      width: '100%'
    }
  }, "Sign in with passkey"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('pw')
  }, "Use password"), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('mail')
  }, "Email me a link"), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setWho(null),
    style: {
      marginLeft: 'auto',
      color: 'var(--r4-muted)'
    }
  }, "Not you?"))), mode === 'pw' && /*#__PURE__*/React.createElement(Card, {
    as: "form",
    onSubmit: e => {
      e.preventDefault();
      setMode('in');
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    type: "password",
    placeholder: "any password works here"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    variant: "primary",
    display: true,
    style: {
      background: 'var(--teal)',
      borderColor: 'var(--teal)',
      color: 'var(--teal-ink)'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('pick')
  }, "Back"))), mode === 'mail' && /*#__PURE__*/React.createElement(Card, {
    as: "form",
    onSubmit: e => {
      e.preventDefault();
      setMode('sent');
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    variant: "primary",
    display: true,
    style: {
      background: 'var(--teal)',
      borderColor: 'var(--teal)',
      color: 'var(--teal-ink)'
    }
  }, "Send link"), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('pick')
  }, "Back"))), mode === 'sent' && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, lgLinkSent(email || 'your inbox')), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('pick')
  }, "Back"))), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: who,
    onCancel: cancel
  }));
}
window.LoginA = LoginA;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/LoginA.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/LoginB.jsx
try { (() => {
// 3b: one card, every method visible. Avatars fill the username.
function LoginB({
  mobile
}) {
  const {
    R4Mark,
    Avatar,
    Button,
    Field,
    Card
  } = LG;
  const [u, setU] = React.useState('');
  const [mode, setMode] = React.useState('form'); // form | mail | sent | in
  const [email, setEmail] = React.useState('');
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const tealBtn = {
    background: 'var(--teal)',
    borderColor: 'var(--teal)',
    color: 'var(--teal-ink)'
  };
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: u || 'phoenix_lord',
    onBack: () => {
      setMode('form');
      cancel();
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: mobile ? '20px 16px' : 48,
      display: 'flex',
      flexDirection: 'column',
      gap: mobile ? 16 : 24
    }
  }, /*#__PURE__*/React.createElement(LoginBg, {
    mobile: mobile,
    strength: .7
  }), /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      alignContent: mobile ? 'end' : 'center',
      justifyItems: mobile ? 'stretch' : 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: mobile ? '100%' : 440,
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: `800 ${mobile ? 32 : 44}px/1 var(--font-display)`,
      letterSpacing: '-.035em',
      margin: 0
    }
  }, "Into the box"), /*#__PURE__*/React.createElement(Card, {
    as: "form",
    onSubmit: e => {
      e.preventDefault();
      setMode('in');
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Username",
    value: u,
    onChange: e => setU(e.target.value),
    autoComplete: "username"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    type: "password",
    placeholder: "any password works here"
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    variant: "primary",
    display: true,
    style: {
      ...tealBtn,
      width: '100%'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--r4-faint)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--r4-line)'
    }
  }), "or", /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--r4-line)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    type: "button",
    onClick: go
  }, "\u25CE Passkey"), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    onClick: () => setMode(mode === 'mail' ? 'form' : 'mail')
  }, "\u2709 Email link")), mode === 'mail' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) auto',
      gap: 10,
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "primary",
    onClick: () => setMode('sent'),
    style: tealBtn
  }, "Send")), mode === 'sent' && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--teal)',
      fontWeight: 700
    }
  }, lgLinkSent(email || 'your inbox'))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: 'var(--r4-muted)'
    }
  }, "One sign-in for the game room and the box."))), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: u || 'you',
    onCancel: cancel
  }));
}
window.LoginB = LoginB;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/LoginB.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/LoginC.jsx
try { (() => {
// 3c: one smart field. A family name offers passkey (or password); an email gets a link.
function LoginC({
  mobile
}) {
  const {
    R4Mark,
    Avatar,
    Button,
    Field
  } = LG;
  const [v, setV] = React.useState('');
  const [mode, setMode] = React.useState('ask'); // ask | pw | sent | in
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const fam = lgFamily.find(f => f.name === v.trim().toLowerCase());
  const isEmail = /.+@.+\..+/.test(v);
  const tealBtn = {
    background: 'var(--teal)',
    borderColor: 'var(--teal)',
    color: 'var(--teal-ink)',
    width: '100%'
  };
  const input = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '16px 20px',
    font: '400 17px/1.2 var(--font-body)',
    color: 'var(--r4-ink)',
    background: 'var(--r4-panel)',
    border: '1.5px solid var(--r4-line)',
    borderRadius: 14,
    outline: 'none'
  };
  if (mode === 'in') return /*#__PURE__*/React.createElement(SignedIn, {
    who: fam ? fam.name : v,
    onBack: () => {
      setMode('ask');
      setV('');
      cancel();
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      isolation: 'isolate',
      height: '100%',
      boxSizing: 'border-box',
      padding: mobile ? '20px 16px 28px' : '20px 28px 28px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(LoginBg, {
    mobile: mobile,
    strength: .55
  }), /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement(R4Mark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      alignContent: 'center',
      justifyItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: `800 ${mobile ? 34 : 52}px/1 var(--font-display)`,
      letterSpacing: '-.035em',
      margin: 0,
      textAlign: 'center'
    }
  }, fam ? `Hi, ${fam.name}.` : "Who's there?"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(420px, 100%)',
      display: 'grid',
      gap: 12
    }
  }, mode !== 'sent' && /*#__PURE__*/React.createElement("input", {
    value: v,
    onChange: e => {
      setV(e.target.value);
      setMode('ask');
    },
    placeholder: "Your name or email",
    autoComplete: "username",
    style: input
  }), !v && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, lgFamily.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.name,
    onClick: () => setV(f.name),
    style: {
      all: 'unset',
      cursor: 'pointer',
      padding: '7px 14px',
      borderRadius: 999,
      background: '#ffffff0e',
      border: '1px solid #ffffff22',
      fontSize: 13,
      fontWeight: 700
    }
  }, f.name))), fam && mode === 'ask' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    display: true,
    onClick: go,
    style: tealBtn
  }, "Continue with passkey"), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('pw'),
    style: {
      justifySelf: 'center'
    }
  }, "Use password instead")), fam && mode === 'pw' && /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setMode('in');
    },
    style: {
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    type: "password",
    placeholder: "any password works here"
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    variant: "primary",
    display: true,
    style: tealBtn
  }, "Sign in")), isEmail && mode === 'ask' && /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    display: true,
    onClick: () => setMode('sent'),
    style: tealBtn
  }, "Email me a link"), mode === 'sent' && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, lgLinkSent(v)), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('ask')
  }, "Use a different address")), v && !fam && !isEmail && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--r4-muted)'
    }
  }, "Type a player name or an email address."))), /*#__PURE__*/React.createElement(PasskeySheet, {
    st: st,
    who: fam ? fam.name : '',
    onCancel: cancel
  }));
}
window.LoginC = LoginC;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/LoginC.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/cockpit-shared.jsx
try { (() => {
const CK = window.R4boxDesignSystem_3e3a61;
const ckGames = [['⚓', 'Battleship'], ['⛳', 'Putt Post'], ['💥', 'Hilltop Duel'], ['🃏', 'Chaos Cards'], ['⚔️', 'War'], ['🏆', 'The Gauntlet'], ['🏁', 'Rally'], ['🕹️', 'Arcade']];
const ckHub = [{
  g: '◎',
  t: 'os',
  d: 'Start a task, approve what Claude wants to do, see the approvals log.',
  h: 'os.r4box.com',
  c: 'var(--teal)'
}, {
  g: '✎',
  t: 'diary',
  d: 'Clearing: every session written up nightly, and the ideas they grow.',
  h: 'diary.r4box.com',
  c: 'var(--gold)'
}, {
  g: '›_',
  t: 'term',
  d: 'A shell on the box, in the browser.',
  h: 'term.r4box.com',
  c: 'var(--mint)'
}, {
  g: '{ }',
  t: 'code',
  d: 'The editor, with every project checked out.',
  h: 'code.r4box.com',
  c: 'var(--violet)'
}, {
  g: '◫',
  t: 'browser',
  d: 'Watch, or take over, the browser the agent drives.',
  h: 'browser.r4box.com',
  c: 'var(--hot)'
}, {
  g: '◉',
  t: 'ntfy',
  d: 'The notification relay that reaches the phone.',
  h: 'ntfy.r4box.com',
  c: 'var(--gold)'
}];
function useLogistic(ms = 500) {
  const [x, setX] = React.useState(() => Math.random() * .8 + .1);
  React.useEffect(() => {
    const t = setInterval(() => setX(v => {
      let n = 4 * v * (1 - v);
      if (n < 1e-6 || n > 1 - 1e-6) n = Math.random();
      return n;
    }), ms);
    return () => clearInterval(t);
  }, [ms]);
  return x;
}
function ckClock() {
  const [d, setD] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setD(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return d;
}
const ckGlyph = (c, size = 40) => ({
  width: size,
  height: size,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 12,
  font: `600 ${size * .4}px/1 var(--font-mono)`,
  color: c,
  background: `color-mix(in oklab, ${c} 14%, transparent)`
});
const ckEyebrow = {
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  color: 'var(--violet)',
  margin: 0
};
const ckTreePalette = {
  '--bark': '#3A335F',
  '--c-park': '#4A4470',
  '--c-growth': '#B9A6FF',
  '--c-turn': '#FF5A4A',
  '--c-close': '#3DD6C6',
  '--accent': '#F5C542',
  '--ground': '#0B0918'
};
const ckTreeFlow = {
  colors: ['#3DD6C6', '#C9FFF8', '#B9A6FF', '#F5C542', '#FF5A4A'],
  wave: 120,
  speed: .45,
  tail: 2.6
};
const CK_DIARY_URL = 'https://diary.r4box.com/data.json';
let ckDiaryLive = null;
function useDiaryData() {
  const [d, setD] = React.useState(ckDiaryLive || window.CLEARING_DATA);
  React.useEffect(() => {
    if (ckDiaryLive) return;
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 4000);
    fetch(CK_DIARY_URL, {
      cache: 'no-store',
      signal: ac.signal
    }).then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.ideas && j.events) {
        j.events.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
        ckDiaryLive = j;
        setD(j);
      }
    }).catch(() => {}).finally(() => clearTimeout(to));
    return () => ac.abort();
  }, []);
  return d;
}
function DiaryTreeBg({
  style,
  flow = true
}) {
  const ref = React.useRef(null);
  const data = useDiaryData();
  React.useEffect(() => window.mountDiaryTree(ref.current, data, {
    palette: ckTreePalette,
    flow: flow ? {
      ...ckTreeFlow
    } : null
  }), [flow, data]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    style: {
      display: 'block'
    }
  }));
}
Object.assign(window, {
  ckTreePalette,
  ckTreeFlow,
  DiaryTreeBg,
  CK,
  ckGames,
  ckHub,
  useLogistic,
  ckClock,
  ckGlyph,
  ckEyebrow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/cockpit-shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/diary-tree-data.js
try { (() => {
window.CLEARING_DATA = {
  "ideas": [{
    "id": "dynamic-ui",
    "created": "2026-09-17",
    "stage": "spark",
    "parent": null
  }, {
    "id": "family-battleship",
    "created": "2026-09-27",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "idea-diary",
    "created": "2026-09-17",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "lean-provider-recon",
    "created": "2026-10-09",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "leanbrokers-2-0-launch",
    "created": "2026-10-12",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanbrokers-2-0-pricing",
    "created": "2026-09-28",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanbrokers-apex-site-outage",
    "created": "2026-10-06",
    "stage": "explored",
    "parent": null
  }, {
    "id": "leanbrokers-ci-deploy",
    "created": "2026-09-01",
    "stage": "shipped",
    "parent": "leanbrokers-security-hardening"
  }, {
    "id": "leanbrokers-consent-invites",
    "created": "2026-09-24",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "leanbrokers-crm-vps-migration",
    "created": "2026-09-19",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "leanbrokers-lead-agent-flow",
    "created": "2026-09-01",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanbrokers-outreach-list-split",
    "created": "2026-10-09",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanbrokers-outreach-repeat-and-opens",
    "created": "2026-09-29",
    "stage": "spark",
    "parent": null
  }, {
    "id": "leanbrokers-public-website",
    "created": "2026-10-15",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanbrokers-security-hardening",
    "created": "2026-09-01",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "leanhealth-agents-ux",
    "created": "2026-08-31",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanhealth-ci-deploy",
    "created": "2026-08-31",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "leanhealth-contact-reliability",
    "created": "2026-08-31",
    "stage": "shipped",
    "parent": null
  }, {
    "id": "panels-api",
    "created": "2026-09-17",
    "stage": "explored",
    "parent": "session-panel"
  }, {
    "id": "r4box-devbox",
    "created": "2026-10-01",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "r4os-agent-payments",
    "created": "2026-10-16",
    "stage": "parked",
    "parent": "r4os"
  }, {
    "id": "r4os",
    "created": "2026-10-16",
    "stage": "prototyped",
    "parent": null
  }, {
    "id": "session-panel",
    "created": "2026-09-17",
    "stage": "prototyped",
    "parent": null
  }],
  "events": [{
    "id": "ev-2026-08-31-001",
    "date": "2026-08-31",
    "idea": "leanhealth-contact-reliability",
    "kind": "spark",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-08-31-002",
    "date": "2026-08-31",
    "idea": "leanhealth-contact-reliability",
    "kind": "pivot",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-08-31-003",
    "date": "2026-08-31",
    "idea": "leanhealth-agents-ux",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-08-31-004",
    "date": "2026-08-31",
    "idea": "leanhealth-ci-deploy",
    "kind": "spark",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-09-01-001",
    "date": "2026-09-01",
    "idea": "leanbrokers-lead-agent-flow",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-01-002",
    "date": "2026-09-01",
    "idea": "leanbrokers-lead-agent-flow",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-01-003",
    "date": "2026-09-01",
    "idea": "leanbrokers-security-hardening",
    "kind": "spark",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-09-01-004",
    "date": "2026-09-01",
    "idea": "leanbrokers-ci-deploy",
    "kind": "branch",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-02-001",
    "date": "2026-09-02",
    "idea": "leanbrokers-ci-deploy",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-14-001",
    "date": "2026-09-14",
    "idea": "leanbrokers-ci-deploy",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-001",
    "date": "2026-09-17",
    "idea": "session-panel",
    "kind": "spark",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-002",
    "date": "2026-09-17",
    "idea": "session-panel",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-003",
    "date": "2026-09-17",
    "idea": "session-panel",
    "kind": "pivot",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-004",
    "date": "2026-09-17",
    "idea": "session-panel",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-005",
    "date": "2026-09-17",
    "idea": "session-panel",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-006",
    "date": "2026-09-17",
    "idea": "session-panel",
    "kind": "branch",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-007",
    "date": "2026-09-17",
    "idea": "panels-api",
    "kind": "spark",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-008",
    "date": "2026-09-17",
    "idea": "panels-api",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-009",
    "date": "2026-09-17",
    "idea": "dynamic-ui",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-010",
    "date": "2026-09-17",
    "idea": "dynamic-ui",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-011",
    "date": "2026-09-17",
    "idea": "idea-diary",
    "kind": "spark",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-012",
    "date": "2026-09-17",
    "idea": "idea-diary",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-013",
    "date": "2026-09-17",
    "idea": "idea-diary",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-17-014",
    "date": "2026-09-17",
    "idea": "idea-diary",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-19-001",
    "date": "2026-09-19",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-19-002",
    "date": "2026-09-19",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-19-003",
    "date": "2026-09-19",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-19-004",
    "date": "2026-09-19",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-19-005",
    "date": "2026-09-19",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-19-006",
    "date": "2026-09-19",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-21-001",
    "date": "2026-09-21",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-22-001",
    "date": "2026-09-22",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-22-002",
    "date": "2026-09-22",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-22-003",
    "date": "2026-09-22",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-22-004",
    "date": "2026-09-22",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-24-001",
    "date": "2026-09-24",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-24-002",
    "date": "2026-09-24",
    "idea": "leanbrokers-consent-invites",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-24-003",
    "date": "2026-09-24",
    "idea": "leanbrokers-consent-invites",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-001",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-002",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-003",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-004",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-005",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-006",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-007",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-008",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-25-009",
    "date": "2026-09-25",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-26-001",
    "date": "2026-09-26",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-001",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-002",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-003",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-004",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-005",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-006",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-007",
    "date": "2026-09-27",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-008",
    "date": "2026-09-27",
    "idea": "family-battleship",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-27-009",
    "date": "2026-09-27",
    "idea": "family-battleship",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-28-001",
    "date": "2026-09-28",
    "idea": "leanbrokers-2-0-pricing",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-28-002",
    "date": "2026-09-28",
    "idea": "leanbrokers-2-0-pricing",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-28-003",
    "date": "2026-09-28",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-09-28-004",
    "date": "2026-09-28",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-09-29-001",
    "date": "2026-09-29",
    "idea": "leanbrokers-outreach-repeat-and-opens",
    "kind": "spark",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-09-29-002",
    "date": "2026-09-29",
    "idea": "leanbrokers-outreach-repeat-and-opens",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-10-01-001",
    "date": "2026-10-01",
    "idea": "r4box-devbox",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-02-001",
    "date": "2026-10-02",
    "idea": "r4box-devbox",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-02-002",
    "date": "2026-10-02",
    "idea": "r4box-devbox",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-02-003",
    "date": "2026-10-02",
    "idea": "r4box-devbox",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-06-001",
    "date": "2026-10-06",
    "idea": "leanbrokers-apex-site-outage",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-001",
    "date": "2026-10-09",
    "idea": "lean-provider-recon",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-002",
    "date": "2026-10-09",
    "idea": "lean-provider-recon",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-003",
    "date": "2026-10-09",
    "idea": "lean-provider-recon",
    "kind": "deepen",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-004",
    "date": "2026-10-09",
    "idea": "lean-provider-recon",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-005",
    "date": "2026-10-09",
    "idea": "lean-provider-recon",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-006",
    "date": "2026-10-09",
    "idea": "leanbrokers-outreach-list-split",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-007",
    "date": "2026-10-09",
    "idea": "leanbrokers-outreach-list-split",
    "kind": "ship",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-008",
    "date": "2026-10-09",
    "idea": "leanbrokers-security-hardening",
    "kind": "revive",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-09-009",
    "date": "2026-10-09",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-001",
    "date": "2026-10-12",
    "idea": "leanbrokers-crm-vps-migration",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-002",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-003",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-004",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-005",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-006",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-007",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "ship",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-008",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-009",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-010",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-011",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-12-012",
    "date": "2026-10-12",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-001",
    "date": "2026-10-15",
    "idea": "lean-provider-recon",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-002",
    "date": "2026-10-15",
    "idea": "lean-provider-recon",
    "kind": "deepen",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-003",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-launch",
    "kind": "ship",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-004",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-005",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-launch",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-006",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-pricing",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-007",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-pricing",
    "kind": "ship",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-008",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-pricing",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-009",
    "date": "2026-10-15",
    "idea": "leanbrokers-2-0-pricing",
    "kind": "deepen",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-010",
    "date": "2026-10-15",
    "idea": "leanbrokers-public-website",
    "kind": "spark",
    "effort": 1,
    "backfilled": false
  }, {
    "id": "ev-2026-10-15-011",
    "date": "2026-10-15",
    "idea": "leanbrokers-public-website",
    "kind": "ship",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-001",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "spark",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-002",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-003",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-004",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-005",
    "date": "2026-10-16",
    "idea": "r4os-agent-payments",
    "kind": "branch",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-006",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-007",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 4,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-008",
    "date": "2026-10-16",
    "idea": "r4os-agent-payments",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-009",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-010",
    "date": "2026-10-16",
    "idea": "r4os-agent-payments",
    "kind": "park",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-011",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-012",
    "date": "2026-10-16",
    "idea": "r4os",
    "kind": "deepen",
    "effort": 3,
    "backfilled": false
  }, {
    "id": "ev-2026-10-16-013",
    "date": "2026-10-16",
    "idea": "dynamic-ui",
    "kind": "deepen",
    "effort": 2,
    "backfilled": false
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/diary-tree-data.js", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/diary-tree.js
try { (() => {
/* Clearing's idea tree, lifted verbatim from byndbelief/clearing site/index.html
   (buildTreeSegments, fitSegments, prepSpin, paintTree and helpers).
   Wrapped so it can run as a background: mountDiaryTree(canvas, data, opts). */
(function () {
  var QUIET_DAYS = 14;
  var SPIN = Math.PI * 2 / 40000;
  function makeTree() {
    var PALETTE = {};
    var FLOW = null,
      FLAT = false,
      FILL = false,
      NODE = 1,
      SEG = 1;
    var state, treeState;
    function todayISO() {
      var d = new Date(),
        m = d.getMonth() + 1,
        day = d.getDate();
      return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
    }
    function dayNum(d) {
      var t = Date.parse(String(d) + "T00:00:00Z");
      return isNaN(t) ? null : Math.round(t / 86400000);
    }
    function daysBetween(a, b) {
      var x = dayNum(a),
        y = dayNum(b);
      return x == null || y == null ? 0 : y - x;
    }
    function isBackfilled(ev) {
      return ev && ev.backfilled === true;
    }

    /* ---------------- derived idea state ---------------- */
    function eventsFor(id) {
      return state.events.filter(function (e) {
        return e.idea === id;
      });
    }
    function eventsFor(id) {
      return state.events.filter(function (e) {
        return e.idea === id;
      });
    }
    function ideaState(idea) {
      var evs = eventsFor(idea.id);
      var last = evs.length ? evs[evs.length - 1].date : idea.created;
      var quiet = Math.max(0, daysBetween(last, todayISO()));
      var effort = evs.reduce(function (s, e) {
        return s + (Number(e.effort) || 0);
      }, 0);

      // parked = stage says so, or a park event with no later revive
      var parked = idea.stage === "parked";
      if (!parked) {
        for (var i = evs.length - 1; i >= 0; i--) {
          if (evs[i].kind === "revive") break;
          if (evs[i].kind === "park") {
            parked = true;
            break;
          }
        }
      }
      var shipped = idea.stage === "shipped";
      var kindState = parked ? "parked" : shipped ? "shipped" : quiet > QUIET_DAYS ? "quiet" : "active";
      return {
        evs: evs,
        last: last,
        quiet: quiet,
        effort: effort,
        parked: parked,
        shipped: shipped,
        status: kindState,
        color: parked ? "var(--c-park)" : shipped ? "var(--c-close)" : kindState === "quiet" ? "var(--bark)" : "var(--c-growth)"
      };
    }
    function hash32(str) {
      var h = 2166136261,
        i;
      for (i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = h * 16777619 >>> 0;
      }
      return h >>> 0;
    }
    function rnd(seed, n) {
      // nth value in [0,1) for a seed
      var h = (hash32(seed) ^ n * 2654435761) >>> 0;
      h = (h ^ h >>> 15) * 2246822507;
      h = (h ^ h >>> 13) * 3266489909;
      return ((h ^ h >>> 16) >>> 0) % 100000 / 100000;
    }
    function spread(seed, n, amount) {
      return (rnd(seed, n) - 0.5) * 2 * amount;
    }
    // A branch may lean hard but never grow downward: keep every angle within
    // a limit of straight up, or limbs sag and the thing stops reading as a
    // tree. Limbs get 83 degrees -- tight enough to read, wide enough that the
    // canopy can actually reach sideways instead of growing a pole. Twigs pass
    // a looser limit, because real twigs droop and the chaos is the point.
    function clampUp(a, lim) {
      var up = -Math.PI / 2;
      if (lim == null) lim = 1.45;
      if (a < up - lim) return up - lim;
      if (a > up + lim) return up + lim;
      return a;
    }
    function clampUp(a, lim) {
      var up = -Math.PI / 2;
      if (lim == null) lim = 1.45;
      if (a < up - lim) return up - lim;
      if (a > up + lim) return up + lim;
      return a;
    }
    function ideaTree() {
      var kids = {},
        roots = [];
      state.ideas.forEach(function (i) {
        kids[i.id] = [];
      });
      state.ideas.forEach(function (i) {
        if (i.parent && kids[i.parent]) kids[i.parent].push(i);else roots.push(i);
      });
      function byCreated(a, b) {
        return String(a.created).localeCompare(String(b.created)) || String(a.id).localeCompare(String(b.id));
      }
      roots.sort(byCreated);
      Object.keys(kids).forEach(function (k) {
        kids[k].sort(byCreated);
      });
      return {
        roots: roots,
        kids: kids
      };
    }
    function timeSpan() {
      var all = [];
      state.ideas.forEach(function (i) {
        if (dayNum(i.created) != null) all.push(i.created);
      });
      state.events.forEach(function (e) {
        if (dayNum(e.date) != null) all.push(e.date);
      });
      all.sort();
      var today = todayISO();
      var start = all[0] || today;
      var end = all.length && all[all.length - 1] > today ? all[all.length - 1] : today;
      return {
        start: start,
        end: end,
        days: Math.max(1, daysBetween(start, end))
      };
    }
    function prepSpin(segs, w) {
      var t = ideaTree(),
        parent = {};
      Object.keys(t.kids).forEach(function (pid) {
        t.kids[pid].forEach(function (k) {
          parent[k.id] = pid;
        });
      });
      function rootOf(id) {
        var n = 0;
        while (parent[id] && n++ < 50) id = parent[id];
        return id;
      }
      var trunk = segs.filter(function (g) {
        return g.kind === "trunk";
      })[0];
      var cx = trunk ? trunk.x1 : 0,
        maxR = 1;
      segs.forEach(function (g) {
        g.ax1 = g.x1 - cx;
        g.ax2 = g.x2 - cx;
        g.phi = g.idea ? rnd(rootOf(g.idea), 21) * Math.PI : 0;
        maxR = Math.max(maxR, Math.abs(g.ax1), Math.abs(g.ax2));
      });
      // Turned, most limbs are seen at a slant and the crown looks thinner than
      // the flat tree did; spread it a little wider, never past the frame.
      var room = Math.min(cx, w - cx) - 20;
      var widen = Math.max(1, Math.min(1.35, room / maxR));
      segs.forEach(function (g) {
        g.ax1 *= widen;
        g.ax2 *= widen;
      });
      treeState.cx = cx;
      treeState.maxR = maxR * widen;
    }
    function projectSpin(segs) {
      var th = treeState.theta,
        cx = treeState.cx;
      segs.forEach(function (g) {
        if (g.ax1 === undefined) return;
        var c = FLAT ? 1 : Math.cos(g.phi + th),
          sn = FLAT ? 0 : Math.sin(g.phi + th);
        g.x1 = cx + g.ax1 * c;
        g.x2 = cx + g.ax2 * c;
        g.z = (g.ax1 + g.ax2) / 2 * sn;
      });
    }
    function depthOf(g) {
      // 1 in front, 0.5 at the back
      return 0.5 + 0.5 * ((g.z || 0) / treeState.maxR + 1) / 2;
    }
    function cssVar(name) {
      if (PALETTE[name]) return PALETTE[name];
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
    }
    function buildTreeSegments(w, h) {
      var span = timeSpan(),
        t = ideaTree();
      // The trunk carries time, but it does not get the whole frame. Given the
      // full height it dominates, and because the fit is isotropic the whole
      // picture ends up height-locked -- a pole in an empty field. Just over
      // half leaves the rest of the frame for the canopy to spread into.
      var baseY = h - 26,
        topY = 46,
        trunkH = (baseY - topY) * 0.52,
        cx = w / 2;
      var segs = [];
      function yFor(date) {
        var d = Math.max(0, Math.min(span.days, daysBetween(span.start, date)));
        return baseY - d / span.days * trunkH;
      }
      // Trunk tapers as it rises. The bare stretch above the newest limb is real
      // -- nothing has started up there -- so it is drawn, but thin enough not to
      // dominate the picture.
      // The trunk stops a little above the newest limb rather than running on to
      // the top of the frame: the stretch past the last idea is real but empty,
      // and drawn full height it reads as a spike poking out of the canopy.
      var newest = 0,
        ri;
      for (ri = 0; ri < t.roots.length; ri++) {
        newest = Math.max(newest, baseY - yFor(t.roots[ri].created));
      }
      var tipH = Math.min(trunkH, newest);
      var TSEG = 14,
        ti;
      for (ti = 0; ti < TSEG; ti++) {
        var ya = baseY - tipH * ti / TSEG,
          yb = baseY - tipH * (ti + 1) / TSEG;
        segs.push({
          x1: cx,
          y1: ya,
          x2: cx,
          y2: yb,
          w: 12.5 * Math.pow(1 - ti / TSEG, 1.15) + 1,
          kind: "trunk",
          order: -1
        });
      }
      var orderCounter = 0;

      // Twigs recurse. One straight stub per unit of effort reads as stubble;
      // the same budget spent on a forking twig reads as foliage, and the
      // silhouette picks up the self-similarity that makes a tree a tree.
      // Effort still decides how much there is, so the ornament stays the data.
      function twig(ox, oy, a, len, wd, gen, maxGen, ev, st, idea) {
        var nx = ox + Math.cos(a) * len,
          ny = oy + Math.sin(a) * len;
        var terminal = gen >= maxGen || len < 4;
        segs.push({
          x1: ox,
          y1: oy,
          x2: nx,
          y2: ny,
          w: Math.max(0.5, wd),
          idea: idea.id,
          event: ev.id,
          twig: true,
          tip: terminal,
          gen: gen,
          kind: ev.kind,
          effort: Number(ev.effort) || 1,
          quiet: st.quiet,
          parked: st.parked,
          order: orderCounter++
        });
        if (terminal) return;
        var j;
        for (j = 0; j < 2; j++) {
          var ja = a + (j ? 1 : -1) * (0.34 + gen * 0.1) + spread(ev.id, gen * 7 + j, 0.42);
          twig(nx, ny, clampUp(ja, 1.95), len * 0.62, wd * 0.74, gen + 1, maxGen, ev, st, idea);
        }
      }
      function limb(idea, ox, oy, angle, thick, depth, lim) {
        var st = ideaState(idea);
        var evs = st.evs;
        var px = ox,
          py = oy,
          a = angle,
          seed = idea.id;
        var base = angle; // the limb's own direction, to pull back toward
        var curl = rnd(idea.id, 13) < 0.5 ? -1 : 1; // which way this one coils
        var prev = idea.created;
        var kids = t.kids[idea.id] || [];
        var kidByDate = {};
        kids.forEach(function (k) {
          (kidByDate[k.created] = kidByDate[k.created] || []).push(k);
        });

        // reach away from the trunk before the first event, so limbs separate
        var lead = 30 + depth * 5;
        var lx = px + Math.cos(a) * lead,
          ly = py + Math.sin(a) * lead;
        segs.push({
          x1: px,
          y1: py,
          x2: lx,
          y2: ly,
          w: thick,
          idea: idea.id,
          order: orderCounter++
        });
        px = lx;
        py = ly;
        evs.forEach(function (ev, n) {
          var gap = Math.max(0, daysBetween(prev, ev.date));
          // Segment length lives in a narrow band on purpose. Let it range freely
          // and the tree reads by accident: a two-event idea after a long
          // silence draws the widest limb on the canvas, while a thirty-event
          // idea decays to segments shorter than the dots drawn on them and
          // piles into a caterpillar. Clamped, visual weight tracks substance.
          var decay = 0.34 + 0.66 * Math.pow(0.87, n);
          var raw = 17 + Math.min(34, gap * 1.4) + (Number(ev.effort) || 1) * 4.2;
          var len = Math.max(13, Math.min(56, raw * decay));
          a += spread(seed, n, 0.46) + (depth ? 0 : spread(seed, n + 97, 0.1));
          if (ev.kind === "pivot") a += spread(ev.id, 3, 0.9);
          // A long-running idea should coil, not march. Each step turns a little
          // further than the last, always the same way, so the limb traces a
          // spiral that tightens as it goes: wide and open at the start, a dense
          // rosette thirty events in. Zig-zagging instead only made a rope.
          a += curl * Math.min(0.5, 0.1 + n * 0.035);
          // Each segment wanders, then gets pulled back toward a heading -- its
          // own at first, bending toward straight up the longer the limb gets.
          // Pulling toward the original heading forever draws a long straight
          // spoke; bending upward makes a long idea arc back into the canopy.
          var target = base + (-Math.PI / 2 - base) * Math.min(0.85, n * 0.07);
          a += (target - a) * (0.18 + Math.min(0.3, n * 0.02));
          // The ceiling lifts as the limb thins out, and past a dozen events it
          // lets go entirely. A heavy limb near the trunk must not sag; a fine
          // shoot far out may coil however it likes. Held to a ceiling the
          // spiral cannot close -- it just slides along the limit and draws a
          // lasso across the frame.
          a = clampUp(a, lim + Math.min(2.4, n * 0.16));
          var sl = len * SEG;
          var nx = px + Math.cos(a) * sl,
            ny = py + Math.sin(a) * sl;
          thick = Math.max(1.1, thick * 0.9);
          segs.push({
            x1: px,
            y1: py,
            x2: nx,
            y2: ny,
            w: thick,
            idea: idea.id,
            event: ev.id,
            kind: ev.kind,
            effort: Number(ev.effort) || 1,
            backfilled: isBackfilled(ev),
            quiet: st.quiet,
            parked: st.parked,
            order: orderCounter++
          });
          // bushiness is effort: how many twigs leave the node, and how many
          // times each one forks before it ends in a leaf
          var eff = Math.min(5, Number(ev.effort) || 1);
          var nroot = Math.max(2, Math.min(4, eff));
          var maxGen = eff >= 4 ? 3 : eff >= 2 ? 2 : 1;
          var k;
          for (k = 0; k < nroot; k++) {
            var ta = a + spread(ev.id, k, 1.2);
            var tl = len * (0.30 + rnd(ev.id, k + 11) * 0.30);
            twig(nx, ny, clampUp(ta, 1.95), tl, Math.max(0.6, thick * 0.46), 1, maxGen, ev, st, idea);
          }
          if (ev.kind === "branch" || ev.kind === "merge") a -= spread(ev.id, 7, 0.5);
          px = nx;
          py = ny;
          prev = ev.date;
          (kidByDate[ev.date] || []).forEach(function (kid, m) {
            limb(kid, px, py, a + (m % 2 ? 0.75 : -0.75) + spread(kid.id, 1, 0.3), Math.max(1.6, thick * 0.78), depth + 1, lim);
            delete kidByDate[ev.date];
          });
        });
        Object.keys(kidByDate).forEach(function (d) {
          kidByDate[d].forEach(function (kid, m) {
            limb(kid, px, py, a + (m % 2 ? 0.8 : -0.8), Math.max(1.6, thick * 0.75), depth + 1, lim);
          });
        });
      }

      // Which way a limb leans must not track the calendar. Fanning i/(n-1)
      // across a date-sorted list bakes in "old leans left, new leans right",
      // and the whole tree sweeps one way. So: side comes from the idea's own
      // hash, balanced so neither side runs away; how far it leans comes from
      // where it meets the trunk, because a tree spreads low and reaches high.
      var balance = 0;
      t.roots.forEach(function (idea) {
        var y = yFor(idea.created);
        var up = (baseY - y) / Math.max(1, trunkH); // 0 at the ground, 1 at the top
        var side = rnd(idea.id, 5) < 0.5 ? -1 : 1;
        if (balance >= 1) side = -1;else if (balance <= -1) side = 1;
        balance += side;
        var mag = 0.56 + (1 - up) * 0.74 + spread(idea.id, 2, 0.16);
        // A limb low on the trunk reaches out, but it must not then wander down
        // past the root it grew from -- so the lower it starts, the tighter the
        // ceiling on how far its own events may swing it.
        var lim = 1.04 + up * 0.41;
        limb(idea, cx, y, clampUp(-Math.PI / 2 + side * mag, lim), 7.5, 0, lim);
      });
      return fitSegments(segs, w, h);
    }
    function fitSegments(segs, w, h) {
      var pad = 26,
        minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      segs.forEach(function (g) {
        minX = Math.min(minX, g.x1, g.x2);
        maxX = Math.max(maxX, g.x1, g.x2);
        minY = Math.min(minY, g.y1, g.y2);
        maxY = Math.max(maxY, g.y1, g.y2);
      });
      var bw = Math.max(1, maxX - minX),
        bh = Math.max(1, maxY - minY);
      var k = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
      k = Math.max(0.35, Math.min(k, 2.6));
      // A canopy narrower than the frame strands the tree in a column of white.
      // Stretch it sideways to fill, but gently -- past about a third the limbs
      // start to look sheared rather than grown. Height is never stretched, so
      // the trunk keeps its scale and the dates stay where they are.
      var kx = k;
      if (bw * k < (w - pad * 2) * 0.88) kx = Math.min(k * 1.45, (w - pad * 2) / bw);
      var ky = FILL ? Math.max(k, Math.min((h - pad * 2) / bh, k * 2.2)) : k;
      var ox = (w - bw * kx) / 2 - minX * kx,
        oy = h - pad - maxY * ky;
      if (FILL) {
        // r4box addition: keep the trunk on the centre line, canopy fitted to the wider side
        var tr = segs.filter(function (g) {
          return g.kind === "trunk";
        })[0];
        if (tr) {
          var half = Math.max(1, tr.x1 - minX, maxX - tr.x1);
          kx = Math.min(k * 1.45, (w / 2 - pad) / half);
          ox = w / 2 - tr.x1 * kx;
        }
      }
      segs.forEach(function (g) {
        g.x1 = g.x1 * kx + ox;
        g.y1 = g.y1 * ky + oy;
        g.x2 = g.x2 * kx + ox;
        g.y2 = g.y2 * ky + oy;
        g.w = Math.max(0.5, g.w * Math.min(1.5, k));
        g.k = k;
      });
      return segs;
    }
    function paintTree(cv, upto) {
      var ctx = cv.getContext("2d"),
        w = cv._w,
        h = cv._h;
      var segs = treeState.segs;
      if (upto == null) upto = segs.length;
      var bark = cssVar("--bark"),
        park = cssVar("--c-park");
      var cGrow = cssVar("--c-growth"),
        cTurn = cssVar("--c-turn"),
        cClose = cssVar("--c-close"),
        cAcc = cssVar("--accent"),
        ground = cssVar("--ground");
      ctx.clearRect(0, 0, w, h);
      projectSpin(segs);
      // Far side first, so the near side is drawn over it.
      var drawn = segs.slice().sort(function (a, b) {
        return (a.z || 0) - (b.z || 0);
      });
      ctx.lineCap = "round";
      drawn.forEach(function (sg, i) {
        if (sg.order >= upto) return;
        var sel = state.sel && sg.idea === state.sel;
        var dim = state.sel && sg.idea && !sel ? 0.22 : 1;
        var life = sg.parked ? 0.4 : sg.quiet > 60 ? 0.45 : sg.quiet > QUIET_DAYS ? 0.65 : 1;
        ctx.globalAlpha = (sg.kind === "trunk" ? 0.75 : 0.9) * life * dim;
        ctx.strokeStyle = sg.parked ? park : bark;
        ctx.lineWidth = sg.w;
        ctx.globalAlpha *= depthOf(sg);
        if (treeState.hover && treeState.hover === sg.idea) {
          ctx.strokeStyle = cAcc;
          ctx.globalAlpha = 0.95;
        }
        ctx.beginPath();
        ctx.moveTo(sg.x1, sg.y1);
        ctx.lineTo(sg.x2, sg.y2);
        ctx.stroke();
      });

      // r4box addition: colour pulses flowing out from the root, calm at the trunk to hot at the tips
      if (FLOW) {
        var tnow = performance.now() / 1000,
          cols = FLOW.colors;
        ctx.globalCompositeOperation = "lighter";
        drawn.forEach(function (sg) {
          if (sg.order >= upto || sg.d == null) return;
          var ph = (tnow * FLOW.speed - sg.d / FLOW.wave) % 1;
          if (ph < 0) ph += 1;
          var b = Math.max(0, 1 - ph * FLOW.tail);
          if (b <= 0) return;
          var f = Math.min(0.999, sg.d / FLOW.maxD) * (cols.length - 1),
            ci = Math.floor(f);
          ctx.strokeStyle = cols[ci];
          ctx.globalAlpha = b * b * 0.9 * depthOf(sg) * (sg.parked ? 0.35 : 1);
          ctx.lineWidth = Math.max(1.2, sg.w * 0.75);
          ctx.beginPath();
          ctx.moveTo(sg.x1, sg.y1);
          ctx.lineTo(sg.x2, sg.y2);
          ctx.stroke();
        });
        ctx.globalCompositeOperation = "source-over";
      }

      // foliage last, so it sits on the wood
      drawn.forEach(function (sg) {
        if (sg.order >= upto || !sg.event || sg.kind === "trunk") return;
        var sel = state.sel && sg.idea === state.sel;
        var dim = state.sel && !sel ? 0.2 : 1;
        var life = sg.parked ? 0 : sg.quiet > 60 ? 0.18 : sg.quiet > QUIET_DAYS ? 0.5 : 1;
        var col = null,
          r = 0;
        if (sg.twig) {
          // only the tip of a forking twig carries a leaf -- a dot at every
          // fork turns the canopy into soup
          if (life <= 0 || !sg.tip) return;
          col = cClose;
          r = (1.7 + (sg.effort || 1) * 0.18) * Math.min(1.5, sg.k || 1);
          ctx.globalAlpha = 0.46 * life * dim;
        } else if (sg.kind === "ship") {
          col = cAcc;
          r = 4.6 * Math.min(1.5, sg.k || 1);
          ctx.globalAlpha = 0.95 * dim;
        } else if (sg.kind === "branch" || sg.kind === "pivot" || sg.kind === "merge") {
          col = cTurn;
          r = 3.6 * Math.min(1.5, sg.k || 1);
          ctx.globalAlpha = 0.9 * dim;
        } else if (sg.kind === "spark" || sg.kind === "revive") {
          col = cGrow;
          r = 3.4 * Math.min(1.5, sg.k || 1);
          ctx.globalAlpha = 0.9 * dim;
        } else if (sg.kind === "park") {
          col = park;
          r = 3 * Math.min(1.5, sg.k || 1);
          ctx.globalAlpha = 0.8 * dim;
        } else {
          col = cClose;
          r = (2.6 + (sg.effort || 1) * 0.25) * Math.min(1.5, sg.k || 1);
          ctx.globalAlpha = (0.35 + 0.5 * life) * dim;
        }
        if (!col) return;
        if (!sg.twig) r *= NODE;
        ctx.globalAlpha *= depthOf(sg);
        // r4box addition: buds, blossoms and fruit glow, each breathing on its own beat
        if (FLOW) {
          var a0 = ctx.globalAlpha,
            beat = 0.75 + 0.25 * Math.sin(performance.now() / 900 + rnd(sg.event || "x", 31) * 6.283);
          ctx.globalCompositeOperation = "lighter";
          var halo = sg.twig ? r * 3.2 : r * 4.4;
          var gr = ctx.createRadialGradient(sg.x2, sg.y2, 0, sg.x2, sg.y2, halo);
          gr.addColorStop(0, col);
          gr.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gr;
          ctx.globalAlpha = Math.min(1, a0 * (sg.twig ? 0.55 : 0.85) * beat);
          ctx.beginPath();
          ctx.arc(sg.x2, sg.y2, halo, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = Math.min(1, a0 * (sg.twig ? 1.6 : 1.1));
        }
        ctx.beginPath();
        ctx.arc(sg.x2, sg.y2, r, 0, Math.PI * 2);
        if (sg.backfilled) {
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = ground;
          ctx.globalAlpha *= 0.7;
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    }
    return function (cv, data, opts) {
      opts = opts || {};
      PALETTE = opts.palette || {};
      FLOW = opts.flow || null;
      FLAT = opts.spin === false;
      FILL = !!opts.fill;
      NODE = opts.nodeScale || 1;
      SEG = opts.segScale || 1;
      state = {
        ideas: data.ideas,
        events: data.events,
        sel: null,
        view: "tree"
      };
      treeState = {
        raf: 0,
        segs: [],
        hover: null,
        t: 1,
        theta: 0,
        cx: 0,
        maxR: 1,
        drag: null,
        held: false
      };
      var alive = true;
      function size() {
        var r = cv.parentNode.getBoundingClientRect(),
          dpr = window.devicePixelRatio || 1;
        var w = Math.max(200, r.width),
          h = Math.max(200, r.height);
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        cv.style.width = w + "px";
        cv.style.height = h + "px";
        cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
        cv._w = w;
        cv._h = h;
        treeState.segs = buildTreeSegments(w, h);
        if (FLOW) {
          var base = null,
            maxD = 1;
          treeState.segs.forEach(function (g) {
            if (g.kind === "trunk" && (!base || g.y1 > base.y1)) base = g;
          });
          treeState.segs.forEach(function (g) {
            g.d = Math.hypot((g.x1 + g.x2) / 2 - base.x1, (g.y1 + g.y2) / 2 - base.y1);
            maxD = Math.max(maxD, g.d);
          });
          FLOW.maxD = maxD;
        }
        prepSpin(treeState.segs, w);
      }
      function layout() {
        if (!opts.onLayout) return;
        projectSpin(treeState.segs);
        opts.onLayout(treeState.segs.filter(function (g) {
          return g.event && (!g.twig || opts.withTips && g.tip);
        }).map(function (g) {
          return {
            id: g.event,
            kind: g.kind,
            tip: !!g.twig,
            x: g.x2,
            y: g.y2
          };
        }), cv._w, cv._h);
      }
      size();
      layout();
      var total = treeState.segs.length,
        reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var t0 = performance.now(),
        last = t0,
        DUR = 2200;
      function frame(now) {
        if (!alive) return;
        var p = Math.min(1, (now - t0) / DUR);
        treeState.t = p < 1 ? 1 - Math.pow(1 - p, 3) : 1;
        if (opts.spin !== false) treeState.theta += (now - last) * SPIN;
        last = now;
        paintTree(cv, Math.round(treeState.t * treeState.segs.length));
        treeState.raf = requestAnimationFrame(frame);
      }
      if (reduce) paintTree(cv, total);else treeState.raf = requestAnimationFrame(frame);
      var ro = new ResizeObserver(function () {
        size();
        layout();
        if (reduce) paintTree(cv);
      });
      ro.observe(cv.parentNode);
      return function () {
        alive = false;
        cancelAnimationFrame(treeState.raf);
        ro.disconnect();
      };
    };
  }
  window.mountDiaryTree = function (cv, data, opts) {
    return makeTree()(cv, data, opts);
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/diary-tree.js", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/fun-shared.jsx
try { (() => {
// shared bits for the playful logins
const lgPhase = r => r < 3 ? '#3DD6C6' : r < 3.5699 ? '#B9A6FF' : r < 3.83 ? '#F5C542' : '#FF5A4A';
function useCanvas(draw, deps) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const paint = () => {
      const r = cv.parentNode.getBoundingClientRect(),
        dpr = window.devicePixelRatio || 1;
      cv.width = r.width * dpr;
      cv.height = r.height * dpr;
      cv.style.width = r.width + 'px';
      cv.style.height = r.height + 'px';
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, r.width, r.height);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(cv.parentNode);
    return () => ro.disconnect();
  }, deps);
  return ref;
}
// draws the attractor from r=2.6 up to rMax across the full width
function drawAttractor(ctx, w, h, rMax, R0 = 2.6) {
  ctx.clearRect(0, 0, w, h);
  const cols = Math.ceil(w);
  for (let c = 0; c < cols; c++) {
    const r = R0 + (4 - R0) * (c / cols);
    if (r > rMax) break;
    let x = .5;
    for (let i = 0; i < 200; i++) x = r * x * (1 - x);
    ctx.fillStyle = lgPhase(r);
    ctx.globalAlpha = .55;
    for (let i = 0; i < 90; i++) {
      x = r * x * (1 - x);
      ctx.fillRect(c, h - x * h, 1.2, 1.2);
    }
  }
  ctx.globalAlpha = 1;
}
function FallbackLink({
  onClick
}) {
  return /*#__PURE__*/React.createElement(LG.Button, {
    variant: "link",
    onClick: onClick,
    style: {
      color: 'var(--r4-muted)'
    }
  }, "Use a password or email link");
}
Object.assign(window, {
  lgPhase,
  useCanvas,
  drawAttractor,
  FallbackLink
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/fun-shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/r4box-home/login-shared.jsx
try { (() => {
const LG = window.R4boxDesignSystem_3e3a61;
const lgFamily = [{
  name: 'phoenix_lord',
  src: '../../assets/avatars/phoenix_lord.jpg'
}, {
  name: 'dad_commander'
}, {
  name: 'obanai_rocks'
}];
function LoginBg({
  mobile,
  strength = .9
}) {
  const mask = mobile ? 'linear-gradient(180deg, #000 0%, #000 45%, #0000 80%)' : 'linear-gradient(180deg, transparent, #000 18%, #000 70%, transparent), linear-gradient(90deg, #0000001a 0 30%, #000 72%)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      opacity: strength,
      maskImage: mask,
      WebkitMaskImage: mask,
      maskComposite: 'intersect',
      WebkitMaskComposite: 'source-in'
    }
  }, /*#__PURE__*/React.createElement(LG.Bifurcation, {
    height: "100%"
  }));
}
// fake passkey / Face ID prompt: waiting → ok
function usePasskey(onDone) {
  const [st, setSt] = React.useState('idle');
  const go = () => {
    setSt('wait');
    setTimeout(() => {
      setSt('ok');
      setTimeout(onDone, 700);
    }, 1300);
  };
  return [st, go, () => setSt('idle')];
}
function PasskeySheet({
  st,
  who,
  onCancel
}) {
  if (st === 'idle') return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 5,
      display: 'grid',
      placeItems: 'end center',
      background: '#0B091899'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(390px, 100%)',
      boxSizing: 'border-box',
      margin: 12,
      padding: '22px 20px 18px',
      borderRadius: 24,
      background: 'var(--r4-panel-2)',
      border: '1px solid var(--r4-line)',
      display: 'grid',
      justifyItems: 'center',
      gap: 12,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 18,
      display: 'grid',
      placeItems: 'center',
      fontSize: 30,
      border: `2px solid ${st === 'ok' ? 'var(--teal)' : 'var(--r4-line)'}`,
      color: st === 'ok' ? 'var(--teal)' : 'var(--r4-muted)',
      transition: 'all .2s'
    }
  }, st === 'ok' ? '✓' : '◎'), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 16
    }
  }, st === 'ok' ? 'Passkey confirmed' : 'Sign in to r4box'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--r4-muted)'
    }
  }, st === 'ok' ? 'Opening the box…' : `Use Face ID or your passkey for ${who}.`), st === 'wait' && /*#__PURE__*/React.createElement(LG.Button, {
    variant: "link",
    onClick: onCancel
  }, "Cancel")));
}
function SignedIn({
  who,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      gap: 14,
      alignContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement(LG.R4Mark, null), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '800 clamp(26px, 6vw, 40px)/1 var(--font-display)',
      letterSpacing: '-.035em',
      margin: 0
    }
  }, "Welcome back, ", who, "."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--r4-muted)',
      margin: 0
    }
  }, "Signed in to the game room and the box."), /*#__PURE__*/React.createElement(LG.Button, {
    variant: "link",
    onClick: onBack
  }, "Sign out"));
}
const lgLinkSent = email => `Check ${email} for your sign-in link.`;
Object.assign(window, {
  LG,
  lgFamily,
  LoginBg,
  usePasskey,
  PasskeySheet,
  SignedIn,
  lgLinkSent
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/r4box-home/login-shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Bifurcation = __ds_scope.Bifurcation;

__ds_ns.R4Mark = __ds_scope.R4Mark;

__ds_ns.BotStep = __ds_scope.BotStep;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.EnterButton = __ds_scope.EnterButton;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.LiveDot = __ds_scope.LiveDot;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.Status = __ds_scope.Status;

__ds_ns.Board = __ds_scope.Board;

__ds_ns.BoardCell = __ds_scope.BoardCell;

__ds_ns.Stamp = __ds_scope.Stamp;

__ds_ns.GamesDoor = __ds_scope.GamesDoor;

__ds_ns.HubTile = __ds_scope.HubTile;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.GameCard = __ds_scope.GameCard;

__ds_ns.GamePreview = __ds_scope.GamePreview;

__ds_ns.GameRow = __ds_scope.GameRow;

__ds_ns.QuickEntry = __ds_scope.QuickEntry;

__ds_ns.UpCard = __ds_scope.UpCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.StatCard = __ds_scope.StatCard;

})();
