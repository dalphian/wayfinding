const BASE_URL = window.location.origin;

// 4 entrances
const ENTRANCES = {
  main:     { label: 'Main Entrance',                    short: 'Main Entrance',       color: '#F0872B', floor: 1 },
  ed:       { label: 'Emergency Dept. Entrance',         short: 'ED Entrance',          color: '#C0392B', floor: 1 },
  parking1: { label: 'Parking Garage — Floor 1',         short: 'Parking Garage 1F',    color: '#5B3FA0', floor: 1 },
  parking2: { label: 'Parking Garage — Floor 2',         short: 'Parking Garage 2F',    color: '#5B3FA0', floor: 2 }
};

const DESTINATIONS = {
  ed:        { label: 'Emergency Department', icon: '🚨', iconClass: 'ed', destColor: '#C0392B', floor: 1 },
  heart:     { label: 'Heart Institute',      icon: '❤️', iconClass: 'hi', destColor: '#0E7C86', floor: 1 },
  sleep:     { label: 'Sleep Clinic',         icon: '😴', iconClass: 'sc', destColor: '#2E8B57', floor: 1 },
  starbucks: { label: 'Starbucks',            icon: '☕', iconClass: 'sb', destColor: '#C07000', floor: 2 },
  clinic2:   { label: 'Clinic 2',             icon: '🏥', iconClass: 'c2', destColor: '#3A3A9A', floor: 2 }
};

// ─── ROUTE MAP ────────────────────────────────────────────────────────────────
// SVG coordinates:
//   Corridor y=153  |  ED N-S x=158  |  Heart/Sleep N-S x=527
//   Elevator: block center (425,188) — approached via corridor at y=153
//   Start points: Main(142,153)  ED(158,22)  Parking east wall(862,153)
//   1F dests: ED(268,83)  Heart(577,83)  Sleep(503,243)
//   2F dests: Starbucks(425,83)  Clinic2(710,83)
//
// Route shape:
//   startFloor: which floor user enters on
//   sameFloor:  true = no elevator, show only one map
//   path1F / path2F: SVG paths for each floor segment
//   start1F/end1F, start2F/end2F: dot positions
//   For multi-floor routes the elevator is always at (425,153→188)
// ─────────────────────────────────────────────────────────────────────────────

const ELEV = { pt: [425, 188], corridor: [425, 153] };

