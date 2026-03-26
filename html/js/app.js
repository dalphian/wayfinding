// ─── DIJKSTRA PATHFINDER ──────────────────────────────────────────────────────
class Pathfinder {
  constructor(config) {
    this.config = config;
    this.nodes = {};
    this.edges = [];
    this.buildGraph();
  }

  buildGraph() {
    this.config.floors.forEach(floor => {
      for (const [id, data] of Object.entries(floor.nodes)) {
        this.nodes[id] = { ...data, id, floor: floor.id };
      }
      floor.edges.forEach(([u, v, label]) => {
        const dist = this.dist(this.nodes[u], this.nodes[v]);
        this.edges.push({ u, v, dist, label });
        this.edges.push({ u: v, v: u, dist, label }); // Bidirectional
      });
    });

    // Link portals (elevators)
    const portals = {};
    Object.values(this.nodes).forEach(node => {
      if (node.portal_id) {
        if (!portals[node.portal_id]) portals[node.portal_id] = [];
        portals[node.portal_id].push(node);
      }
    });
    for (const id in portals) {
      const pNodes = portals[id];
      for (let i = 0; i < pNodes.length; i++) {
        for (let j = i + 1; j < pNodes.length; j++) {
          const u = pNodes[i].id, v = pNodes[j].id;
          const label = `Take the elevator to Floor ${pNodes[j].floor}`;
          this.edges.push({ u, v, dist: 10, label, isPortal: true });
          this.edges.push({ u: v, v: u, dist: 10, label: `Take the elevator to Floor ${pNodes[i].floor}`, isPortal: true });
        }
      }
    }
  }

  dist(n1, n2) {
    return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
  }

  findPath(startId, endId) {
    const dists = {}, prev = {}, queue = new Set();
    Object.keys(this.nodes).forEach(id => { dists[id] = Infinity; queue.add(id); });
    dists[startId] = 0;

    while (queue.size > 0) {
      let u = null;
      queue.forEach(id => { if (u === null || dists[id] < dists[u]) u = id; });
      if (u === endId || dists[u] === Infinity) break;
      queue.delete(u);

      this.edges.filter(e => e.u === u).forEach(e => {
        const alt = dists[u] + e.dist;
        if (alt < dists[e.v]) { dists[e.v] = alt; prev[e.v] = { node: u, edge: e }; }
      });
    }

    const path = [];
    let curr = endId;
    while (prev[curr]) {
      path.unshift({ node: this.nodes[curr], edge: prev[curr].edge });
      curr = prev[curr].node;
    }
    if (path.length > 0) path.unshift({ node: this.nodes[startId], edge: null });
    return path;
  }
}

// ─── APP LOGIC ──────────────────────────────────────────────────────────────
let venue = null, pathfinder = null, currentEntrance = null;

async function init() {
  const res = await fetch('/venue_config.json');
  venue = await res.json();
  pathfinder = new Pathfinder(venue);

  const params = new URLSearchParams(window.location.search);
  const entrance = params.get('entrance');
  if (params.has('admin')) { showAdmin(); return; }
  if (!entrance || !pathfinder.nodes[entrance]) { showScreen('screenNotFound'); return; }

  currentEntrance = entrance;
  const node = pathfinder.nodes[entrance];
  document.getElementById('entranceBadge').textContent = node.label;
  document.getElementById('floorIndicator').textContent = venue.floors.find(f => f.id === node.floor).label + ' Navigation';

  renderDestinationList();
  showScreen('screenSelect');
}

function renderDestinationList() {
  const container = document.querySelector('.selector-wrap');
  // Clear existing static cards (preserving heading)
  const heading = container.querySelector('.selector-heading');
  const sub = container.querySelector('.selector-sub');
  container.innerHTML = '';
  container.appendChild(heading); container.appendChild(sub);

  const floors = {};
  Object.values(pathfinder.nodes).filter(n => n.type === 'destination').forEach(n => {
    if (!floors[n.floor]) floors[n.floor] = [];
    floors[n.floor].push(n);
  });

  Object.keys(floors).sort().forEach(fId => {
    const floorLabel = document.createElement('div');
    floorLabel.className = 'floor-label';
    floorLabel.textContent = venue.floors.find(f => f.id == fId).label;
    if (fId > 1) floorLabel.style.marginTop = '18px';
    container.appendChild(floorLabel);

    floors[fId].forEach(dest => {
      const card = document.createElement('div');
      card.className = 'dest-card';
      card.innerHTML = `<div class="dest-icon">${dest.icon || '📍'}</div>
        <div><div class="dest-label">${dest.label}</div></div>
        <span class="dest-floor-tag tag-${fId}f">${fId}F</span><div class="dest-arrow">›</div>`;
      card.onclick = () => showDirections(dest.id);
      container.appendChild(card);
    });
  });
}

