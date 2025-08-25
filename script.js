/* ========= State & Elements ========= */
const STORAGE_KEY = "todo_pro_v2";
let tasks = load();

const els = {
  input: document.getElementById("taskInput"),
  addBtn: document.getElementById("addBtn"),
  pending: document.getElementById("pendingList"),
  completed: document.getElementById("completedList"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  clearCompleted: document.getElementById("clearCompleted"),
  clearAll: document.getElementById("clearAll"),
};

/* ========= Init ========= */
render();
updateProgress();

/* ========= Events ========= */
els.addBtn.addEventListener("click", onAdd);
els.input.addEventListener("keydown", e => { if (e.key === "Enter") onAdd(); });

els.clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.completed);
  save(); render(); updateProgress();
});
els.clearAll.addEventListener("click", () => {
  tasks = []; save(); render(); updateProgress();
});

/* ========= Core Actions ========= */
function onAdd(){
  const text = els.input.value.trim();
  if (!text) return;
  tasks.push({ id: crypto.randomUUID(), text, completed:false, created: Date.now() });
  els.input.value = "";
  save(); render(); updateProgress();
}

function toggleComplete(id){
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const wasCompleted = t.completed;
  t.completed = !t.completed;
  save(); render(); updateProgress();

  // confetti only when newly completed
  if (!wasCompleted && t.completed){
    const li = document.querySelector(`[data-id="${id}"]`);
    burstConfettiAtElement(li);
  }
}

function startEdit(id){
  const li = document.querySelector(`[data-id="${id}"]`);
  if (!li) return;
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  li.classList.add("editing");

  const editRow = document.createElement("div");
  editRow.className = "edit-row";

  const input = document.createElement("input");
  input.className = "edit-input";
  input.value = t.text;
  input.placeholder = "Update task…";
  input.addEventListener("keydown", e=>{
    if (e.key === "Enter") saveEdit(id, input.value.trim());
    if (e.key === "Escape") cancelEdit(li, editRow);
  });

  const saveBtn = btn("save","Save", () => saveEdit(id, input.value.trim()));
  const cancelBtn = btn("cancel","Cancel", () => cancelEdit(li, editRow));

  editRow.appendChild(input);
  editRow.appendChild(saveBtn);
  editRow.appendChild(cancelBtn);

  li.querySelector(".content").after(editRow);
  input.focus();
}

function saveEdit(id, newText){
  if (!newText) return;
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.text = newText;
  save(); render(); updateProgress();
}

function cancelEdit(li, row){
  row.remove();
  li.classList.remove("editing");
}

function removeTask(id){
  tasks = tasks.filter(t => t.id !== id);
  save(); render(); updateProgress();
}

/* ========= Rendering ========= */
function render(){
  els.pending.innerHTML = "";
  els.completed.innerHTML = "";

  // sort: pending first, then by created time
  tasks
    .slice()
    .sort((a,b)=> Number(a.completed)-Number(b.completed) || a.created-b.created)
    .forEach(t=>{
      const li = document.createElement("li");
      li.className = "task" + (t.completed ? " completed" : "");
      li.dataset.id = t.id;

      // text content
      const content = document.createElement("div");
      content.className = "content";
      const text = document.createElement("div");
      text.className = "text";
      text.textContent = t.text;
      content.appendChild(text);

      // buttons
      const actions = document.createElement("div");
      actions.className = "btns";

      if (!t.completed){
        actions.appendChild(btn("done","Done", () => toggleComplete(t.id)));
        actions.appendChild(btn("edit","Edit", () => startEdit(t.id)));
        actions.appendChild(btn("del","Delete", () => removeTask(t.id)));
      } else {
        actions.appendChild(btn("undo","Undo", () => toggleComplete(t.id)));
        actions.appendChild(btn("del","Delete", () => removeTask(t.id)));
      }

      li.appendChild(content);
      li.appendChild(actions);

      (t.completed ? els.completed : els.pending).appendChild(li);
    });
}

function btn(className, label, onClick){
  const b = document.createElement("button");
  b.className = `btn ${className}`;
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

/* ========= Progress ========= */
function updateProgress(){
  const total = tasks.length;
  const done = tasks.filter(t=>t.completed).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  els.progressBar.style.width = pct + "%";
  els.progressText.textContent = `${pct}% (${done}/${total})`;
}

/* ========= Storage ========= */
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch{ return []; }
}

/* ========= Confetti (canvas-confetti) ========= */
function burstConfettiAtElement(el){
  if (!window.confetti || !el) { // fallback center
    return confetti && confetti();
  }
  const rect = el.getBoundingClientRect();
  const origin = {
    x: (rect.left + rect.width * 0.85) / window.innerWidth,
    y: (rect.top + rect.height * 0.5) / window.innerHeight
  };

  // Two bursts for richness
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 45,
    gravity: 1.1,
    ticks: 200,
    scalar: 0.9,
    origin
  });
  confetti({
    particleCount: 70,
    spread: 120,
    startVelocity: 25,
    gravity: 0.7,
    decay: 0.9,
    scalar: 1.2,
    origin
  });

  // Streamer side-shot
  confetti({
    particleCount: 40,
    angle: 60,
    spread: 55,
    origin: { x: origin.x - 0.05, y: origin.y },
    scalar: 0.9
  });
  confetti({
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: origin.x + 0.05, y: origin.y },
    scalar: 0.9
  });
}