const ROUTES = {

  // ════════ MAIN ENTRANCE (Floor 1) ════════
  main: {
    ed: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 142 153 L 158 153 L 158 83',
      start1F: [142,153], end1F: [268,83],
      distance: '~2 min walk · 120 ft',
      steps: [
        { text: 'Enter through the Main Entrance automatic doors on the west side.', note: 'Lobby seating and walk-off mat directly inside' },
        { text: 'Go straight ahead (east) a short distance along the main corridor.' },
        { text: 'Turn LEFT (north) at the red Emergency Dept. sign through the double doors.' },
        { text: 'Emergency Department check-in is directly in front of you.', arrived: true }
      ]
    },
    heart: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 142 153 L 577 153 L 577 83',
      start1F: [142,153], end1F: [577,83],
      distance: '~4 min walk · 320 ft',
      steps: [
        { text: 'Enter through the Main Entrance on the west side.' },
        { text: 'Turn RIGHT and follow the main corridor east.' },
        { text: 'Walk past the In-Patient Pharmacy on your left.' },
        { text: 'Heart Institute is on your LEFT — teal double doors.', arrived: true }
      ]
    },
    sleep: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 142 153 L 527 153 L 527 243 L 503 243',
      start1F: [142,153], end1F: [503,243],
      distance: '~5 min walk · 400 ft',
      steps: [
        { text: 'Enter through the Main Entrance on the west side.' },
        { text: 'Turn RIGHT and follow the main corridor east.' },
        { text: 'Pass the Heart Institute. Turn RIGHT (south) at the Sleep Clinic junction.' },
        { text: 'Sleep Clinic registration is at the end of the short corridor.', arrived: true }
      ]
    },
    starbucks: {
      sameFloor: false, startFloor: 1,
      path1F: 'M 142 153 L 425 153',
      start1F: [142,153], end1F: ELEV.pt,
      path2F: 'M 425 153 L 425 83',
      start2F: ELEV.pt, end2F: [425,83],
      distance: '~5 min · elevator to 2nd floor',
      steps: [
        { text: 'Enter through the Main Entrance on the west side.' },
        { text: 'Turn RIGHT and follow the main corridor east.' },
        { text: 'The ELEVATOR is on your RIGHT — just past the EMS/Trauma Bays.', elev: true },
        { text: 'Take the elevator UP to Floor 2.', elev: true },
        { text: 'Exit the elevator and turn LEFT — Starbucks is directly ahead.', arrived: true }
      ]
    },
    clinic2: {
      sameFloor: false, startFloor: 1,
      path1F: 'M 142 153 L 425 153',
      start1F: [142,153], end1F: ELEV.pt,
      path2F: 'M 425 153 L 710 153 L 710 83',
      start2F: ELEV.pt, end2F: [710,83],
      distance: '~5 min · elevator to 2nd floor',
      steps: [
        { text: 'Enter through the Main Entrance on the west side.' },
        { text: 'Turn RIGHT and follow the main corridor east.' },
        { text: 'The ELEVATOR is on your RIGHT — just past the EMS/Trauma Bays.', elev: true },
        { text: 'Take the elevator UP to Floor 2.', elev: true },
        { text: 'Exit the elevator and turn RIGHT. Follow the corridor east — Clinic 2 is on your LEFT.', arrived: true }
      ]
    }
  },

  // ════════ ED ENTRANCE (Floor 1) ════════
  ed: {
    ed: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 158 22 L 158 83',
      start1F: [158,22], end1F: [268,83],
      distance: 'You are here',
      steps: [
        { text: 'You have entered through the Emergency Department Entrance on the north wall.' },
        { text: 'Walk straight ahead (south) through the vestibule — check-in is directly ahead.', arrived: true }
      ]
    },
    heart: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 158 22 L 158 153 L 577 153 L 577 83',
      start1F: [158,22], end1F: [577,83],
      distance: '~5 min walk · 350 ft',
      steps: [
        { text: 'Enter through the ED Entrance on the north wall.' },
        { text: 'Walk into the ED lobby and turn RIGHT — follow the main corridor east.' },
        { text: 'Pass the Pharmacy on your left.' },
        { text: 'Heart Institute is on your LEFT — teal double doors.', arrived: true }
      ]
    },
    sleep: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 158 22 L 158 153 L 527 153 L 527 243 L 503 243',
      start1F: [158,22], end1F: [503,243],
      distance: '~6 min walk · 450 ft',
      steps: [
        { text: 'Enter through the ED Entrance on the north wall.' },
        { text: 'Turn RIGHT into the main corridor heading east.' },
        { text: 'Pass the Heart Institute. Turn RIGHT (south) at the Sleep Clinic junction.' },
        { text: 'Sleep Clinic registration is at the end of the short corridor.', arrived: true }
      ]
    },
    starbucks: {
      sameFloor: false, startFloor: 1,
      path1F: 'M 158 22 L 158 153 L 425 153',
      start1F: [158,22], end1F: ELEV.pt,
      path2F: 'M 425 153 L 425 83',
      start2F: ELEV.pt, end2F: [425,83],
      distance: '~6 min · elevator to 2nd floor',
      steps: [
        { text: 'Enter through the ED Entrance on the north wall.' },
        { text: 'Turn RIGHT into the main corridor heading east.' },
        { text: 'The ELEVATOR is on your RIGHT — just past the EMS/Trauma Bays.', elev: true },
        { text: 'Take the elevator UP to Floor 2.', elev: true },
        { text: 'Exit the elevator and turn LEFT — Starbucks is directly ahead.', arrived: true }
      ]
    },
    clinic2: {
      sameFloor: false, startFloor: 1,
      path1F: 'M 158 22 L 158 153 L 425 153',
      start1F: [158,22], end1F: ELEV.pt,
      path2F: 'M 425 153 L 710 153 L 710 83',
      start2F: ELEV.pt, end2F: [710,83],
      distance: '~6 min · elevator to 2nd floor',
      steps: [
        { text: 'Enter through the ED Entrance on the north wall.' },
        { text: 'Turn RIGHT into the main corridor heading east.' },
        { text: 'The ELEVATOR is on your RIGHT — just past the EMS/Trauma Bays.', elev: true },
        { text: 'Take the elevator UP to Floor 2.', elev: true },
        { text: 'Exit the elevator and turn RIGHT. Follow the corridor east — Clinic 2 is on your LEFT.', arrived: true }
      ]
    }
  },

  // ════════ PARKING GARAGE — FLOOR 1 ════════
  parking1: {
    ed: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 862 153 L 158 153 L 158 83',
      start1F: [862,153], end1F: [268,83],
      distance: '~6 min walk · 500 ft',
      steps: [
        { text: 'Enter through the Parking Garage Floor 1 Entrance on the east side of the building.' },
        { text: 'Turn LEFT and follow the main corridor west.' },
        { text: 'Continue past Dialysis, Electrical/STM, and the Pharmacy. At the ED junction, turn RIGHT (north).', note: 'Red Emergency signage on the right' },
        { text: 'Emergency Department check-in is straight ahead.', arrived: true }
      ]
    },
    heart: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 862 153 L 577 153 L 577 83',
      start1F: [862,153], end1F: [577,83],
      distance: '~3 min walk · 200 ft',
      steps: [
        { text: 'Enter through the Parking Garage Floor 1 Entrance on the east side.' },
        { text: 'Turn LEFT and follow the main corridor west.' },
        { text: 'The Heart Institute entrance is on your RIGHT — teal double doors.', arrived: true }
      ]
    },
    sleep: {
      sameFloor: true, startFloor: 1,
      path1F: 'M 862 153 L 527 153 L 527 243 L 503 243',
      start1F: [862,153], end1F: [503,243],
      distance: '~2 min walk · 100 ft',
      steps: [
        { text: 'Enter through the Parking Garage Floor 1 Entrance on the east side.' },
        { text: 'Turn LEFT. Take the first RIGHT (south) at the Sleep Clinic junction.' },
        { text: 'Sleep Clinic registration is straight ahead at the end of the corridor.', arrived: true }
      ]
    },
    starbucks: {
      sameFloor: false, startFloor: 1,
      path1F: 'M 862 153 L 425 153',
      start1F: [862,153], end1F: ELEV.pt,
      path2F: 'M 425 153 L 425 83',
      start2F: ELEV.pt, end2F: [425,83],
      distance: '~4 min · elevator to 2nd floor',
      steps: [
        { text: 'Enter through the Parking Garage Floor 1 Entrance on the east side.' },
        { text: 'Turn LEFT and follow the main corridor west.' },
        { text: 'The ELEVATOR is on your LEFT — between the EMS Trauma Bays and Cath Lab Waiting.', elev: true },
        { text: 'Take the elevator UP to Floor 2.', elev: true },
        { text: 'Exit the elevator and turn LEFT — Starbucks is directly ahead.', arrived: true }
      ]
    },
    clinic2: {
      sameFloor: false, startFloor: 1,
      path1F: 'M 862 153 L 425 153',
      start1F: [862,153], end1F: ELEV.pt,
      path2F: 'M 425 153 L 710 153 L 710 83',
      start2F: ELEV.pt, end2F: [710,83],
      distance: '~5 min · elevator to 2nd floor',
      steps: [
        { text: 'Enter through the Parking Garage Floor 1 Entrance on the east side.' },
        { text: 'Turn LEFT and follow the main corridor west.' },
        { text: 'The ELEVATOR is on your LEFT — between the EMS Trauma Bays and Cath Lab Waiting.', elev: true },
        { text: 'Take the elevator UP to Floor 2.', elev: true },
        { text: 'Exit the elevator and turn RIGHT. Follow the corridor east — Clinic 2 is on your LEFT.', arrived: true }
      ]
    }
  },

  // ════════ PARKING GARAGE — FLOOR 2 ════════
  // Entering on Floor 2; 2F dests are direct, 1F dests need elevator DOWN
  parking2: {
    ed: {
      sameFloor: false, startFloor: 2,
      path2F: 'M 862 153 L 425 153',       // Floor 2: east → elevator
      start2F: [862,153], end2F: ELEV.pt,
      path1F: 'M 425 153 L 158 153 L 158 83', // Floor 1: elevator → ED
      start1F: ELEV.pt, end1F: [268,83],
      distance: '~7 min · elevator to 1st floor',
      steps: [
        { text: 'Enter through the Parking Garage Floor 2 Entrance on the east side.' },
        { text: 'Turn LEFT and follow the corridor west.' },
        { text: 'The ELEVATOR is on your LEFT. Take the elevator DOWN to Floor 1.', elev: true },
        { text: 'Exit the elevator and turn LEFT (west) along the main corridor.' },
        { text: 'At the ED junction, turn RIGHT (north) through the double doors.', note: 'Red Emergency signage' },
        { text: 'Emergency Department check-in is straight ahead.', arrived: true }
      ]
    },
    heart: {
      sameFloor: false, startFloor: 2,
      path2F: 'M 862 153 L 425 153',
      start2F: [862,153], end2F: ELEV.pt,
      path1F: 'M 425 153 L 577 153 L 577 83',
      start1F: ELEV.pt, end1F: [577,83],
      distance: '~4 min · elevator to 1st floor',
      steps: [
        { text: 'Enter through the Parking Garage Floor 2 Entrance on the east side.' },
        { text: 'Turn LEFT and follow the corridor west.' },
        { text: 'The ELEVATOR is on your LEFT. Take the elevator DOWN to Floor 1.', elev: true },
        { text: 'Exit the elevator and turn RIGHT (east) a short distance.' },
        { text: 'Heart Institute is on your LEFT — teal double doors.', arrived: true }
      ]
    },
    sleep: {
      sameFloor: false, startFloor: 2,
      path2F: 'M 862 153 L 425 153',
      start2F: [862,153], end2F: ELEV.pt,
      path1F: 'M 425 153 L 527 153 L 527 243 L 503 243',
      start1F: ELEV.pt, end1F: [503,243],
      distance: '~4 min · elevator to 1st floor',
      steps: [
        { text: 'Enter through the Parking Garage Floor 2 Entrance on the east side.' },
        { text: 'Turn LEFT and follow the corridor west.' },
        { text: 'The ELEVATOR is on your LEFT. Take the elevator DOWN to Floor 1.', elev: true },
        { text: 'Exit the elevator and turn RIGHT (east). Take the first RIGHT (south) at the Sleep Clinic junction.' },
        { text: 'Sleep Clinic registration is at the end of the short corridor.', arrived: true }
      ]
    },
    starbucks: {
      sameFloor: true, startFloor: 2,
      path2F: 'M 862 153 L 425 153 L 425 83',
      start2F: [862,153], end2F: [425,83],
      distance: '~3 min walk · direct on Floor 2',
      steps: [
        { text: 'Enter through the Parking Garage Floor 2 Entrance — you are already on the 2nd floor.' },
        { text: 'Turn LEFT and follow the corridor west.' },
        { text: 'Starbucks is on your RIGHT about halfway down the corridor.', arrived: true }
      ]
    },
    clinic2: {
      sameFloor: true, startFloor: 2,
      path2F: 'M 862 153 L 710 153 L 710 83',
      start2F: [862,153], end2F: [710,83],
      distance: '~2 min walk · direct on Floor 2',
      steps: [
        { text: 'Enter through the Parking Garage Floor 2 Entrance — you are already on the 2nd floor.' },
        { text: 'Turn LEFT and follow the corridor west.' },
        { text: 'Clinic 2 is on your RIGHT — look for the Clinic 2 signage.', arrived: true }
      ]
    }
  }
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentEntrance = null;

