// 하루 = 한국시간 아침 8시 ~ 다음날 아침 8시
const PARTS = ['hat', 'top', 'bottom', 'shoes', 'item'];
const PART_NAMES = { hat: '모자', top: '상의', bottom: '하의', shoes: '신발', item: '아이템' };
const MEMBERS = ['승현', '물결', '하연', '하린', '서빈'];
const FIXED = { hat: '승현', top: '서빈', bottom: '하연', shoes: '물결', item: '하린' }; // 10/29~10/30
const PALETTE = ['#FF2E93', '#1FD655', '#2D5BFF', '#FF6A00', '#9B3BFF', '#00C2D1', '#FF3B30', '#E5B800'];
const DAY = 864e5;
const FIRST_DAY = Date.UTC(2026, 9, 29);
const RANDOM_START = Date.UTC(2026, 9, 31); // 10/31 아침 8시부터 랜덤
const LAST_DAY = RANDOM_START + 29 * DAY;   // 30일 → 11/29, 이후엔 마지막 날 배정 유지

// KST(+9h)에서 8시간 당기면 자정 기준 날짜가 됨
const dayOf = (t) => Math.floor((t + 1 * 3600e3) / DAY) * DAY;

// 날짜를 시드로 쓰는 셔플 — 누가 열어도 같은 날엔 같은 배정
function shuffle(list, seed) {
  const out = [...list];
  const rand = () => { // mulberry32
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function assign(day) {
  if (day < RANDOM_START) return FIXED;
  const names = shuffle(MEMBERS, Math.min(day, LAST_DAY) / DAY);
  return Object.fromEntries(PARTS.map((p, i) => [p, names[i]]));
}

const md = (day) => { const d = new Date(day); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`; };

let selected = null; // null = 오늘 (8시 지나면 자동으로 넘어감)

function render() {
  const today = dayOf(Date.now());
  const day = selected ?? today;
  const future = day > today; // 아직 안 온 날은 물음표
  const a = future ? Object.fromEntries(PARTS.map((p) => [p, '?'])) : assign(day);
  const colors = future ? PARTS.map(() => '#000') : shuffle(PALETTE, day / DAY + 1); // 날마다 부위 색도 바뀜
  const dots = document.querySelectorAll('.dot');  // 마크업 순서 = PARTS 순서
  const leads = document.querySelectorAll('.lead');
  const labels = document.querySelectorAll('.part');
  PARTS.forEach((p, i) => {
    const name = document.getElementById(p);
    name.textContent = a[p];
    name.style.fill = labels[i].style.fill = colors[i];
    dots[i].style.stroke = leads[i].style.stroke = colors[i];
  });
  document.getElementById('date').textContent = md(day);
  document.getElementById('list').innerHTML =
    `<li class="head">${md(day)}</li>` + PARTS.map((p) => `<li><span>${PART_NAMES[p]}</span>${a[p]}</li>`).join('');
  renderCalendar(today, day);
}

function renderCalendar(today, day) {
  const blanks = (new Date(FIRST_DAY).getUTCDay() + 6) % 7; // 월요일 시작
  let html = '월화수목금토일'.split('').map((w) => `<b>${w}</b>`).join('') + '<i></i>'.repeat(blanks);
  for (let d = FIRST_DAY; d <= LAST_DAY; d += DAY) {
    const date = new Date(d).getUTCDate();
    const label = date === 1 ? `${new Date(d).getUTCMonth() + 1}/1` : date;
    const cls = [d === today && 'today', d === day && 'on'].filter(Boolean).join(' ');
    html += `<button data-day="${d}" class="${cls}">${label}</button>`;
  }
  document.getElementById('days').innerHTML = html;
}

if (typeof document !== 'undefined') {
  document.getElementById('days').addEventListener('click', (e) => {
    const d = Number(e.target.dataset.day);
    if (!d) return;
    selected = d === dayOf(Date.now()) ? null : d;
    render();
  });
  render();
  setInterval(render, 60e3); // 켜둔 채로 8시가 지나도 바뀌게
} else {
  module.exports = { dayOf, assign, FIXED, RANDOM_START, DAY };
}
