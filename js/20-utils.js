function toast(msg){
  dom.toast.textContent = msg;
  dom.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => dom.toast.classList.remove("show"), 1400);
}

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function escapeHtml(str){
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