function init() {
  const params = new URLSearchParams(window.location.search);
  const entrance = params.get('entrance');
  const isAdmin = params.has('admin') || window.location.pathname === '/admin';
  if (isAdmin) { showAdmin(); return; }
  if (!entrance || !ENTRANCES[entrance]) { showScreen('screenNotFound'); return; }
  currentEntrance = entrance;
  const e = ENTRANCES[entrance];
  const badge = document.getElementById('entranceBadge');
  badge.textContent = e.short;
  badge.style.borderColor = e.color + '55';
  document.getElementById('floorIndicator').textContent =
    e.floor === 1 ? 'First Floor Navigation' : 'Second Floor Navigation';
  showScreen('screenSelect');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); window.scrollTo(0,0); }
}
function goBack() { showScreen('screenSelect'); }

// ─── SHOW DIRECTIONS ──────────────────────────────────────────────────────────
function showDirections(dest) {
  const route = ROUTES[currentEntrance][dest];
  const destD = DESTINATIONS[dest];
  const entrD = ENTRANCES[currentEntrance];

  // Header
  const iconEl = document.getElementById('dirIcon');
  iconEl.textContent = destD.icon;
  iconEl.className = 'dir-dest-icon ' + destD.iconClass;
  document.getElementById('dirTitle').textContent = destD.label;
  document.getElementById('dirFrom').textContent = 'From ' + entrD.label;
  document.getElementById('distText').textContent = route.distance;
  document.getElementById('floorIndicator').textContent = route.sameFloor
    ? (route.startFloor === 1 ? 'First Floor Navigation' : 'Second Floor Navigation')
    : 'Multi-Floor Navigation';

  // Steps
  const list = document.getElementById('stepList');
  list.innerHTML = '';
  let n = 1;
  route.steps.forEach(s => {
    const li = document.createElement('li');
    li.className = 'step-item' + (s.arrived ? ' arrived' : '') + (s.elev ? ' elev-step' : '');
    const icon = s.arrived ? '✓' : s.elev ? '🛗' : n++;
    li.innerHTML = `<div class="step-num">${icon}</div>
      <div><div class="step-text">${s.text}</div>${s.note ? `<div class="step-note">${s.note}</div>` : ''}</div>`;
    list.appendChild(li);
  });

  // Legend visibility
  document.getElementById('legMain').style.display = currentEntrance === 'main'    ? '' : 'none';
  document.getElementById('legED').style.display   = currentEntrance === 'ed'      ? '' : 'none';
  document.getElementById('legP1').style.display   = currentEntrance === 'parking1' ? '' : 'none';
  document.getElementById('legP2').style.display   = currentEntrance === 'parking2' ? '' : 'none';

  clearRoutes();

  const tabBar = document.getElementById('floorTabBar');
  const wrap1F = document.getElementById('map1FWrap');
  const wrap2F = document.getElementById('map2FWrap');

  if (route.sameFloor) {
    tabBar.style.display = 'none';
    if (route.startFloor === 1) {
      wrap1F.style.display = ''; wrap2F.style.display = 'none';
      document.getElementById('mapTitle').textContent = 'First Floor — Your Route';
      drawOnFloor1(route, destD.destColor, entrD.color);
    } else {
      wrap1F.style.display = 'none'; wrap2F.style.display = '';
      document.getElementById('mapTitle').textContent = 'Second Floor — Your Route';
      drawOnFloor2(route, destD.destColor, entrD.color);
    }
  } else {
    // Multi-floor: show both tabs, default to start floor
    tabBar.style.display = '';
    drawOnFloor1(route, route.startFloor === 1 ? '#1E6E42' : destD.destColor, route.startFloor === 1 ? entrD.color : '#1E6E42');
    drawOnFloor2(route, route.startFloor === 2 ? '#1E6E42' : destD.destColor, route.startFloor === 2 ? entrD.color : '#1E6E42');
    // Labels
    const tab1 = document.getElementById('tab1');
    const tab2 = document.getElementById('tab2');
    if (route.startFloor === 1) {
      tab1.textContent = 'Floor 1 — To Elevator';
      tab2.textContent = 'Floor 2 — To Destination';
    } else {
      tab1.textContent = 'Floor 1 — To Destination';
      tab2.textContent = 'Floor 2 — To Elevator';
    }
    showFloor(route.startFloor);
  }
  showScreen('screenDir');
}

