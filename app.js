const storageKey = "zfl18-boardgame-rule-cards";
const today = new Date();

const defaultState = {
  selectedId: "",
  games: [
    {
      id: crypto.randomUUID(),
      name: "奥尔良",
      minPlayers: 2,
      maxPlayers: 4,
      duration: 90,
      complexity: "中",
      lastPlayed: "2025-11-20",
      cover: "",
      forgets: ["商站建造前先确认道路或水路连接", "袋中随从抽完后不是重洗弃堆，而是从已回袋内容继续抽"],
      disputes: ["事件顺序和玩家动作结算先后", "科技板是否能替代所有同类随从"],
      setup: ["按人数放置货物板块", "每位玩家拿起始随从、商人和个人板"],
      scoring: ["货物分数", "商站和市民乘区块", "金币和建筑剩余加分"]
    },
    {
      id: crypto.randomUUID(),
      name: "盖亚计划",
      minPlayers: 1,
      maxPlayers: 4,
      duration: 150,
      complexity: "重",
      lastPlayed: "2025-08-02",
      cover: "",
      forgets: ["联邦连接时卫星数量和能量消耗要一起核对", "研究升到顶必须拿对应科技板限制"],
      disputes: ["被动充能是否能拒绝", "星球改造费用受哪些能力影响"],
      setup: ["随机终局计分板和回合得分板", "按种族设置起始资源和母星"],
      scoring: ["终局计分板", "科技轨排名", "联邦和建筑分"]
    },
    {
      id: crypto.randomUUID(),
      name: "花砖物语",
      minPlayers: 2,
      maxPlayers: 4,
      duration: 45,
      complexity: "轻",
      lastPlayed: "2026-03-15",
      cover: "",
      forgets: ["每轮结束先铺墙再补工厂展示区", "地板线扣分后清空对应砖"],
      disputes: ["同色砖放置限制是否看整面墙", "中央区起始玩家标记是否必须拿"],
      setup: ["按人数放工厂圆盘", "每个圆盘补4块砖"],
      scoring: ["横竖相邻即时分", "完整行列和颜色终局加分"]
    }
  ]
};

let state = loadState();
if (!state.selectedId) state.selectedId = state.games[0]?.id || "";

