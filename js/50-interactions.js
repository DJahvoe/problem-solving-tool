/***********************
 * Core actions
 ***********************/
function selectNode(id){
  if(!getNode(id)) return;
  state.selectedId = id;
  saveLocal();
  render();
}

function addChild(parentId){
  const parent = getNode(parentId);
  if(!parent) return;

  const id = uid();
  const n = {
    id,
    parentId,
    title: "New node",
    notes: "",
    children: [],
    x: parent.x + 300,
    y: parent.y + (parent.children.length * 120),
    manual: false
  };

  state.nodes[id] = n;
  parent.children.push(id);
  selectNode(id);

  autoLayout();
  toast("Child added");
  saveLocal();
  render();
}

function addSibling(nodeId){
  const node = getNode(nodeId);
  if(!node) return;
  if(!node.parentId){
    toast("Root cannot have siblings");
    return;
  }
  addChild(node.parentId);
  toast("Sibling added");
}

function deleteNode(nodeId){
  const node = getNode(nodeId);
  if(!node) return;
  if(nodeId === state.rootId){
    toast("Cannot delete root");
    return;
  }

  const parent = getNode(node.parentId);
  if(parent){
    parent.children = parent.children.filter(cid => cid !== nodeId);
  }

  const stack = [nodeId];
  while(stack.length){
    const id = stack.pop();
    const cur = getNode(id);
    if(!cur) continue;
    stack.push(...cur.children);
    delete state.nodes[id];
  }

  selectNode(node.parentId || state.rootId);
  toast("Node deleted");
  saveLocal();
  render();
}

function editSelected(){
  const n = getNode(state.selectedId);
  if(!n) return;
  const text = prompt("Edit node title:", n.title || "");
  if(text === null) return;
  n.title = text.trim() || "Untitled";
  saveLocal();
  render();
  toast("Edited");
}

function saveSelectedFromPanel(){
  const n = getNode(state.selectedId);
  if(!n) return;

  // If mobile inputs exist, use them (mobile-only UI)
  const titleEl = dom.mNodeTitle || dom.nodeTitle;
  const notesEl = dom.mNodeNotes || dom.nodeNotes;

  n.title = titleEl.value.trim() || "Untitled";
  n.notes = notesEl.value;

  saveLocal();
  render();
  toast("Saved");
}

function clearManualPos(){
  const n = getNode(state.selectedId);
  if(!n) return;
  n.manual = false;
  autoLayout();
  toast("Manual cleared");
}

function centerView(){
  const n = getNode(state.selectedId || state.rootId);
  if(!n) return;
  const viewportW = dom.canvas.clientWidth;
  const viewportH = dom.canvas.clientHeight;
  const targetX = viewportW/2 - (n.x + 110) * state.view.scale;
  const targetY = viewportH/2 - (n.y + 40) * state.view.scale;
  state.view.x = targetX;
  state.view.y = targetY;
  applyView();
  saveLocal();
  toast("Centered");
}

/***********************
 * Dragging nodes
 ***********************/
let nodeDrag = null;

function startNodeDrag(e, id){
  const n = getNode(id);
  if(!n) return;

  const start = screenToWorld(e.clientX, e.clientY);
  nodeDrag = {
    id,
    startX: start.x,
    startY: start.y,
    origX: n.x,
    origY: n.y,
    moved: false
  };

  window.addEventListener("mousemove", onNodeDragMove);
  window.addEventListener("mouseup", onNodeDragEnd, { once: true });
}

function onNodeDragMove(e){
  if(!nodeDrag) return;
  const n = getNode(nodeDrag.id);
  if(!n) return;

  const cur = screenToWorld(e.clientX, e.clientY);
  const dx = cur.x - nodeDrag.startX;
  const dy = cur.y - nodeDrag.startY;

  if(Math.abs(dx) + Math.abs(dy) > 2) nodeDrag.moved = true;

  n.x = nodeDrag.origX + dx;
  n.y = nodeDrag.origY + dy;
  n.manual = true;
  render();
}

