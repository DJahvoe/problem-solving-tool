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
    color: parent.color || "#121b3d",   // ✅ inherit parent color (or default)
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
  if(!confirm("Delete Node?")) return;

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
  let oldTitleEl = n.title;
  let oldNotesEl = n.notes;
  console.log(n);
  if(!n) return;

  // Desktop vs Mobile inputs (use whichever exists)
  let titleEl = null;
  if(oldTitleEl !== dom.mNodeTitle) titleEl = dom.mNodeTitle;
  if(oldTitleEl !== dom.nodeTitle) titleEl = dom.nodeTitle;

  let notesEl = null;
  if(oldNotesEl !== dom.mNodeNotes) notesEl = dom.mNodeNotes;
  if(oldNotesEl !== dom.nodeNotes) notesEl = dom.nodeNotes;

  // Color inputs
  const colorEl = dom.mNodeColor || dom.nodeColor;

  n.title = titleEl?.value?.trim() || "Untitled";
  if(notesEl) n.notes = notesEl.value;

  if(colorEl && typeof colorEl.value === "string" && colorEl.value.trim()){
    n.color = colorEl.value.trim();
  } else if(!n.color){
    n.color = "#121b3d";
  }

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

function centerView({ animate = false } = {}){
  const n = getNode(state.selectedId || state.rootId);
  if(!n) return;

  const viewportW = dom.canvas.clientWidth;
  const viewportH = dom.canvas.clientHeight;

  // Scale target depends on device layout
  const newScale = getTargetCenterScale();

  // If mobile bottom bar exists, it covers content.
  // Add a small upward offset so the node isn't hidden behind the bar/panel.
  const mobileYOffsetPx = isMobileLayout() ? 70 : 0; // tweak if your bar height changes

  // Node center (approx)
  const nodeCenterX = n.x + 110;
  const nodeCenterY = n.y + 40;

  // Compute translation to place node at center (with mobile y offset)
  const targetX = (viewportW / 2) - (nodeCenterX * newScale);
  const targetY = (viewportH / 2 - mobileYOffsetPx) - (nodeCenterY * newScale);

  state.view.scale = newScale;
  state.view.x = targetX;
  state.view.y = targetY;

  // Optional small animation (no dependencies)
  if(animate){
    dom.world.style.transition = "transform 120ms ease";
    applyView();
    setTimeout(() => { dom.world.style.transition = ""; }, 140);
  } else {
    applyView();
  }

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

// ===============================
// Touch Pan + Pinch Zoom (Mobile)
// ===============================
let pinch = null;

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function distance(a,b){
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

function midpoint(a,b){
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function zoomAtClientPoint(newScale, clientX, clientY){
  const oldScale = state.view.scale;
  const scale = clamp(newScale, 0.35, 2.2);
  if(scale === oldScale) return;

  const rect = dom.canvas.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;

  // world coords under finger BEFORE zoom
  const wx = (mx - state.view.x) / oldScale;
  const wy = (my - state.view.y) / oldScale;

  state.view.scale = scale;
  state.view.x = mx - wx * scale;
  state.view.y = my - wy * scale;

  applyView();
}

dom.canvas.addEventListener("touchstart", (e) => {
  // Must be non-passive to prevent browser zoom/scroll
  e.preventDefault();

  // 2 fingers => start pinch
  if(e.touches.length === 2){
    // cancel pan/nodeDrag if running
    pan = null;
    if(nodeDrag) onNodeDragEnd();

    const a = e.touches[0];
    const b = e.touches[1];
    pinch = {
      startDist: distance(a,b),
      startScale: state.view.scale,
    };
    return;
  }

  // 1 finger
  if(e.touches.length === 1){
    const t = e.touches[0];
    const onNode = e.target.closest && e.target.closest(".node");

    // Drag node if touch starts on node
    if(onNode){
      const id = onNode.dataset.id;
      if(id){
        selectNode(id);
        startNodeDrag({ clientX: t.clientX, clientY: t.clientY, stopPropagation: ()=>{} }, id);
      }
      return;
    }

    // Otherwise pan background
    pan = { startX: t.clientX, startY: t.clientY, origX: state.view.x, origY: state.view.y };
    dom.canvas.classList.add("grabbing");
  }
}, { passive:false });

dom.canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  // Pinch zoom
  if(e.touches.length === 2 && pinch){
    const a = e.touches[0];
    const b = e.touches[1];

    const d = distance(a,b);
    const ratio = d / pinch.startDist;
    const targetScale = pinch.startScale * ratio;

    const mid = midpoint(a,b);
    zoomAtClientPoint(targetScale, mid.x, mid.y);

    return;
  }

  // Drag node
  if(e.touches.length === 1 && nodeDrag){
    const t = e.touches[0];
    onNodeDragMove({ clientX: t.clientX, clientY: t.clientY });
    return;
  }

  // Pan
  if(e.touches.length === 1 && pan){
    const t = e.touches[0];
    const dx = t.clientX - pan.startX;
    const dy = t.clientY - pan.startY;
    state.view.x = pan.origX + dx;
    state.view.y = pan.origY + dy;
    applyView();
    return;
  }
}, { passive:false });

dom.canvas.addEventListener("touchend", (_e) => {
  if(pinch){
    pinch = null;
    saveLocal();
  }
  if(nodeDrag) onNodeDragEnd();
  if(pan){
    dom.canvas.classList.remove("grabbing");
    pan = null;
    saveLocal();
  }
}, { passive:false });