const els = {
  searchInput: document.querySelector("#searchInput"),
  playerFilter: document.querySelector("#playerFilter"),
  complexityFilter: document.querySelector("#complexityFilter"),
  sortMode: document.querySelector("#sortMode"),
  gameForm: document.querySelector("#gameForm"),
  nameInput: document.querySelector("#nameInput"),
  minPlayersInput: document.querySelector("#minPlayersInput"),
  maxPlayersInput: document.querySelector("#maxPlayersInput"),
  durationInput: document.querySelector("#durationInput"),
  complexityInput: document.querySelector("#complexityInput"),
  lastPlayedInput: document.querySelector("#lastPlayedInput"),
  coverInput: document.querySelector("#coverInput"),
  gameList: document.querySelector("#gameList"),
  detailView: document.querySelector("#detailView"),
  gameCount: document.querySelector("#gameCount"),
  ruleCount: document.querySelector("#ruleCount"),
  staleGame: document.querySelector("#staleGame"),
  visibleCount: document.querySelector("#visibleCount")
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function daysSince(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Math.max(0, Math.floor((today - date) / 86400000));
}

function getAllRules(game) {
  return [...game.forgets, ...game.disputes, ...game.setup, ...game.scoring];
}

function getFilteredGames() {
  const keyword = els.searchInput.value.trim();
  const player = els.playerFilter.value;
  const complexity = els.complexityFilter.value;
  const games = state.games.filter((game) => {
    const text = `${game.name}${getAllRules(game).join("")}`;
    const matchesKeyword = !keyword || text.includes(keyword);
    const matchesPlayer = player === "all" || (Number(player) >= game.minPlayers && Number(player) <= game.maxPlayers);
    const matchesComplexity = complexity === "all" || game.complexity === complexity;
    return matchesKeyword && matchesPlayer && matchesComplexity;
  });

  if (els.sortMode.value === "name") return games.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  if (els.sortMode.value === "complexity") {
    const rank = { 轻: 1, 中: 2, 重: 3 };
    return games.sort((a, b) => rank[b.complexity] - rank[a.complexity]);
  }
  return games.sort((a, b) => daysSince(b.lastPlayed) - daysSince(a.lastPlayed));
}

function renderSummary() {
  const allRuleCount = state.games.reduce((sum, game) => sum + getAllRules(game).length, 0);
  const stale = [...state.games].sort((a, b) => daysSince(b.lastPlayed) - daysSince(a.lastPlayed))[0];
  els.gameCount.textContent = state.games.length;
  els.ruleCount.textContent = allRuleCount;
  els.staleGame.textContent = stale ? `${daysSince(stale.lastPlayed)}天` : "-";
}

function renderList() {
  const games = getFilteredGames();
  els.visibleCount.textContent = `${games.length}个匹配`;
  els.gameList.innerHTML =
    games
      .map((game) => {
        const selected = game.id === state.selectedId ? "selected" : "";
        return `
          <article class="game-card ${selected}" data-game-id="${game.id}">
            <div class="cover">
              ${
                game.cover
                  ? `<img src="${game.cover}" alt="${escapeHtml(game.name)}封面" />`
                  : `<span>${escapeHtml(game.name.slice(0, 2))}</span>`
              }
              <span class="stale-ribbon">${daysSince(game.lastPlayed)}天未玩</span>
            </div>
            <div class="game-body">
              <h3>${escapeHtml(game.name)}</h3>
              <div class="game-meta">
                <span class="pill">${game.minPlayers}-${game.maxPlayers}人</span>
                <span class="pill">${game.duration}分钟</span>
                <span class="pill heavy">${escapeHtml(game.complexity)}</span>
              </div>
            </div>
          </article>
        `;
      })
      .join("") || `<p class="empty">没有符合筛选的桌游。</p>`;
}

function renderDetail() {
  const game = state.games.find((item) => item.id === state.selectedId) || state.games[0];
  if (!game) {
    els.detailView.innerHTML = `<p class="empty">先添加一个桌游。</p>`;
    return;
  }
  state.selectedId = game.id;
  els.detailView.innerHTML = `
    <div class="quick-card">
      <div class="detail-cover">
        ${game.cover ? `<img src="${game.cover}" alt="${escapeHtml(game.name)}封面" />` : `<span>${escapeHtml(game.name.slice(0, 2))}</span>`}
      </div>
      <div>
        <h2>${escapeHtml(game.name)}</h2>
        <div class="game-meta">
          <span class="pill">${game.minPlayers}-${game.maxPlayers}人</span>
          <span class="pill">${game.duration}分钟</span>
          <span class="pill heavy">${escapeHtml(game.complexity)}</span>
          <span class="pill">${daysSince(game.lastPlayed)}天未玩</span>
        </div>
      </div>
      ${renderRuleSection("容易忘的规则", "forgets", game.forgets)}
      ${renderRuleSection("常见争议", "disputes", game.disputes)}
      ${renderRuleSection("开局准备", "setup", game.setup)}
      ${renderRuleSection("计分提醒", "scoring", game.scoring)}
      <form class="add-rule" id="ruleForm">
        <select id="ruleTypeInput">
          <option value="forgets">容易忘的规则</option>
          <option value="disputes">常见争议</option>
          <option value="setup">开局准备</option>
          <option value="scoring">计分提醒</option>
        </select>
        <textarea id="ruleTextInput" rows="3" placeholder="补充一条聚会前要看的提醒" required></textarea>
        <button class="primary" type="submit">加入规则卡片</button>
      </form>
      <div class="detail-actions">
        <button id="playedTodayBtn" type="button">标记今天玩过</button>
        <button id="deleteGameBtn" type="button">删除桌游</button>
      </div>
    </div>
  `;
}

function renderRuleSection(title, key, items) {
  return `
    <section class="rule-section">
      <h3>${title}</h3>
      <ul class="rule-list">
        ${
          items
            .map(
              (item, index) => `
                <li>
                  <span>${escapeHtml(item)}</span>
                  <button type="button" title="删除" data-rule-key="${key}" data-rule-index="${index}">×</button>
                </li>
              `
            )
            .join("") || `<li><span>暂无内容。</span></li>`
        }
      </ul>
    </section>
  `;
}

function renderAll() {
  saveState();
  renderSummary();
  renderList();
  renderDetail();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function addGame(event) {
  event.preventDefault();
  const minPlayers = Number(els.minPlayersInput.value);
  const maxPlayers = Math.max(minPlayers, Number(els.maxPlayersInput.value));
  const cover = await readFileAsDataUrl(els.coverInput.files[0]);
  const game = {
    id: crypto.randomUUID(),
    name: els.nameInput.value.trim(),
    minPlayers,
    maxPlayers,
    duration: Number(els.durationInput.value),
    complexity: els.complexityInput.value,
    lastPlayed: els.lastPlayedInput.value,
    cover,
    forgets: ["本局开始前先补充容易忘的规则。"],
    disputes: [],
    setup: ["整理组件并按人数调整初始设置。"],
    scoring: ["确认终局计分项和即时得分项。"]
  };
  state.games.unshift(game);
  state.selectedId = game.id;
  els.gameForm.reset();
  setDefaultDate();
  renderAll();
  renderParty();
}

function setDefaultDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 2);
  els.lastPlayedInput.value = date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.searchInput.addEventListener("input", renderAll);
els.playerFilter.addEventListener("change", renderAll);
els.complexityFilter.addEventListener("change", renderAll);
els.sortMode.addEventListener("change", renderAll);
els.gameForm.addEventListener("submit", addGame);

els.gameList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-game-id]");
  if (!card) return;
  state.selectedId = card.dataset.gameId;
  renderAll();
});

els.detailView.addEventListener("submit", (event) => {
  if (event.target.id !== "ruleForm") return;
  event.preventDefault();
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;
  const key = document.querySelector("#ruleTypeInput").value;
  const text = document.querySelector("#ruleTextInput").value.trim();
  if (!text) return;
  game[key].push(text);
  renderAll();
});

els.detailView.addEventListener("click", (event) => {
  const ruleButton = event.target.closest("[data-rule-key]");
  const playedButton = event.target.closest("#playedTodayBtn");
  const deleteButton = event.target.closest("#deleteGameBtn");
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;

  if (ruleButton) {
    const key = ruleButton.dataset.ruleKey;
    const index = Number(ruleButton.dataset.ruleIndex);
    game[key].splice(index, 1);
    renderAll();
  }

  if (playedButton) {
    game.lastPlayed = new Date().toISOString().slice(0, 10);
    renderAll();
  }

  if (deleteButton) {
    state.games = state.games.filter((item) => item.id !== game.id);
    state.selectedId = state.games[0]?.id || "";
    // 桌游被删除后，主持台里引用它的场次一并清除，避免失效引用
    state.party.sessions = state.party.sessions.filter((s) => s.gameId !== game.id);
    state.party.drafts.forEach((draft) => {
      draft.sessions = draft.sessions.filter((s) => s.gameId !== game.id);
    });
    renderAll();
    renderParty();
  }
});