function showFloor(n) {
  document.getElementById('map1FWrap').style.display = n === 1 ? '' : 'none';
  document.getElementById('map2FWrap').style.display = n === 2 ? '' : 'none';
  document.getElementById('tab1').classList.toggle('active', n === 1);
  document.getElementById('tab2').classList.toggle('active', n === 2);
  const labels = {
    1: document.getElementById('tab1').textContent,
    2: document.getElementById('tab2').textContent
  };
  document.getElementById('mapTitle').textContent = labels[n];
}

// ─── ROUTE DRAWING ────────────────────────────────────────────────────────────
function clearRoutes() {
  ['route1FGroup','node1FGroup','route2FGroup','node2FGroup'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = '';
  });
}

function drawOnFloor1(route, endColor, startColor) {
  if (!route.path1F) return;
  const rg = document.getElementById('route1FGroup');
  const ng = document.getElementById('node1FGroup');
  rg.appendChild(mkPath(route.path1F, '#0E7C86'));
  ng.appendChild(mkCirc(route.start1F[0], route.start1F[1], 9, startColor, .1));
  ng.appendChild(mkCirc(route.start1F[0], route.start1F[1], 4, '#fff', .1));
  // If ends at elevator, show pulse in elevator green; otherwise show dest marker
  if (!route.sameFloor && route.startFloor === 1) {
    ng.appendChild(mkPulse(ELEV.pt[0], ELEV.pt[1], '#1E6E42'));
    ng.appendChild(mkCirc(ELEV.pt[0], ELEV.pt[1], 10, '#1E6E42', 1.0));
    ng.appendChild(mkCirc(ELEV.pt[0], ELEV.pt[1], 4.5, '#fff', 1.0));
  } else if (!route.sameFloor && route.startFloor === 2) {
    ng.appendChild(mkPulse(route.end1F[0], route.end1F[1], endColor));
    ng.appendChild(mkCirc(route.end1F[0], route.end1F[1], 10, endColor, 1.0));
    ng.appendChild(mkCirc(route.end1F[0], route.end1F[1], 4.5, '#fff', 1.0));
  } else {
    ng.appendChild(mkPulse(route.end1F[0], route.end1F[1], endColor));
    ng.appendChild(mkCirc(route.end1F[0], route.end1F[1], 10, endColor, 1.0));
    ng.appendChild(mkCirc(route.end1F[0], route.end1F[1], 4.5, '#fff', 1.0));
  }
}

