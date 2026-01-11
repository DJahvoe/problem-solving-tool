// Centralized DOM references (so other files can use `dom.*`)
const dom = {
  world: document.getElementById("world"),
  links: document.getElementById("links"),
  canvas: document.getElementById("canvas"),
  nodeTitle: document.getElementById("nodeTitle"),
  nodeNotes: document.getElementById("nodeNotes"),
  jsonBox: document.getElementById("jsonBox"),
  toast: document.getElementById("toast"),
  statNodes: document.getElementById("statNodes"),
  statDepth: document.getElementById("statDepth"),

  btnAddChild: document.getElementById("btnAddChild"),
  btnAddSibling: document.getElementById("btnAddSibling"),
  btnEdit: document.getElementById("btnEdit"),
  btnDelete: document.getElementById("btnDelete"),
  btnAuto: document.getElementById("btnAuto"),
  btnCenter: document.getElementById("btnCenter"),
  btnReset: document.getElementById("btnReset"),
  btnSaveNode: document.getElementById("btnSaveNode"),
  btnClearManual: document.getElementById("btnClearManual"),
  btnExport: document.getElementById("btnExport"),
  btnImport: document.getElementById("btnImport"),
};