/* ================= 聚会主持台 ================= */

const PHASES = [
  { key: "teach", label: "讲解" },
  { key: "setup", label: "准备" },
  { key: "play", label: "游玩" },
  { key: "score", label: "计分" },
  { key: "pack", label: "收纳" }
];

const TEACH_BASE = { 轻: 6, 中: 12, 重: 20 };
const SETUP_BASE = { 轻: 4, 中: 7, 重: 12 };
const SCORE_BASE = { 轻: 3, 中: 5, 重: 8 };
const PACK_BASE = { 轻: 4, 中: 6, 重: 10 };
const FOCUS_KEYS = ["forgets", "disputes", "setup", "scoring"];
const MAX_TABLE_SIZE = 6;
const HISTORY_LIMIT = 50;

const partyEls = {
  form: document.querySelector("#partyForm"),
  players: document.querySelector("#partyPlayersInput"),
  minutes: document.querySelector("#partyMinutesInput"),
  start: document.querySelector("#partyStartInput"),
  focus: document.querySelector("#partyFocusInput"),
  lateBtn: document.querySelector("#lateAdjustBtn"),
  insertSelect: document.querySelector("#insertGameSelect"),
  insertBtn: document.querySelector("#insertGameBtn"),
  saveDraftBtn: document.querySelector("#saveDraftBtn"),
  message: document.querySelector("#partyMessage"),
  overtime: document.querySelector("#partyOvertime"),
  timeline: document.querySelector("#partyTimeline"),
  draftList: document.querySelector("#draftList"),
  undoBtn: document.querySelector("#undoPartyBtn"),
  redoBtn: document.querySelector("#redoPartyBtn"),
  exportBtn: document.querySelector("#exportPartyBtn"),
  importBtn: document.querySelector("#importPartyBtn"),
  importInput: document.querySelector("#importPartyInput")
};

const partyHistory = { past: [], future: [] };

function defaultParty() {
  return {
    players: 8,
    totalMinutes: 240,
    startTime: "19:00",
    focus: "forgets",
    sessions: [],
    drafts: []
  };
}

function ensurePartyState() {
  state.party = { ...defaultParty(), ...(state.party || {}) };
  state.party.sessions = Array.isArray(state.party.sessions) ? state.party.sessions : [];
  state.party.drafts = Array.isArray(state.party.drafts) ? state.party.drafts : [];
  if (!FOCUS_KEYS.includes(state.party.focus)) state.party.focus = "forgets";
  state.party.players = clampInt(state.party.players, 1, 99, 8);
  state.party.totalMinutes = clampInt(state.party.totalMinutes, 30, 1440, 240);
  if (!/^\d{2}:\d{2}$/.test(state.party.startTime || "")) state.party.startTime = "19:00";
  // 刷新恢复时清掉指向已删桌游的失效引用
  state.party.sessions = state.party.sessions.filter((s) => gameById(s.gameId));
  normalizeSlots(state.party.sessions);
}

function clampInt(value, min, max, fallback) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function gameById(id) {
  return state.games.find((game) => game.id === id);
}

function phaseTimes(game) {
  return {
    teach: TEACH_BASE[game.complexity] + Math.ceil((game.forgets.length + game.disputes.length) / 2),
    setup: SETUP_BASE[game.complexity] + game.setup.length,
    play: game.duration,
    score: SCORE_BASE[game.complexity] + game.scoring.length,
    pack: PACK_BASE[game.complexity]
  };
}

function sessionMinutes(game) {
  const phases = phaseTimes(game);
  return PHASES.reduce((sum, phase) => sum + phases[phase.key], 0);
}

function forgetRisk(game) {
  return daysSince(game.lastPlayed) + game.forgets.length * 3;
}

function teachCost(game) {
  return phaseTimes(game).teach;
}

function tableSplit(players) {
  const tables = Math.max(1, Math.ceil(players / MAX_TABLE_SIZE));
  return { tables, perTable: Math.ceil(players / tables) };
}

// 候选排序：遗忘风险越高越优先，讲解成本越低越优先，复习重点条目多的加分
function rankGames(players, focus) {
  return state.games
    .filter((game) => players >= game.minPlayers && players <= game.maxPlayers)
    .map((game) => {
      const focusBonus = (game[focus]?.length || 0) * 2;
      return { game, score: forgetRisk(game) + focusBonus - teachCost(game) * 0.5 };
    })
    .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name, "zh-CN"))
    .map((entry) => entry.game);
}

function pickFittingGame(ranked, { used, prevId, remaining, tableHistory }) {
  const fits = (game) => sessionMinutes(game) <= remaining;
  return (
    ranked.find((game) => !used.has(game.id) && game.id !== prevId && fits(game)) ||
    ranked.find((game) => tableHistory.has(game.id) && game.id !== prevId && fits(game)) ||
    ranked.find((game) => game.id !== prevId && fits(game)) ||
    (ranked[0] && fits(ranked[0]) ? ranked[0] : null)
  );
}

function pickAnyGame(ranked, { used, prevId, tableHistory }) {
  return (
    ranked.find((game) => !used.has(game.id) && game.id !== prevId) ||
    ranked.find((game) => tableHistory.has(game.id) && game.id !== prevId) ||
    ranked.find((game) => game.id !== prevId) ||
    ranked[0] ||
    null
  );
}