function showDirections(destId) {
  const path = pathfinder.findPath(currentEntrance, destId);
  const dest = pathfinder.nodes[destId];
  const start = pathfinder.nodes[currentEntrance];

  document.getElementById('dirIcon').textContent = dest.icon || '📍';
  document.getElementById('dirTitle').textContent = dest.label;
  document.getElementById('dirFrom').textContent = 'From ' + start.label;
  document.getElementById('distText').textContent = '~' + Math.ceil(path.reduce((a, b) => a + (b.edge?.dist || 0), 0) / 50) + ' min walk';

  const list = document.getElementById('stepList');
  list.innerHTML = '';
  path.forEach((p, i) => {
    if (!p.edge) return;
    const li = document.createElement('li');
    li.className = 'step-item' + (p.node.id === destId ? ' arrived' : '') + (p.edge.isPortal ? ' elev-step' : '');
    li.innerHTML = `<div class="step-num">${p.node.id === destId ? '✓' : (p.edge.isPortal ? '🛗' : i)}</div>
      <div><div class="step-text">${p.edge.label}</div></div>`;
    list.appendChild(li);
  });

  renderMaps(path, destId);
  showScreen('screenDir');
}

function renderMaps(path, destId) {
  const pathByFloor = {};
  path.forEach(p => {
    if (!pathByFloor[p.node.floor]) pathByFloor[p.node.floor] = [];
    pathByFloor[p.node.floor].push(p);
  });

  const floorIds = Object.keys(pathByFloor);
  const tabBar = document.getElementById('floorTabBar');
  tabBar.style.display = floorIds.length > 1 ? '' : 'none';
  tabBar.innerHTML = '';

  floorIds.forEach(fId => {
    const btn = document.createElement('button');
    btn.className = 'floor-tab';
    btn.textContent = venue.floors.find(f => f.id == fId).label;
    btn.onclick = () => switchFloor(fId);
    tabBar.appendChild(btn);

    // Draw path on SVG
    const svgId = venue.floors.find(f => f.id == fId).svg;
    const rg = document.querySelector(`#${svgId} #route${fId}FGroup`) || createGroup(svgId, `route${fId}FGroup`);
    const ng = document.querySelector(`#${svgId} #node${fId}FGroup`) || createGroup(svgId, `node${fId}FGroup`);
    rg.innerHTML = ''; ng.innerHTML = '';

    const points = pathByFloor[fId];
    if (points.length > 1) {
      let d = `M ${points[0].node.x} ${points[0].node.y}`;
      for (let i = 1; i < points.length; i++) {
        if (!points[i].edge.isPortal) d += ` L ${points[i].node.x} ${points[i].node.y}`;
      }
      rg.appendChild(mkPath(d, '#0E7C86'));

      // Start/End dots for this floor
      const start = points[0].node;
      const end = points[points.length - 1].node;
      ng.appendChild(mkCirc(start.x, start.y, 9, '#F0872B', .1));
      if (end.id === destId) {
        ng.appendChild(mkPulse(end.x, end.y, '#C0392B'));
        ng.appendChild(mkCirc(end.x, end.y, 10, '#C0392B', 1));
      } else if (end.portal_id) {
        ng.appendChild(mkPulse(end.x, end.y, '#1E6E42'));
        ng.appendChild(mkCirc(end.x, end.y, 10, '#1E6E42', 1));
      }
    }
  });

  switchFloor(floorIds[0]);
}

function createGroup(svgId, gId) {
  const svg = document.getElementById(svgId);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.id = gId;
  svg.appendChild(g);
  return g;
}

function switchFloor(fId) {
  venue.floors.forEach(f => {
    document.getElementById(f.svg + 'Wrap').style.display = f.id == fId ? '' : 'none';
  });
  document.querySelectorAll('.floor-tab').forEach(t => t.classList.toggle('active', t.textContent.includes(fId)));
}

// ... (existing mkPath, mkCirc, mkPulse, showAdmin, etc) ...

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

function showAdmin() {
  showScreen('screenAdmin');
  const container = document.getElementById('qrCards');
  container.innerHTML = '';
  Object.values(pathfinder.nodes).filter(n => n.type === 'entrance').forEach(e => {
    const url = `${window.location.origin}/?entrance=${e.id}`;
    const card = document.createElement('div');
    card.className = 'qr-card';
    card.innerHTML = `<div class="qr-card-title">${e.label}</div>
      <div class="qr-box" id="qr_${e.id}"></div>
      <div class="qr-url">${url}</div>
      <button class="open-btn" onclick="window.open('${url}','_blank')">Open Link ↗</button>`;
    container.appendChild(card);
    setTimeout(() => {
      new QRCode(document.getElementById('qr_' + e.id), { text: url, width: 124, height: 124 });
    }, 100);
  });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); window.scrollTo(0,0); }
}
function goBack() { showScreen('screenSelect'); }

init();
