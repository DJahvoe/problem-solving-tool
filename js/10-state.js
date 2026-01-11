const STORAGE_KEY = "logic_tree_builder_v1";

// Node:
// { id, parentId, title, notes, children:[], x,y, manual:boolean }
let state = {
  nodes: {},
  rootId: null,
  selectedId: null,
  view: { x: 80, y: 80, scale: 1 }
};

function uid(){
  return Math.random().toString(36).slice(2,9) + "-" + Date.now().toString(36).slice(2,7);
}

function getNode(id){ return state.nodes[id] || null; }

function createInitial(){
  const id = uid();
  state.rootId = id;
  state.selectedId = id;
  state.nodes[id] = {
    id,
    parentId: null,
    title: "Root issue (edit me)",
    notes: "",
    color: "#121b3d",
    children: [],
    x: 200, y: 140,
    manual: false
  };
}

function saveLocal(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(_e){
    // ignore
  }
}

function loadLocal(){
  try{
    const txt = localStorage.getItem(STORAGE_KEY);
    if(!txt) return false;
    const obj = JSON.parse(txt);
    if(!obj || !obj.nodes || !obj.rootId) return false;
    state = obj;
    return true;
  }catch(_e){
    return false;
  }
}