// 编排多桌多局：每桌顺序开局，连续两局不重复同一款；锁定的场次保持不动
function buildPlan(players, totalMinutes, focus, keepSessions = []) {
  const { tables, perTable } = tableSplit(players);
  const ranked = rankGames(perTable, focus);
  const lockedByTable = new Map();
  keepSessions
    .filter((session) => session.locked && gameById(session.gameId))
    .forEach((session) => {
      const table = Math.min(Math.max(1, session.table), tables);
      if (!lockedByTable.has(table)) lockedByTable.set(table, new Map());
      lockedByTable.get(table).set(session.slot, { ...session, table });
    });

  const used = new Set();
  lockedByTable.forEach((slots) => slots.forEach((session) => used.add(session.gameId)));

  const sessions = [];
  for (let table = 1; table <= tables; table += 1) {
    const lockedSlots = lockedByTable.get(table) || new Map();
    const highestLocked = lockedSlots.size ? Math.max(...lockedSlots.keys()) : -1;
    const tableHistory = new Set();
    let slot = 0;
    let minutes = 0;
    let prevId = null;

    while (true) {
      const lockedSession = lockedSlots.get(slot);
      if (lockedSession) {
        const game = gameById(lockedSession.gameId);
        sessions.push(lockedSession);
        minutes += sessionMinutes(game);
        prevId = game.id;
        tableHistory.add(game.id);
        slot += 1;
        continue;
      }
      const remaining = totalMinutes - minutes;
      const context = { used, prevId, remaining, tableHistory };
      let next = pickFittingGame(ranked, context);
      if (!next && slot <= highestLocked) next = pickAnyGame(ranked, context);
      if (!next) break;
      sessions.push({ id: crypto.randomUUID(), gameId: next.id, table, slot, locked: false });
      used.add(next.id);
      tableHistory.add(next.id);
      minutes += sessionMinutes(next);
      prevId = next.id;
      slot += 1;
    }
  }
  return sessions;
}

function normalizeSlots(sessions) {
  const byTable = new Map();
  sessions.forEach((session) => {
    if (!byTable.has(session.table)) byTable.set(session.table, []);
    byTable.get(session.table).push(session);
  });
  byTable.forEach((list) => {
    list
      .sort((a, b) => a.slot - b.slot)
      .forEach((session, index) => {
        session.slot = index;
      });
  });
  sessions.sort((a, b) => a.table - b.table || a.slot - b.slot);
  return sessions;
}

// 计算每场次的起止时间与五个阶段的时间轴
function layoutSessions(sessions) {
  const byTable = new Map();
  sessions.forEach((session) => {
    if (!byTable.has(session.table)) byTable.set(session.table, []);
    byTable.get(session.table).push(session);
  });
  const laid = [];
  [...byTable.entries()].forEach(([table, list]) => {
    let cursor = 0;
    list
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .forEach((session) => {
        const game = gameById(session.gameId);
        if (!game) return;
        const rawPhases = phaseTimes(game);
        let phaseCursor = cursor;
        const phases = PHASES.map((phase) => {
          const minutes = rawPhases[phase.key];
          const item = { ...phase, minutes, start: phaseCursor, end: phaseCursor + minutes };
          phaseCursor += minutes;
          return item;
        });
        const total = phases.reduce((sum, phase) => sum + phase.minutes, 0);
        laid.push({ ...session, table, game, phases, minutes: total, start: cursor, end: cursor + total });
        cursor += total;
      });
  });
  return laid.sort((a, b) => a.table - b.table || a.slot - b.slot);
}

