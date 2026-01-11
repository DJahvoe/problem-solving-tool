function depthOf(id){
  let d = 0;
  let cur = getNode(id);
  while(cur && cur.parentId){
    d++;
    cur = getNode(cur.parentId);
  }
  return d;
}

function computeTreeDepth(){
  if(!state.rootId) return 0;
  let maxD = 0;
  const stack = [{ id: state.rootId, d: 0 }];
  while(stack.length){
    const {id, d} = stack.pop();
    maxD = Math.max(maxD, d);
    const n = getNode(id);
    if(n) for(const c of n.children) stack.push({ id: c, d: d+1 });
  }
  return maxD;
}

/**
 * Simple tidy tree: compute y by leaf ordering, x by depth.
 * Reset manual nodes; layouts all nodes.
 */
function autoLayout(){
  if(!state.rootId) return;
  const levelGap = 280;
  const rowGap = 120;

  let leafIndex = 0;
  const yMap = new Map();

  function dfsY(id){
    const n = getNode(id);
    if(!n) return 0;
    if(n.children.length === 0){
      const y = leafIndex * rowGap;
      leafIndex++;
      yMap.set(id, y);
      return y;
    }
    const ys = n.children.map(dfsY);
    const y = (Math.min(...ys) + Math.max(...ys)) / 2;
    yMap.set(id, y);
    return y;
  }

  dfsY(state.rootId);

  const ys = Array.from(yMap.values());
  const minY = Math.min(...ys, 0);

  for(const id of Object.keys(state.nodes)){
    const n = getNode(id);
    if(!n) continue;
    const d = depthOf(id);
    n.x = 160 + d * levelGap;
    n.y = 120 + (yMap.get(id) - minY);
    n.manual = false;
  }

  saveLocal();
  render();
  toast("Auto layout");
}