function onNodeDragEnd(){
  if(nodeDrag?.moved) saveLocal();
  window.removeEventListener("mousemove", onNodeDragMove);
  nodeDrag = null;
}

/***********************
 * Canvas pan/zoom
 ***********************/
let pan = null;

dom.canvas.addEventListener("mousedown", (e) => {
  if(e.button !== 0) return;
  if(e.target.closest(".node")) return;

  pan = { startX: e.clientX, startY: e.clientY, origX: state.view.x, origY: state.view.y };
  dom.canvas.classList.add("grabbing");
  window.addEventListener("mousemove", onPanMove);
  window.addEventListener("mouseup", onPanEnd, { once: true });
});

function onPanMove(e){
  if(!pan) return;
  const dx = e.clientX - pan.startX;
  const dy = e.clientY - pan.startY;
  state.view.x = pan.origX + dx;
  state.view.y = pan.origY + dy;
  applyView();
}

function onPanEnd(){
  dom.canvas.classList.remove("grabbing");
  window.removeEventListener("mousemove", onPanMove);
  pan = null;
  saveLocal();
}

dom.canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = -Math.sign(e.deltaY) * 0.08;

  const oldScale = state.view.scale;
  const newScale = clamp(oldScale * (1 + delta), 0.35, 2.2);

  const rect = dom.canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const wx = (mx - state.view.x) / oldScale;
  const wy = (my - state.view.y) / oldScale;

  state.view.scale = newScale;
  state.view.x = mx - wx * newScale;
  state.view.y = my - wy * newScale;

  applyView();
  saveLocal();
}, { passive:false });

function screenToWorld(clientX, clientY){
  const rect = dom.canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  return {
    x: (sx - state.view.x) / state.view.scale,
    y: (sy - state.view.y) / state.view.scale
  };
}

/***********************
 * Keyboard shortcuts
 ***********************/
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  const typing = tag === "input" || tag === "textarea";
  if(typing) return;

  if(e.key === "Enter"){
    e.preventDefault();
    addChild(state.selectedId);
  } else if(e.key === "Tab"){
    e.preventDefault();
    addSibling(state.selectedId);
  } else if(e.key.toLowerCase() === "e"){
    e.preventDefault();
    editSelected();
  } else if(e.key === "Delete" || e.key === "Backspace"){
    e.preventDefault();
    deleteNode(state.selectedId);
  }
});

// Mobile: toggle panel bottom sheet
if (dom.btnPanel) {
  dom.btnPanel.addEventListener("click", () => {
    document.body.classList.toggle("panel-open");
  });
}

// --- Touch support (mobile) ---
// One-finger: pan (background), drag (node)
dom.canvas.addEventListener("touchstart", (e) => {
  if(e.touches.length !== 1) return;
  const t = e.touches[0];
  const onNode = e.target.closest && e.target.closest(".node");

  if(onNode){
    // Let node mousedown logic handle selection; start drag manually:
    const id = onNode.dataset.id;
    if(id){
      e.preventDefault();
      selectNode(id);
      startNodeDrag({ clientX: t.clientX, clientY: t.clientY, stopPropagation: ()=>{} }, id);
    }
    return;
  }

  // Pan background
  pan = { startX: t.clientX, startY: t.clientY, origX: state.view.x, origY: state.view.y };
  dom.canvas.classList.add("grabbing");
}, { passive:false });

dom.canvas.addEventListener("touchmove", (e) => {
  if(e.touches.length !== 1) return;
  const t = e.touches[0];

  // Node drag
  if(nodeDrag){
    e.preventDefault();
    onNodeDragMove({ clientX: t.clientX, clientY: t.clientY });
    return;
  }

  // Pan
  if(!pan) return;
  e.preventDefault();
  onPanMove({ clientX: t.clientX, clientY: t.clientY });
}, { passive:false });

dom.canvas.addEventListener("touchend", (_e) => {
  if(nodeDrag) onNodeDragEnd();
  if(pan) onPanEnd();
});
