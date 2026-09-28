const STORAGE_KEY = "dream-archive-v1";
const DISPLAY_KEY = "dream-archive-display";

const sampleDreams = [
  {
    id: "sample-1",
    title: "蓝色车站没有尽头",
    date: "2026-09-21",
    mood: "奇异",
    content: "我坐在一列没有司机的火车上。窗外一直是傍晚，站台上的钟都停在六点十七分。每到一站，都会有一个看起来像旧同学的人上车，但我怎么也想不起他们的名字。",
    tags: ["车站", "黄昏", "旧同学", "迷路"],
    afterthought: "醒来后，耳边好像还有列车进站的声音。"
  },
  {
    id: "sample-2",
    title: "鲸鱼从城市上空游过",
    date: "2026-09-16",
    mood: "平静",
    content: "整座城市浸在很浅的海里，人们照常走路。巨大的鲸鱼缓慢地从楼顶游过，影子落下来时，所有人都停住了。只有我继续往前走，鞋里却没有进水。",
    tags: ["鲸鱼", "城市", "海", "飞行"],
    afterthought: "这是一个很安静的梦。"
  },
  {
    id: "sample-3",
    title: "外婆家的第十三扇门",
    date: "2026-09-03",
    mood: "怀念",
    content: "老房子的走廊比记忆里长，多出了一扇绿色的门。门后是夏天的厨房，外婆背对着我切西瓜。我知道不能叫她，否则这个房间就会消失。",
    tags: ["老房子", "外婆", "夏天", "门"],
    afterthought: "很想再回去一次。"
  },
  {
    id: "sample-4",
    title: "不会落地的雨",
    date: "2026-08-28",
    mood: "不安",
    content: "雨从地面向天空升起。人们撑着伞，却都把伞举在脚边。我站在便利店门口等一个没有见过的人，手机里只有一条写着“别回头”的消息。",
    tags: ["雨", "便利店", "等待", "手机"],
    afterthought: "梦里最可怕的是每个人都觉得很正常。"
  },
  {
    id: "sample-5",
    title: "月亮沉进游泳池",
    date: "2026-08-11",
    mood: "愉悦",
    content: "学校的游泳池在夜里变得很深，月亮像一枚硬币沉在池底。我潜下去把它捞起来，它在手中很轻，边缘还带着一点温度。",
    tags: ["月亮", "学校", "游泳池", "夜晚"],
    afterthought: "醒来时手心是热的。"
  },
  {
    id: "sample-6",
    title: "在森林里交换名字",
    date: "2026-07-30",
    mood: "奇异",
    content: "森林里的每棵树都挂着一个名字。我把自己的名字摘下来，换成了一个完全陌生的。之后所有动物都认识我，而同行的人再也看不见我。",
    tags: ["森林", "名字", "动物", "隐身"],
    afterthought: "那个新名字醒来后就忘记了。"
  }
];

const state = {
  dreams: loadDreams(),
  view: "timeline",
  query: "",
  year: "all",
  element: null,
  sortDesc: true
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadDreams() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : sampleDreams;
  } catch { return sampleDreams; }
}

