
let DRUGS=[], IMG={};
const STATE={days:'',filter:'ทั้งหมด',selected:{}};
const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>Array.from(el.querySelectorAll(q));
const ceil=(n,d)=>Math.ceil(n/d);

function ceilBox(days,ppd,pb){ if(!days||!ppd) return 0; return Math.ceil((Number(days)*Number(ppd))/Number(pb)); }

async function boot(){
  DRUGS = await fetch('drugs.json').then(r=>r.json());
  IMG   = await fetch('drug_image_map.json').then(r=>r.json());
  bindTop(); buildTabs(); renderCards(); renderSummary();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js'); }
}
function bindTop(){
  $('#days').addEventListener('input',e=>{ STATE.days=e.target.value; computeAll(); });
  $$('#days-quick .chip').forEach(b=> b.addEventListener('click',()=>{ STATE.days=b.dataset.days; $('#days').value=STATE.days; computeAll(); }));
  $('#clear').addEventListener('click',()=>{ STATE.days=''; $('#days').value=''; STATE.selected={}; computeAll(true); });
  $('#printSummary').addEventListener('click',()=>window.print());
}
function buildTabs(){
  const groups=['ทั้งหมด','SABA','SAMA','LABA','LAMA','ICS','Nasal','ICS+LABA','SAMA+SABA'];
  const tabs=$('#tabs'); tabs.innerHTML='';
  groups.forEach(g=>{ const b=document.createElement('button'); b.className='tab'+(g===STATE.filter?' active':''); b.textContent=g;
    b.addEventListener('click',()=>{ STATE.filter=g; buildTabs(); renderCards(); }); tabs.appendChild(b); });
}
function filtered(){ if(STATE.filter==='ทั้งหมด') return DRUGS; return DRUGS.filter(d=>d.tags.includes(STATE.filter)); }
function renderCards(){
  const host=$('#grid'); host.innerHTML='';
  filtered().forEach(d=>{
    const sel=!!STATE.selected[d.id]; const ppd= sel ? (STATE.selected[d.id].ppd||'') : '';
    const card=document.createElement('div'); card.className='card'+(sel?' selected':''); card.dataset.id=d.id;
    card.innerHTML=`
      <div class="bar" style="background:${d.color}"></div>
      <div class="body">
        <div class="badge">จ่าย 0 กล่อง</div>
        <h3>${d.name}</h3>
        <div class="meta">${d.tags.join(' · ')} · ${d.puffsPerBox} puff/กล่อง</div>
        <div class="controls-mini">
          <label><input type="checkbox" class="pick" ${sel?'checked':''}/> เลือก</label>
          <input type="number" class="ppd" min="0" max="6" placeholder="พ่น/วัน (1–6)" value="${ppd}">
        </div>
        <div class="quick">
          ${[1,2,3,4,5,6].map(n=>`<button class="pill" type="button" data-n="${n}">${n}</button>`).join('')}
        </div>
        <div class="imgwrap">
          <img src="${IMG[d.id]||''}" alt="${d.name}" loading="lazy" onerror="this.src='${d.image}'">
        </div>
      </div>`;
    // events
    card.querySelectorAll('.pill').forEach(btn=> btn.addEventListener('click',()=>{
      const n=Number(btn.dataset.n); if(!STATE.selected[d.id]) STATE.selected[d.id]={ppd:n}; else STATE.selected[d.id].ppd=n;
      card.querySelector('.ppd').value=n; updateCard(card);
    }));
    card.querySelector('.ppd').addEventListener('input',e=>{ const n=Number(e.target.value||0);
      if(n<=0){ if(STATE.selected[d.id]) STATE.selected[d.id].ppd=0; } else { if(!STATE.selected[d.id]) STATE.selected[d.id]={ppd:n}; else STATE.selected[d.id].ppd=n; }
      updateCard(card);
    });
    card.querySelector('.pick').addEventListener('change',e=>{ if(e.target.checked){ if(!STATE.selected[d.id]) STATE.selected[d.id]={ppd:Number(card.querySelector('.ppd').value||0)}; } else { delete STATE.selected[d.id]; }
      updateCard(card,true);
    });
    host.appendChild(card); updateCard(card);
  });
}
function updateCard(card, rerenderSummary=false){
  const id=card.dataset.id; const d=DRUGS.find(x=>x.id===id); const picked=!!STATE.selected[id]; const ppd=STATE.selected[id]?.ppd||0;
  const days=Number(STATE.days||0); const boxes=picked?ceilBox(days,ppd,d.puffsPerBox):0;
  card.classList.toggle('selected', picked);
  const badge=card.querySelector('.badge'); badge.textContent=`จ่าย ${boxes} กล่อง`; badge.style.display=picked?'inline-block':'none';
  if(rerenderSummary) renderSummary();
}
function computeAll(clear=false){ if(clear){ renderCards(); renderSummary(); return; } $$('.card').forEach(c=>updateCard(c)); renderSummary(); }
function renderSummary(){
  const tb=$('#sum-body'); tb.innerHTML=''; let total=0;
  for(const id in STATE.selected){ const d=DRUGS.find(x=>x.id===id); const ppd=STATE.selected[id].ppd||0; const days=Number(STATE.days||0); const boxes=ceilBox(days,ppd,d.puffsPerBox); total+=boxes;
    const tr=document.createElement('tr'); tr.innerHTML=`<td>${d.name}</td><td>${ppd||'-'}</td><td>${days||'-'}</td><td>${d.puffsPerBox}</td><td><b>${boxes}</b></td>`; tb.appendChild(tr);
  }
  $('#sum-total').textContent=total;
}
window.addEventListener('load', boot);