function drawOnFloor2(route, endColor, startColor) {
  const pathData = route.path2F;
  if (!pathData) return;
  const rg = document.getElementById('route2FGroup');
  const ng = document.getElementById('node2FGroup');
  rg.appendChild(mkPath(pathData, '#C07000'));
  const sp = route.start2F || route.start1F;
  const ep = route.end2F || route.end1F;
  ng.appendChild(mkCirc(sp[0], sp[1], 9, startColor, .1));
  ng.appendChild(mkCirc(sp[0], sp[1], 4, '#fff', .1));
  if (!route.sameFloor && route.startFloor === 2) {
    // ends at elevator on floor 2
    ng.appendChild(mkPulse(ELEV.pt[0], ELEV.pt[1], '#1E6E42'));
    ng.appendChild(mkCirc(ELEV.pt[0], ELEV.pt[1], 10, '#1E6E42', 1.0));
    ng.appendChild(mkCirc(ELEV.pt[0], ELEV.pt[1], 4.5, '#fff', 1.0));
  } else {
    ng.appendChild(mkPulse(ep[0], ep[1], endColor));
    ng.appendChild(mkCirc(ep[0], ep[1], 10, endColor, 1.0));
    ng.appendChild(mkCirc(ep[0], ep[1], 4.5, '#fff', 1.0));
  }
}

