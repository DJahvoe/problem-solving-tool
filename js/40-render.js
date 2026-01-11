function applyView(){
  dom.world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
}

function drawLinks(){
  const NS = "http://www.w3.org/2000/svg";

  for(const id of Object.keys(state.nodes)){
    const n = getNode(id);
    if(!n) continue;
    for(const cid of n.children){
      const c = getNode(cid);
      if(!c) continue;

      const x1 = n.x + 220;
      const y1 = n.y + 40;
      const x2 = c.x;
      const y2 = c.y + 40;

      const path = document.createElementNS(NS, "path");
      const mid = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;

      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(122,162,255,.35)");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-linecap", "round");

      dom.links.appendChild(path);
    }
  }
}

function syncPanel(){
  const n = getNode(state.selectedId);
  if(!n){
    dom.nodeTitle.value = "";
    dom.nodeNotes.value = "";
    return;
  }
  dom.nodeTitle.value = n.title || "";
  dom.nodeNotes.value = n.notes || "";
}

function render(){
  dom.world.querySelectorAll(".node").forEach(el => el.remove());
  dom.links.innerHTML = "";

  for(const id of Object.keys(state.nodes)){
    const n = getNode(id);
    if(!n) continue;

    const el = document.createElement("div");
    el.className = "node" + (id === state.selectedId ? " selected" : "");
    el.style.left = n.x + "px";
    el.style.top = n.y + "px";
    el.dataset.id = id;

    const d = depthOf(id);

    el.innerHTML = `
      <div class="title">${escapeHtml(n.title || "(untitled)")}</div>
      <div class="meta">
        <span class="badge">d:${d}</span>
        <span class="badge">${n.manual ? "manual" : "auto"}</span>
      </div>
    `;

    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      selectNode(id);
      startNodeDrag(e, id);
    });

    dom.world.appendChild(el);
  }

  drawLinks();

  dom.statNodes.textContent = Object.keys(state.nodes).length.toString();
  dom.statDepth.textContent = computeTreeDepth().toString();

  syncPanel();
  applyView();
}
