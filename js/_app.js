function exportJSON(){
  const payload = {
    version: 1,
    rootId: state.rootId,
    selectedId: state.selectedId,
    view: state.view,
    nodes: state.nodes
  };
  dom.jsonBox.value = JSON.stringify(payload, null, 2);
  dom.jsonBox.focus();
  dom.jsonBox.select();
  toast("Exported");
}

function importJSON(){
  const txt = dom.jsonBox.value.trim();
  if(!txt){
    toast("Paste JSON first");
    return;
  }
  try{
    const obj = JSON.parse(txt);
    if(!obj || !obj.nodes || !obj.rootId) throw new Error("Invalid format");
    state = {
      nodes: obj.nodes,
      rootId: obj.rootId,
      selectedId: obj.selectedId || obj.rootId,
      view: obj.view || { x: 80, y: 80, scale: 1 }
    };
    saveLocal();
    render();
    toast("Imported");
  }catch(err){
    console.error(err);
    toast("Import failed (invalid JSON)");
  }
}

function resetAll(){
  if(!confirm("Delete all nodes?")) return;


  localStorage.removeItem(STORAGE_KEY);
  state = { nodes:{}, rootId:null, selectedId:null, view:{x:80,y:80,scale:1} };
  createInitial();
  autoLayout();
  centerView();
  saveLocal();
  render();
  toast("Reset");
}

function closePanel() {
    document.body.classList.remove("panel-open");
}

/***********************
 * Wire UI buttons
 ***********************/
// Desktop wiring
dom.btnAddChild.addEventListener("click", () => addChild(state.selectedId));
dom.btnAddSibling.addEventListener("click", () => addSibling(state.selectedId));
dom.btnEdit.addEventListener("click", editSelected);
dom.btnDelete.addEventListener("click", () => deleteNode(state.selectedId));
dom.btnAuto.addEventListener("click", autoLayout);
dom.btnCenter.addEventListener("click", centerView);
dom.btnReset.addEventListener("click", resetAll);

dom.btnSaveNode.addEventListener("click", saveSelectedFromPanel);
dom.btnClearManual.addEventListener("click", clearManualPos);

dom.btnExport.addEventListener("click", exportJSON);
dom.btnImport.addEventListener("click", importJSON);

dom.nodeTitle.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    saveSelectedFromPanel();
  }
});

// Mobile wiring (safe-guard: elements exist only on mobile UI)
if(dom.mAddChild) dom.mAddChild.addEventListener("click", () => addChild(state.selectedId));
if(dom.mAddSibling) dom.mAddSibling.addEventListener("click", () => addSibling(state.selectedId));
if(dom.mAuto) dom.mAuto.addEventListener("click", autoLayout);
if(dom.mCenter) dom.mCenter.addEventListener("click", centerView);
if(dom.mDelete) dom.mDelete.addEventListener("click", () => {
    deleteNode(state.selectedId);
    closePanel();
});

if(dom.mSave) dom.mSave.addEventListener("click", () => {
    saveSelectedFromPanel();
    closePanel();
});

if(dom.mPanel) dom.mPanel.addEventListener("click", () => {
  document.body.classList.toggle("panel-open");
});

// Mobile export/import uses mobile json box (but reuses same logic)
if(dom.mExport) dom.mExport.addEventListener("click", () => {
  const payload = { version: 1, rootId: state.rootId, selectedId: state.selectedId, view: state.view, nodes: state.nodes };
  dom.mJsonBox.value = JSON.stringify(payload, null, 2);
  toast("Exported");
});

if(dom.mImport) dom.mImport.addEventListener("click", () => {
  const txt = dom.mJsonBox.value.trim();
  if(!txt){ toast("Paste JSON first"); return; }
  try{
    const obj = JSON.parse(txt);
    if(!obj || !obj.nodes || !obj.rootId) throw new Error("Invalid format");
    state = {
      nodes: obj.nodes,
      rootId: obj.rootId,
      selectedId: obj.selectedId || obj.rootId,
      view: obj.view || { x: 80, y: 80, scale: 1 }
    };
    saveLocal();
    render();
    toast("Imported");
  }catch(err){
    console.error(err);
    toast("Import failed");
  }
});


window.addEventListener("resize", () => {
  // Keep current node visible after breakpoint changes
  centerView({ animate: true });
});

/***********************
 * Init
 ***********************/
if(!loadLocal()){
  createInitial();
  autoLayout();
  saveLocal();
}
render();
centerView();