function mkPath(d, stroke) {
  const p = document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d', d); p.setAttribute('fill','none');
  p.setAttribute('stroke', stroke); p.setAttribute('stroke-width','4');
  p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round');
  p.setAttribute('stroke-dasharray','2000'); p.setAttribute('stroke-dashoffset','2000');
  p.style.animation = 'drawPath 1.4s ease forwards 0.1s';
  return p;
}
function mkCirc(cx, cy, r, fill, delay) {
  const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx',cx); c.setAttribute('cy',cy);
  c.setAttribute('r',r);   c.setAttribute('fill',fill);
  c.style.opacity = '0'; c.style.animation = `fadeIn 0.35s ease ${delay}s forwards`;
  return c;
}
function mkPulse(cx, cy, fill) {
  const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx',cx); c.setAttribute('cy',cy);
  c.setAttribute('r','12'); c.setAttribute('fill',fill); c.setAttribute('opacity','0.3');
  c.style.animation = 'pulseDot 1.5s ease-in-out 1.2s infinite';
  return c;
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function showAdmin() {
  showScreen('screenAdmin');
  document.getElementById('entranceBadge').textContent = 'Admin';
  const list = [
    { key: 'main',     label: 'Main Entrance',             desc: 'Post at the main west-side entrance doors' },
    { key: 'ed',       label: 'ED Entrance',                desc: 'Post at the north-face Emergency Dept. entrance' },
    { key: 'parking1', label: 'Parking Garage — Floor 1',   desc: 'Post at the Floor 1 parking garage walkway (east side)' },
    { key: 'parking2', label: 'Parking Garage — Floor 2',   desc: 'Post at the Floor 2 parking garage walkway (east side)' }
  ];
  const container = document.getElementById('qrCards');
  container.innerHTML = '';
  list.forEach(e => {
    const url = `${BASE_URL}/?entrance=${e.key}`;
    const card = document.createElement('div');
    card.className = 'qr-card';
    card.innerHTML = `
      <div class="qr-card-title">${e.label}</div>
      <div class="qr-card-desc">${e.desc}</div>
      <div class="qr-box" id="qr_${e.key}"></div>
      <div class="qr-url">${url}</div>
      <button class="open-btn" onclick="window.open('${url}','_blank')">Open Link ↗</button>`;
    container.appendChild(card);
    setTimeout(() => {
      new QRCode(document.getElementById('qr_' + e.key), {
        text: url, width: 124, height: 124,
        colorDark: '#0D2B4E', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }, 200);
  });
}

init();