function formatClock(offsetMinutes) {
  const [hour, minute] = (state.party.startTime || "19:00").split(":").map(Number);
  const total = (((hour * 60 + minute + offsetMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function snapshotParty() {
  return structuredClone(state.party);
}

// 所有主持台改动都经过 commitParty：先存历史快照，再变更，再保存+重排渲染
function commitParty(mutate) {
  partyHistory.past.push(snapshotParty());
  if (partyHistory.past.length > HISTORY_LIMIT) partyHistory.past.shift();
  partyHistory.future = [];
  mutate();
  normalizeSlots(state.party.sessions);
  saveState();
  renderParty();
}

function undoParty() {
  if (!partyHistory.past.length) return;
  partyHistory.future.push(snapshotParty());
  state.party = partyHistory.past.pop();
  saveState();
  renderParty();
  showPartyMessage("已撤销上一步改动。", "ok");
}

function redoParty() {
  if (!partyHistory.future.length) return;
  partyHistory.past.push(snapshotParty());
  state.party = partyHistory.future.pop();
  saveState();
  renderParty();
  showPartyMessage("已恢复被撤销的改动。", "ok");
}

function showPartyMessage(text, type = "ok") {
  partyEls.message.textContent = text;
  partyEls.message.dataset.type = type;
}

function pushDraft(name) {
  state.party.drafts.unshift({
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    players: state.party.players,
    totalMinutes: state.party.totalMinutes,
    startTime: state.party.startTime,
    focus: state.party.focus,
    sessions: structuredClone(state.party.sessions)
  });
  if (state.party.drafts.length > 12) state.party.drafts.length = 12;
}

function readPartyForm() {
  return {
    players: clampInt(partyEls.players.value, 1, 99, state.party.players),
    totalMinutes: clampInt(partyEls.minutes.value, 30, 1440, state.party.totalMinutes),
    focus: FOCUS_KEYS.includes(partyEls.focus.value) ? partyEls.focus.value : "forgets",
    startTime: /^\d{2}:\d{2}$/.test(partyEls.start.value) ? partyEls.start.value : state.party.startTime
  };
}

// 人数变化 / 迟到缺席 / 参数调整：先完整保留调整前方案为草稿，再给出可执行新方案
function replanParty(reason) {
  const next = readPartyForm();
  const hadPlan = state.party.sessions.length > 0;
  commitParty(() => {
    if (hadPlan) pushDraft(`调整前 · ${reason}`);
    Object.assign(state.party, next);
    state.party.sessions = buildPlan(
      state.party.players,
      state.party.totalMinutes,
      state.party.focus,
      state.party.sessions
    );
  });
  const { tables, perTable } = tableSplit(state.party.players);
  showPartyMessage(
    `${reason}：已按 ${state.party.players} 人（${tables} 桌，每桌约 ${perTable} 人）重新编排` +
      `${hadPlan ? "，原方案已存入草稿箱" : ""}。`,
    "ok"
  );
}

// 中途插队：找到不违反“连续不重复”的最早空位插入
function insertSession(gameId) {
  const game = gameById(gameId);
  if (!game) return null;
  const { tables } = tableSplit(state.party.players);
  const laid = layoutSessions(state.party.sessions);
  let best = null;
  for (let table = 1; table <= tables; table += 1) {
    const list = laid.filter((session) => session.table === table);
    for (let index = 0; index <= list.length; index += 1) {
      const prev = list[index - 1];
      const next = list[index];
      if (prev?.gameId === gameId || next?.gameId === gameId) continue;
      const start = prev ? prev.end : 0;
      if (!best || start < best.start || (start === best.start && table < best.table)) {
        best = { table, index, start };
      }
    }
  }
  if (!best) {
    const totals = Array.from({ length: tables }, (_, i) => {
      const tableSessions = laid.filter((session) => session.table === i + 1);
      return { table: i + 1, end: tableSessions.length ? Math.max(...tableSessions.map((s) => s.end)) : 0, count: tableSessions.length };
    }).sort((a, b) => a.end - b.end);
    const target = totals[0];
    best = { table: target.table, index: target.count, start: target.end };
  }
  state.party.sessions.forEach((session) => {
    if (session.table === best.table && session.slot >= best.index) session.slot += 1;
  });
  state.party.sessions.push({ id: crypto.randomUUID(), gameId, table: best.table, slot: best.index, locked: false });
  return best;
}

function moveSession(sessionId, targetTable, targetIndex) {
  const session = state.party.sessions.find((item) => item.id === sessionId);
  if (!session) return false;
  const { tables } = tableSplit(state.party.players);
  const table = Math.min(Math.max(1, targetTable), tables);
  const siblings = state.party.sessions
    .filter((item) => item.table === table && item.id !== sessionId)
    .sort((a, b) => a.slot - b.slot);
  const index = Math.min(Math.max(0, targetIndex), siblings.length);
  const prev = siblings[index - 1];
  const next = siblings[index];
  if (prev?.gameId === session.gameId || next?.gameId === session.gameId) {
    showPartyMessage("不能把同一款桌游排到连续两局，已取消这次拖动。", "error");
    return false;
  }
  commitParty(() => {
    state.party.sessions = state.party.sessions.filter((item) => item.id !== sessionId);
    siblings.forEach((item, i) => {
      item.slot = i >= index ? i + 1 : i;
    });
    session.table = table;
    session.slot = index;
    state.party.sessions.push(session, ...siblings.filter((s) => !state.party.sessions.includes(s)));
  });
  showPartyMessage(`已把《${gameById(session.gameId)?.name || "该局"}》移到 ${table} 号桌第 ${index + 1} 局，时间已重排。`, "ok");
  return true;
}

function replaceCandidates(session) {
  const { perTable } = tableSplit(state.party.players);
  const laid = layoutSessions(state.party.sessions).filter((item) => item.table === session.table);
  const index = laid.findIndex((item) => item.id === session.id);
  const prevId = laid[index - 1]?.gameId;
  const nextId = laid[index + 1]?.gameId;
  return rankGames(perTable, state.party.focus).filter((game) => game.id !== prevId && game.id !== nextId);
}

function sessionWarnings(laid, session) {
  const warnings = [];
  const { perTable } = tableSplit(state.party.players);
  if (perTable < session.game.minPlayers || perTable > session.game.maxPlayers) {
    warnings.push(`人数不符（支持 ${session.game.minPlayers}-${session.game.maxPlayers} 人）`);
  }
  if (session.end > state.party.totalMinutes) {
    warnings.push(`超出总时长 ${session.end - state.party.totalMinutes} 分钟`);
  }
  return warnings;
}

function renderParty() {
  const party = state.party;
  if (document.activeElement !== partyEls.players) partyEls.players.value = party.players;
  if (document.activeElement !== partyEls.minutes) partyEls.minutes.value = party.totalMinutes;
  if (document.activeElement !== partyEls.start) partyEls.start.value = party.startTime;
  if (document.activeElement !== partyEls.focus) partyEls.focus.value = party.focus;

  partyEls.undoBtn.disabled = !partyHistory.past.length;
  partyEls.redoBtn.disabled = !partyHistory.future.length;

  partyEls.insertSelect.innerHTML =
    state.games
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
      .map((game) => `<option value="${game.id}">${escapeHtml(game.name)}（${game.minPlayers}-${game.maxPlayers}人）</option>`)
      .join("") || `<option value="">先添加桌游</option>`;

  const { tables, perTable } = tableSplit(party.players);
  const laid = layoutSessions(party.sessions);

  const overtimeByTable = [];
  for (let table = 1; table <= tables; table += 1) {
    const tableSessions = laid.filter((session) => session.table === table);
    const end = tableSessions.length ? Math.max(...tableSessions.map((session) => session.end)) : 0;
    if (end > party.totalMinutes) overtimeByTable.push({ table, over: end - party.totalMinutes });
  }
  if (overtimeByTable.length) {
    partyEls.overtime.hidden = false;
    partyEls.overtime.innerHTML =
      `<strong>超时提醒：</strong>` +
      overtimeByTable.map((item) => `${item.table} 号桌超出 ${item.over} 分钟`).join("；") +
      `。请删减场次、替换更短的桌游或调大总时长。`;
  } else {
    partyEls.overtime.hidden = true;
    partyEls.overtime.innerHTML = "";
  }

  let columnsHtml = "";
  for (let table = 1; table <= tables; table += 1) {
    const tableSessions = laid.filter((session) => session.table === table);
    const cards = tableSessions
      .map((session) => {
        const warnings = sessionWarnings(laid, session);
        const candidates = replaceCandidates(session);
        const options = [session.game, ...candidates.filter((game) => game.id !== session.gameId)]
          .map(
            (game) =>
              `<option value="${game.id}" ${game.id === session.gameId ? "selected" : ""}>${escapeHtml(game.name)}（${sessionMinutes(game)}分钟）</option>`
          )
          .join("");
        return `
          <article class="session-card ${session.locked ? "locked" : ""} ${warnings.length ? "warn" : ""}"
                   draggable="true" data-session-id="${session.id}">
            <header>
              <strong>${escapeHtml(session.game.name)}</strong>
              <span class="session-time">${formatClock(session.start)}–${formatClock(session.end)}</span>
            </header>
            <div class="phase-row">
              ${session.phases
                .map(
                  (phase) =>
                    `<span class="phase phase-${phase.key}" title="${phase.label} ${formatClock(phase.start)}–${formatClock(phase.end)}">${phase.label} ${phase.minutes}′</span>`
                )
                .join("")}
            </div>
            ${
              warnings.length
                ? `<div class="session-warnings">${warnings.map((warning) => `<span>⚠ ${escapeHtml(warning)}</span>`).join("")}</div>`
                : ""
            }
            <div class="session-actions">
              <select class="replace-select" data-session-id="${session.id}" title="替换为其他桌游">${options}</select>
              <button type="button" class="lock-btn" data-session-id="${session.id}">${session.locked ? "解锁" : "锁定"}</button>
              <button type="button" class="remove-btn" data-session-id="${session.id}">移除</button>
            </div>
          </article>
        `;
      })
      .join("");
    columnsHtml += `
      <div class="table-col" data-table-col="${table}">
        <h3>${table} 号桌 · 约 ${perTable} 人</h3>
        <div class="table-sessions">
          ${cards || `<p class="empty">这一桌还没有安排场次。</p>`}
        </div>
      </div>
    `;
  }
  partyEls.timeline.innerHTML = party.sessions.length
    ? columnsHtml
    : `<p class="empty">当前人数下没有可安排的桌游，请调整人数或先去收藏里添加桌游。</p>`;

  partyEls.draftList.innerHTML =
    party.drafts
      .map(
        (draft) => `
        <li data-draft-id="${draft.id}">
          <div>
            <strong>${escapeHtml(draft.name)}</strong>
            <span>${draft.players} 人 · ${draft.totalMinutes} 分钟 · ${draft.sessions.length} 局 · ${new Date(draft.savedAt).toLocaleString("zh-CN")}</span>
          </div>
          <div class="draft-actions">
            <button type="button" class="restore-draft" data-draft-id="${draft.id}">恢复</button>
            <button type="button" class="delete-draft" data-draft-id="${draft.id}">删除</button>
          </div>
        </li>
      `
      )
      .join("") || `<li class="empty">暂无草稿。人数变化、迟到缺席或重新编排时会自动保留。</li>`;
}

/* ---------- 导出 / 导入 ---------- */

function exportParty() {
  const laid = layoutSessions(state.party.sessions);
  const payload = {
    app: "zfl18-party-plan",
    version: 1,
    exportedAt: new Date().toISOString(),
    party: {
      players: state.party.players,
      totalMinutes: state.party.totalMinutes,
      startTime: state.party.startTime,
      focus: state.party.focus,
      sessions: laid.map((session) => ({
        id: session.id,
        gameId: session.gameId,
        gameName: session.game.name,
        table: session.table,
        slot: session.slot,
        locked: !!session.locked,
        start: session.start,
        end: session.end
      }))
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `party-plan-${new Date().toISOString().slice(0, 16).replaceAll(":", "")}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showPartyMessage("已导出当前方案。", "ok");
}

// 导入校验：重复场次、时间冲突、人数不符、失效引用全部拦住；失败不碰原数据
function validatePartyImport(payload) {
  const errors = [];
  const plan = payload && typeof payload === "object" ? payload.party || payload : null;
  if (!plan || typeof plan !== "object") {
    return { errors: ["文件格式不正确：找不到方案数据。"], plan: null };
  }

  const players = Number(plan.players);
  const totalMinutes = Number(plan.totalMinutes);
  if (!Number.isInteger(players) || players < 1 || players > 99) errors.push("人数无效：必须是 1-99 的整数。");
  if (!Number.isInteger(totalMinutes) || totalMinutes < 30 || totalMinutes > 1440) {
    errors.push("总时长无效：必须是 30-1440 的整数分钟。");
  }
  const focus = FOCUS_KEYS.includes(plan.focus) ? plan.focus : "forgets";
  const startTime = /^\d{2}:\d{2}$/.test(plan.startTime || "") ? plan.startTime : "19:00";

  const rawSessions = Array.isArray(plan.sessions) ? plan.sessions : null;
  if (!rawSessions) errors.push("缺少场次列表（sessions）。");

  const sessions = [];
  if (rawSessions) {
    const seenIds = new Set();
    const seenSlots = new Set();
    const perTable = errors.length ? 0 : tableSplit(players).perTable;
    rawSessions.forEach((raw, index) => {
      const label = `第 ${index + 1} 场`;
      if (!raw || typeof raw !== "object") {
        errors.push(`${label}：场次数据损坏。`);
        return;
      }
      const id = String(raw.id || "");
      if (!id || seenIds.has(id)) {
        errors.push(`重复场次：${id ? `ID ${id}` : label} 出现多次。`);
        return;
      }
      seenIds.add(id);
      const table = Number(raw.table);
      const slot = Number(raw.slot);
      if (!Number.isInteger(table) || table < 1 || !Number.isInteger(slot) || slot < 0) {
        errors.push(`${label}：桌号或局序无效。`);
        return;
      }
      const slotKey = `${table}:${slot}`;
      if (seenSlots.has(slotKey)) {
        errors.push(`重复场次：${table} 号桌第 ${slot + 1} 局被占用多次。`);
        return;
      }
      seenSlots.add(slotKey);
      const game = gameById(String(raw.gameId || ""));
      if (!game) {
        errors.push(`失效引用：${label} 引用的桌游不在收藏中（${raw.gameName || raw.gameId || "未知"}）。`);
        return;
      }
      if (perTable && (perTable < game.minPlayers || perTable > game.maxPlayers)) {
        errors.push(`人数不符：《${game.name}》支持 ${game.minPlayers}-${game.maxPlayers} 人，当前每桌约 ${perTable} 人。`);
      }
      sessions.push({
        id,
        gameId: game.id,
        table,
        slot,
        locked: raw.locked === true,
        start: Number.isFinite(raw.start) ? Number(raw.start) : null,
        end: Number.isFinite(raw.end) ? Number(raw.end) : null
      });
    });

    // 时间冲突：同一桌上自带起止时间的场次不能重叠
    const timed = sessions.filter((session) => session.start !== null && session.end !== null);
    const byTable = new Map();
    timed.forEach((session) => {
      if (!byTable.has(session.table)) byTable.set(session.table, []);
      byTable.get(session.table).push(session);
    });
    byTable.forEach((list, table) => {
      list
        .slice()
        .sort((a, b) => a.start - b.start)
        .forEach((session, index, sorted) => {
          const prev = sorted[index - 1];
          if (prev && session.start < prev.end) {
            const nameOf = (item) => gameById(item.gameId)?.name || item.gameId;
            errors.push(`时间冲突：${table} 号桌《${nameOf(prev)}》与《${nameOf(session)}》时段重叠。`);
          }
        });
    });

    // 连续开桌不能重复同一款
    const ordered = sessions.slice().sort((a, b) => a.table - b.table || a.slot - b.slot);
    ordered.forEach((session, index) => {
      const prev = ordered[index - 1];
      if (prev && prev.table === session.table && prev.gameId === session.gameId) {
        errors.push(`连续重复：${session.table} 号桌第 ${prev.slot + 1}、${session.slot + 1} 局是同一款《${gameById(session.gameId).name}》。`);
      }
    });
  }

  if (errors.length) return { errors, plan: null };
  return {
    errors: [],
    plan: { players, totalMinutes, focus, startTime, sessions: sessions.map(({ start, end, ...rest }) => rest) }
  };
}

function importParty(file) {
  if (!file) return;
  const before = snapshotParty();
  const reader = new FileReader();
  reader.onload = () => {
    let payload;
    try {
      payload = JSON.parse(reader.result);
    } catch {
      showPartyMessage("导入失败：文件不是有效的 JSON，当前方案未受影响。", "error");
      return;
    }
    const { errors, plan } = validatePartyImport(payload);
    if (errors.length) {
      // 失败不能覆盖原数据：只提示，不改动 state
      const unchanged = JSON.stringify(before) === JSON.stringify(snapshotParty());
      showPartyMessage(`导入已拦截：${errors.join("；")}（当前方案${unchanged ? "未受影响" : "已保护"}）`, "error");
      return;
    }
    commitParty(() => {
      pushDraft("导入前方案");
      state.party.players = plan.players;
      state.party.totalMinutes = plan.totalMinutes;
      state.party.focus = plan.focus;
      state.party.startTime = plan.startTime;
      state.party.sessions = plan.sessions;
    });
    showPartyMessage(`导入成功：${plan.sessions.length} 场已排入 ${tableSplit(plan.players).tables} 桌，导入前方案已存入草稿箱。`, "ok");
  };
  reader.onerror = () => showPartyMessage("导入失败：无法读取文件，当前方案未受影响。", "error");
  reader.readAsText(file);
}

/* ---------- 主持台事件 ---------- */

partyEls.form.addEventListener("submit", (event) => {
  event.preventDefault();
  replanParty("参数调整");
});

partyEls.lateBtn.addEventListener("click", () => {
  replanParty("迟到/缺席调整");
});

partyEls.insertBtn.addEventListener("click", () => {
  const gameId = partyEls.insertSelect.value;
  const game = gameById(gameId);
  if (!game) {
    showPartyMessage("请先在收藏里添加桌游，再中途插队。", "error");
    return;
  }
  const { perTable } = tableSplit(state.party.players);
  if (perTable < game.minPlayers || perTable > game.maxPlayers) {
    showPartyMessage(
      `插队失败：《${game.name}》支持 ${game.minPlayers}-${game.maxPlayers} 人，当前每桌约 ${perTable} 人。`,
      "error"
    );
    return;
  }
  commitParty(() => {
    pushDraft("插队前方案");
    const position = insertSession(gameId);
    showPartyMessage(
      `已把《${game.name}》插到 ${position.table} 号桌第 ${position.index + 1} 局，时间已重排，插队前方案已存入草稿箱。`,
      "ok"
    );
  });
});

partyEls.saveDraftBtn.addEventListener("click", () => {
  if (!state.party.sessions.length) {
    showPartyMessage("当前还没有方案，先编排再存草稿。", "error");
    return;
  }
  commitParty(() => pushDraft(`手动存档 · ${state.party.players} 人 ${state.party.totalMinutes} 分钟`));
  showPartyMessage("当前方案已存入草稿箱。", "ok");
});

partyEls.undoBtn.addEventListener("click", undoParty);
partyEls.redoBtn.addEventListener("click", redoParty);
partyEls.exportBtn.addEventListener("click", exportParty);
partyEls.importBtn.addEventListener("click", () => partyEls.importInput.click());
partyEls.importInput.addEventListener("change", (event) => {
  importParty(event.target.files[0]);
  event.target.value = "";
});

partyEls.timeline.addEventListener("click", (event) => {
  const lockBtn = event.target.closest(".lock-btn");
  const removeBtn = event.target.closest(".remove-btn");
  if (lockBtn) {
    const id = lockBtn.dataset.sessionId;
    commitParty(() => {
      const session = state.party.sessions.find((item) => item.id === id);
      if (session) session.locked = !session.locked;
    });
    const locked = state.party.sessions.find((item) => item.id === id)?.locked;
    showPartyMessage(locked ? "已锁定：重新编排时这一局保持不动。" : "已解锁：重新编排时这一局可被调整。", "ok");
  }
  if (removeBtn) {
    const id = removeBtn.dataset.sessionId;
    const session = state.party.sessions.find((item) => item.id === id);
    if (!session) return;
    commitParty(() => {
      state.party.sessions = state.party.sessions.filter((item) => item.id !== id);
    });
    showPartyMessage(`已移除《${gameById(session.gameId)?.name || "该局"}》，后续局时间已重排。`, "ok");
  }
});

partyEls.timeline.addEventListener("change", (event) => {
  const select = event.target.closest(".replace-select");
  if (!select) return;
  const id = select.dataset.sessionId;
  const game = gameById(select.value);
  const session = state.party.sessions.find((item) => item.id === id);
  if (!game || !session || session.gameId === game.id) return;
  commitParty(() => {
    session.gameId = game.id;
  });
  showPartyMessage(`已把该桌第 ${session.slot + 1} 局替换为《${game.name}》，时间已重排。`, "ok");
});

partyEls.timeline.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-session-id]");
  if (!card) return;
  event.dataTransfer.setData("text/plain", card.dataset.sessionId);
  event.dataTransfer.effectAllowed = "move";
  card.classList.add("dragging");
});

partyEls.timeline.addEventListener("dragend", () => {
  partyEls.timeline.querySelectorAll(".dragging").forEach((card) => card.classList.remove("dragging"));
  partyEls.timeline.querySelectorAll(".drop-hint").forEach((col) => col.classList.remove("drop-hint"));
});

partyEls.timeline.addEventListener("dragover", (event) => {
  const column = event.target.closest("[data-table-col]");
  if (!column) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  column.classList.add("drop-hint");
});

partyEls.timeline.addEventListener("dragleave", (event) => {
  const column = event.target.closest("[data-table-col]");
  if (column && !column.contains(event.relatedTarget)) column.classList.remove("drop-hint");
});

partyEls.timeline.addEventListener("drop", (event) => {
  const column = event.target.closest("[data-table-col]");
  if (!column) return;
  event.preventDefault();
  column.classList.remove("drop-hint");
  const sessionId = event.dataTransfer.getData("text/plain");
  if (!sessionId) return;
  const table = Number(column.dataset.tableCol);
  const targetCard = event.target.closest("[data-session-id]");
  let index;
  if (targetCard && targetCard.dataset.sessionId !== sessionId) {
    const rect = targetCard.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    const targetSession = state.party.sessions.find((item) => item.id === targetCard.dataset.sessionId);
    index = (targetSession?.slot ?? 0) + (after ? 1 : 0);
    const dragged = state.party.sessions.find((item) => item.id === sessionId);
    if (dragged && dragged.table === table && dragged.slot < index) index -= 1;
  } else {
    index = state.party.sessions.filter((item) => item.table === table && item.id !== sessionId).length;
  }
  moveSession(sessionId, table, index);
});

partyEls.draftList.addEventListener("click", (event) => {
  const restoreBtn = event.target.closest(".restore-draft");
  const deleteBtn = event.target.closest(".delete-draft");
  if (restoreBtn) {
    const draft = state.party.drafts.find((item) => item.id === restoreBtn.dataset.draftId);
    if (!draft) return;
    commitParty(() => {
      state.party.players = draft.players;
      state.party.totalMinutes = draft.totalMinutes;
      state.party.startTime = draft.startTime;
      state.party.focus = draft.focus;
      state.party.sessions = structuredClone(draft.sessions).filter((session) => gameById(session.gameId));
    });
    showPartyMessage(`已恢复草稿「${draft.name}」，恢复前的方案可用撤销找回。`, "ok");
  }
  if (deleteBtn) {
    const id = deleteBtn.dataset.draftId;
    commitParty(() => {
      state.party.drafts = state.party.drafts.filter((item) => item.id !== id);
    });
    showPartyMessage("草稿已删除。", "ok");
  }
});

/* ---------- 启动 ---------- */

ensurePartyState();
if (!state.party.sessions.length && state.games.length) {
  state.party.sessions = buildPlan(state.party.players, state.party.totalMinutes, state.party.focus);
  normalizeSlots(state.party.sessions);
}

setDefaultDate();
renderAll();
renderParty();