function saveDreams() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dreams)); }

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function allTags() {
  const counts = {};
  state.dreams.forEach(d => d.tags.forEach(tag => counts[tag] = (counts[tag] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
}

function filteredDreams(forElements = false) {
  const query = state.query.trim().toLowerCase();
  return state.dreams
    .filter(d => state.year === "all" || d.date.startsWith(state.year))
    .filter(d => !forElements || !state.element || d.tags.includes(state.element))
    .filter(d => !query || [d.title, d.content, d.mood, d.afterthought, ...d.tags].join(" ").toLowerCase().includes(query))
    .sort((a, b) => state.sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
}

function renderCard(dream, index, timeline = false) {
  const node = $("#dreamCardTemplate").content.cloneNode(true);
  const article = node.querySelector(".dream-card");
  if (timeline) {
    article.classList.add("timeline-entry");
    article.style.gridRow = String(index + 1);
    article.dataset.year = dream.date.slice(0, 4);
    article.dataset.date = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" })
      .format(new Date(`${dream.date}T12:00:00`));
  }
  node.querySelector("time").textContent = formatDate(dream.date);
  renderMood(node.querySelector(".mood"), dream);
  node.querySelector("h2").textContent = dream.title || "未命名梦境";
  node.querySelector(".card-excerpt").textContent = dream.content;
  const tagWrap = node.querySelector(".card-tags");
  dream.tags.slice(0, 4).forEach(tag => {
    const span = document.createElement("span");
    span.textContent = `# ${tag}`;
    tagWrap.append(span);
  });
  node.querySelector(".card-open").addEventListener("click", () => openDetail(dream));
  return node;
}

function renderMood(target, dream) {
  const colors = dream.colors || [];
  if (!colors.length && !dream.mood) {
    target.hidden = true;
    return;
  }
  const dots = colors.slice(0, 5).map(color => `<i class="mood-dot" style="--dot:${escapeHTML(color)}"></i>`).join("");
  target.innerHTML = `<span class="mood-dots">${dots}</span><span>${escapeHTML(dream.mood)}</span>`;
}

function renderGrid(target, dreams, timeline = false) {
  target.replaceChildren(...dreams.map((dream, index) => renderCard(dream, index, timeline)));
}

function renderRail() {
  const tags = allTags().slice(0, 14);
  const rail = $("#railList");
  rail.replaceChildren();
  const all = createRailItem("全部", state.dreams.length, null);
  rail.append(all);
  tags.forEach(([tag, count]) => rail.append(createRailItem(tag, count, tag)));
}

function createRailItem(label, count, tag) {
  const button = document.createElement("button");
  button.className = `rail-item ${state.element === tag ? "active" : ""}`;
  button.innerHTML = `<span class="rail-orb">${label.slice(0, 1)}</span><span>${label} ${count}</span>`;
  button.addEventListener("click", () => {
    state.element = tag;
    setView("elements");
    render();
  });
  return button;
}

function renderYears() {
  const years = [...new Set(state.dreams.map(d => d.date.slice(0, 4)))].sort().reverse();
  const wrap = $("#yearFilters");
  wrap.replaceChildren();
  [["all", "全部"], ...years.map(y => [y, y])].forEach(([value, label]) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = state.year === value ? "active" : "";
    button.addEventListener("click", () => { state.year = value; render(); });
    wrap.append(button);
  });
}

function renderTagCloud() {
  const wrap = $("#tagCloud");
  wrap.replaceChildren();
  const tags = allTags();
  tags.forEach(([tag, count], index) => {
    const button = document.createElement("button");
    button.className = state.element === tag ? "active" : "";
    button.style.fontSize = `${Math.max(13, 22 - index * .36)}px`;
    button.innerHTML = `${tag}<small>${count}</small>`;
    button.addEventListener("click", () => { state.element = tag; render(); });
    wrap.append(button);
  });
  $("#activeElementTitle").textContent = state.element ? `元素：${state.element}` : "全部梦境";
}

function render() {
  const timelineDreams = filteredDreams(false);
  const elementDreams = filteredDreams(true);
  renderRail();
  renderYears();
  renderTagCloud();
  renderGrid($("#dreamGrid"), timelineDreams, true);
  renderGrid($("#elementGrid"), elementDreams);
  const activeDreams = state.view === "timeline" ? timelineDreams : elementDreams;
  $("#emptyState").hidden = activeDreams.length > 0;
  $("#dreamGrid").hidden = state.view === "timeline" && activeDreams.length === 0;
  $("#elementGrid").hidden = state.view === "elements" && activeDreams.length === 0;
  $("#sortButton").textContent = state.sortDesc ? "最新优先 ↓" : "最早优先 ↑";
}

function setView(view) {
  state.view = view;
  $$(".nav-link").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  $$(".view").forEach(section => section.classList.remove("active"));
  $(`#${view}View`).classList.add("active");
  render();
}

function openDetail(dream) {
  const content = $("#detailContent");
  content.innerHTML = `
    <div class="detail-copy">
      <div class="card-meta"><time>${formatDate(dream.date)}</time><span class="mood"></span></div>
      <h2>${escapeHTML(dream.title || "未命名梦境")}</h2>
      <p class="story">${escapeHTML(dream.content)}</p>
      ${dream.afterthought ? `<p class="afterthought">醒来后：${escapeHTML(dream.afterthought)}</p>` : ""}
      <div class="card-tags">${dream.tags.map(tag => `<span># ${escapeHTML(tag)}</span>`).join("")}</div>
      <div style="margin-top:34px"><button class="delete-button" data-delete="${dream.id}">删除这条记录</button></div>
    </div>`;
  renderMood(content.querySelector(".mood"), dream);
  content.querySelector("[data-delete]").addEventListener("click", () => deleteDream(dream.id));
  $("#detailDialog").showModal();
}

function deleteDream(id) {
  if (!confirm("确定删除这条梦境记录吗？此操作无法撤销。")) return;
  state.dreams = state.dreams.filter(d => d.id !== id);
  saveDreams();
  $("#detailDialog").close();
  render();
}

function escapeHTML(value = "") {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function initEvents() {
  const savedDisplay = localStorage.getItem(DISPLAY_KEY) || "desktop";
  setDisplayMode(savedDisplay);
  $$(".display-switch button").forEach(button => button.addEventListener("click", () => {
    setDisplayMode(button.dataset.display);
  }));
  $$(".nav-link").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
  $("#sortButton").addEventListener("click", () => { state.sortDesc = !state.sortDesc; render(); });
  $("#clearElement").addEventListener("click", () => { state.element = null; render(); });
  $("#searchInput").addEventListener("input", e => { state.query = e.target.value; render(); });
  $("#railPrev").addEventListener("click", () => $("#railList").scrollBy({ left: -300, behavior: "smooth" }));
  $("#railNext").addEventListener("click", () => $("#railList").scrollBy({ left: 300, behavior: "smooth" }));

  const composer = $("#composer");
  const customColor = $("#customColor");
  customColor.addEventListener("change", event => {
    const color = event.target.value.toLowerCase();
    if ($(`#colorPalette input[name="colors"][value="${color}"]`)) {
      $(`#colorPalette input[name="colors"][value="${color}"]`).checked = true;
      return;
    }
    const label = document.createElement("label");
    label.className = "added-color";
    label.style.setProperty("--swatch", color);
    label.innerHTML = `<input type="checkbox" name="colors" value="${color}" checked><span title="${color}"></span>`;
    $("#colorPalette").insertBefore(label, $(".custom-color"));
  });
  $("#openComposer").addEventListener("click", () => {
    $("#dreamForm").elements.date.value = new Date().toISOString().slice(0, 10);
    composer.showModal();
  });
  ["#closeComposer", "#cancelComposer"].forEach(id => $(id).addEventListener("click", () => composer.close()));
  $("#closeDetail").addEventListener("click", () => $("#detailDialog").close());

  $("#dreamForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const dream = {
      id: `dream-${Date.now()}`,
      title: data.get("title").trim(),
      date: data.get("date"),
      mood: data.get("mood"),
      colors: data.getAll("colors"),
      content: data.get("content").trim(),
      tags: data.get("tags").split(/[,，]/).map(t => t.trim()).filter(Boolean),
      afterthought: data.get("afterthought").trim()
    };
    state.dreams.push(dream);
    saveDreams();
    event.currentTarget.reset();
    $$("#colorPalette .added-color").forEach(item => item.remove());
    composer.close();
    state.year = "all";
    setView("timeline");
  });

  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#searchInput").focus();
    }
    if (event.key === "Escape") $("#searchInput").blur();
  });
}

function setDisplayMode(mode) {
  const mobile = mode === "mobile";
  document.body.classList.toggle("mobile-preview", mobile);
  $$(".display-switch button").forEach(button => button.classList.toggle("active", button.dataset.display === mode));
  localStorage.setItem(DISPLAY_KEY, mode);
}

initEvents();
render();
