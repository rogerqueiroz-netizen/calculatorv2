import { segmentation, pricing, variableCosts, fixedCosts, marginTiers } from "./config.js";

function toNumber(v){ const n=parseFloat(v); return isNaN(n)?0:n; }
function fmtCurrency(n){ if(!isFinite(n))return "$0.00"; return "$"+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
function fmtPercent(dec){ if(!isFinite(dec))return "0.0%"; return (dec*100).toFixed(1)+"%"; }

function populateSelect(id,map,empty=true){
  const sel=document.getElementById(id); if(!sel)return;
  sel.innerHTML="";
  if(empty){
    const o=document.createElement("option");
    o.value=""; o.textContent="Select SKU";
    sel.appendChild(o);
  }
  Object.keys(map).forEach(k=>{
    const o=document.createElement("option");
    o.value=k; o.textContent=k;
    sel.appendChild(o);
  });
}

function initSelectors(){
  document.getElementById("licensePriceDisplay").value = fmtCurrency(pricing.license["Enterprise License"]);
  ["ajSku1","ajSku2"].forEach(id=>populateSelect(id,pricing.automationJobs));
  ["apiSku1","apiSku2"].forEach(id=>populateSelect(id,pricing.apiCalls));
  ["ciSku1","ciSku2"].forEach(id=>populateSelect(id,pricing.customIntegrations));
  ["aiSku1","aiSku2"].forEach(id=>populateSelect(id,pricing.aiCredits));
  populateSelect("psSku1",pricing.pipesign);
}

function getAdoptionGroup(cards){
  if(cards<=0)return null;
  return segmentation.groups.find(g=>cards>=g.min && cards<=g.max) || null;
}

function updateRecommendations(){
  const cards=toNumber(document.getElementById("cardsPerMonth").value);
  const sophistication=document.getElementById("sophistication").value;
  const group=getAdoptionGroup(cards);
  const ajHint=document.getElementById("ajSuggestionHint");
  const intHint=document.getElementById("intSuggestionHint");
  if(!group){
    ajHint.textContent="Suggested: -";
    intHint.textContent="Suggested: -";
    return;
  }
  const rec=segmentation.suggestions[group.id][sophistication];
  ajHint.textContent=`Suggested: ${rec.aj} AJs/card`;
  intHint.textContent=`Suggested: ${rec.integrations} integrations/card`;
}

function updateIntegrationsPerCard(){
  const apis=toNumber(document.getElementById("apisPerCard").value);
  const cis=toNumber(document.getElementById("cisPerCard").value);
  const total=apis+cis;
  document.getElementById("integrationsPerCard").value = total ? total.toFixed(2) : "";
}

function updateLicensePriceDisplay(){
  const type=document.getElementById("licenseType").value;
  const price=pricing.license[type]||0;
  document.getElementById("licensePriceDisplay").value=fmtCurrency(price);
}

function collectAddonLine(cfg){
  const sku=document.getElementById(cfg.skuId).value;
  const qty=toNumber(document.getElementById(cfg.qtyId).value);
  const disc=toNumber(document.getElementById(cfg.discId).value);
  if(!sku || qty<=0)return null;
  const def=cfg.table[sku]; if(!def)return null;
  const discountPct=Math.min(Math.max(disc,0),100);
  return{
    type:cfg.type,
    sku,
    packs:qty,
    unitsPerPack:def.units,
    totalUnits:def.units*qty,
    listPricePerPack:def.price,
    discountPct,
    netPricePerPack:def.price*(1-discountPct/100),
    listMrr:def.price*qty,
    netMrr:def.price*qty*(1-discountPct/100),
  };
}

function getRequiredMargin(netMrr){
  for(const tier of marginTiers){
    if(netMrr < tier.maxMrr) return tier.requiredMargin;
  }
  return 0.75;
}

function calculateDeal(){
  const cards=toNumber(document.getElementById("cardsPerMonth").value);
  const sophistication=document.getElementById("sophistication").value;
  const ajPerCard=toNumber(document.getElementById("ajPerCard").value);
  const apisPerCard=toNumber(document.getElementById("apisPerCard").value);
  const cisPerCard=toNumber(document.getElementById("cisPerCard").value);
  const aiPerCard=toNumber(document.getElementById("aiPerCard").value);
  const pipesignPerCard=toNumber(document.getElementById("pipesignPerCard").value);
  const paidUsers=toNumber(document.getElementById("paidUsers").value);
  const licenseType=document.getElementById("licenseType").value;
  const licenseDiscPct=Math.min(Math.max(toNumber(document.getElementById("licenseDiscount").value),0),100);

  const group=getAdoptionGroup(cards);
  const rec=group?segmentation.suggestions[group.id][sophistication]:null;

  const licensePrice=pricing.license[licenseType]||0;
  const licenseListMrr=licensePrice*paidUsers;
  const licenseNetMrr=licenseListMrr*(1-licenseDiscPct/100);

  const addonLines=[];
  [
    {skuId:"ajSku1",qtyId:"ajQty1",discId:"ajDisc1",table:pricing.automationJobs,type:"Automation Jobs"},
    {skuId:"ajSku2",qtyId:"ajQty2",discId:"ajDisc2",table:pricing.automationJobs,type:"Automation Jobs"},
    {skuId:"apiSku1",qtyId:"apiQty1",discId:"apiDisc1",table:pricing.apiCalls,type:"API Calls"},
    {skuId:"apiSku2",qtyId:"apiQty2",discId:"apiDisc2",table:pricing.apiCalls,type:"API Calls"},
    {skuId:"ciSku1",qtyId:"ciQty1",discId:"ciDisc1",table:pricing.customIntegrations,type:"Custom Integrations"},
    {skuId:"ciSku2",qtyId:"ciQty2",discId:"ciDisc2",table:pricing.customIntegrations,type:"Custom Integrations"},
    {skuId:"aiSku1",qtyId:"aiQty1",discId:"aiDisc1",table:pricing.aiCredits,type:"AI Credits"},
    {skuId:"aiSku2",qtyId:"aiQty2",discId:"aiDisc2",table:pricing.aiCredits,type:"AI Credits"},
    {skuId:"psSku1",qtyId:"psQty1",discId:"psDisc1",table:pricing.pipesign,type:"Pipesign"},
  ].forEach(cfg=>{
    const line=collectAddonLine(cfg);
    if(line) addonLines.push(line);
  });

  // unidades usadas para custo (plano + add-ons)
  const units={
    automationJobs: licenseType.startsWith("Enterprise License") ? pricing.included.automationJobs : 0,
    apiCalls:       licenseType.startsWith("Enterprise License") ? pricing.included.apiCalls       : 0,
    customIntegrations:0,
    aiCredits:0,
    pipesign:0
  };

  let addonsListMrr=0, addonsNetMrr=0;
  addonLines.forEach(l=>{
    addonsListMrr+=l.listMrr;
    addonsNetMrr+=l.netMrr;
    if(l.type==="Automation Jobs") units.automationJobs+=l.totalUnits;
    else if(l.type==="API Calls") units.apiCalls+=l.totalUnits;
    else if(l.type==="Custom Integrations") units.customIntegrations+=l.totalUnits;
    else if(l.type==="AI Credits") units.aiCredits+=l.totalUnits;
    else if(l.type==="Pipesign") units.pipesign+=l.totalUnits;
  });

  const listMrr=licenseListMrr+addonsListMrr;
  const netMrr=licenseNetMrr+addonsNetMrr;

  const variableCost =
    units.automationJobs*variableCosts.automationJobs +
    units.apiCalls*variableCosts.apiCalls +
    units.customIntegrations*variableCosts.customIntegrations +
    units.aiCredits*variableCosts.aiCredits +
    units.pipesign*variableCosts.pipesign;

  const totalCost = variableCost + fixedCosts.csm + fixedCosts.support;
  const margin = netMrr>0 ? (netMrr-totalCost)/netMrr : 0;

  const requiredMargin=getRequiredMargin(netMrr);
  const marginAtList = listMrr>0 ? (listMrr-totalCost)/listMrr : 0;
  const maxDiscount = Math.max(0, marginAtList-requiredMargin);
  const actualDiscount = listMrr>0 ? (1-(netMrr/listMrr)) : 0;
  const extraRoom = maxDiscount-actualDiscount;
  const preApproved = actualDiscount<=maxDiscount+1e-6 && margin>=requiredMargin;

  // Financials
  document.getElementById("netMrrDisplay").textContent=fmtCurrency(netMrr);
  document.getElementById("listMrrDisplay").textContent=
    `List MRR: ${fmtCurrency(listMrr)} • Discount: ${fmtPercent(actualDiscount)}`;
  document.getElementById("marginDisplay").textContent=fmtPercent(margin);
  document.getElementById("requiredMarginDisplay").textContent=fmtPercent(requiredMargin);
  document.getElementById("maxDiscountDisplay").textContent=fmtPercent(maxDiscount);
  document.getElementById("extraRoomDisplay").textContent=`Extra room: ${fmtPercent(Math.max(extraRoom,0))} (p.p.)`;

  const statusChip=document.getElementById("statusChip");
  const statusText=document.getElementById("statusText");
  statusChip.classList.remove("ok","warn");

  if(netMrr<=0){
    statusChip.classList.add("warn");
    statusText.textContent="No MRR yet. Add license and add-ons.";
  }else if(!preApproved){
    statusChip.classList.add("warn");
    if(margin<requiredMargin){
      statusText.textContent=`Requires approval: margin ${fmtPercent(margin)} is below required ${fmtPercent(requiredMargin)}.`;
    }else if(actualDiscount>maxDiscount){
      statusText.textContent=`Requires approval: discount ${fmtPercent(actualDiscount)} exceeds pre-approved ${fmtPercent(maxDiscount)}.`;
    }else{
      statusText.textContent="Requires approval (check configuration).";
    }
  }else{
    statusChip.classList.add("ok");
    if(extraRoom>0.0005){
      statusText.textContent=`Pre-approved. You still have ~${fmtPercent(extraRoom)} discount room.`;
    }else{
      statusText.textContent="Pre-approved. You are close to the margin limit.";
    }
  }

  // Usage vs recommendations
  const groupLabelAj=document.getElementById("ajGroupLabel");
  const groupLabelInt=document.getElementById("intGroupLabel");
  if(group){ groupLabelAj.textContent=group.name; groupLabelInt.textContent=group.name; }
  else{ groupLabelAj.textContent="Group —"; groupLabelInt.textContent="Group —"; }

  const recVal=rec||{aj:0,integrations:0};
  document.getElementById("ajSuggested").textContent=recVal.aj?recVal.aj.toString():"-";
  document.getElementById("intSuggested").textContent=recVal.integrations?recVal.integrations.toString():"-";

  const ajCoveredPerCard=cards>0? units.automationJobs/cards : 0;
  const intCoveredPerCard=cards>0? (units.apiCalls+units.customIntegrations)/cards : 0;
  document.getElementById("ajCovered").textContent=ajCoveredPerCard?ajCoveredPerCard.toFixed(2):"-";
  document.getElementById("intCovered").textContent=intCoveredPerCard?intCoveredPerCard.toFixed(2):"-";

  function delta(id,covered,suggested){
    const el=document.getElementById(id);
    if(!suggested||!covered||!cards){ el.textContent="-"; el.className="value"; return; }
    const d=covered-suggested;
    let cls="delta-positive";
    let label=d>=0?`+${d.toFixed(2)} vs suggested`:`${d.toFixed(2)} vs suggested`;
    if(d<0)cls="delta-negative";
    el.textContent=label;
    el.className="value "+cls;
  }
  delta("ajDelta",ajCoveredPerCard,recVal.aj);
  delta("intDelta",intCoveredPerCard,recVal.integrations);

  // Plan coverage vs usage estimate
  const planIncluded = {
    automationJobs: licenseType.startsWith("Enterprise License") ? pricing.included.automationJobs : 0,
    apiCalls:       licenseType.startsWith("Enterprise License") ? pricing.included.apiCalls       : 0,
    customIntegrations: 0,
    aiCredits: 0,
    pipesign: 0
  };

  const requiredUsage = {
    automationJobs: cards * ajPerCard,
    apiCalls: cards * apisPerCard,
    customIntegrations: cards * cisPerCard,
    aiCredits: cards * aiPerCard,
    pipesign: cards * pipesignPerCard
  };

  const coverageRows = [
    { product:"Automation Jobs", included: planIncluded.automationJobs, usage: requiredUsage.automationJobs },
    { product:"API Calls",       included: planIncluded.apiCalls,       usage: requiredUsage.apiCalls },
    { product:"Custom Integrations", included: planIncluded.customIntegrations, usage: requiredUsage.customIntegrations },
    { product:"AI Credits",      included: planIncluded.aiCredits,      usage: requiredUsage.aiCredits },
    { product:"Pipesign",        included: planIncluded.pipesign,       usage: requiredUsage.pipesign }
  ];

  const covBody=document.querySelector("#coverageTable tbody");
  covBody.innerHTML="";
  if(cards<=0){
    const tr=document.createElement("tr");
    const td=document.createElement("td");
    td.colSpan=4; td.style.textAlign="center"; td.style.color="#9ca3af"; td.style.padding="6px 0";
    td.textContent="No usage data yet.";
    tr.appendChild(td); covBody.appendChild(tr);
  }else{
    coverageRows.forEach(r=>{
      const need=Math.max(0, r.usage - r.included);
      const tr=document.createElement("tr");
      const cells=[
        r.product,
        r.included.toLocaleString("en-US"),
        r.usage.toLocaleString("en-US"),
        need.toLocaleString("en-US")
      ];
      cells.forEach(v=>{
        const td=document.createElement("td"); td.textContent=v; tr.appendChild(td);
      });
      covBody.appendChild(tr);
    });
  }

  // Itens do deal (license + add-ons)
  const tbody=document.querySelector("#addonsTable tbody");
  tbody.innerHTML="";
  const itemRows=[];

  if(paidUsers>0){
    itemRows.push({
      type:"License",
      sku:licenseType,
      packs:paidUsers,
      units:paidUsers,
      listMrr:licenseListMrr,
      netMrr:licenseNetMrr
    });
  }
  addonLines.forEach(l=>{
    itemRows.push({
      type:l.type,
      sku:l.sku,
      packs:l.packs,
      units:l.totalUnits,
      listMrr:l.listMrr,
      netMrr:l.netMrr
    });
  });

  if(itemRows.length===0){
    const tr=document.createElement("tr");
    const td=document.createElement("td");
    td.colSpan=6; td.style.textAlign="center"; td.style.padding="6px 0"; td.style.color="#9ca3af";
    td.textContent="No items yet.";
    tr.appendChild(td); tbody.appendChild(tr);
  }else{
    itemRows.forEach(r=>{
      const tr=document.createElement("tr");
      [
        r.type,
        r.sku,
        r.packs.toString(),
        r.units.toLocaleString("en-US"),
        fmtCurrency(r.listMrr),
        fmtCurrency(r.netMrr)
      ].forEach(v=>{
        const td=document.createElement("td"); td.textContent=v; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
}

// init
document.addEventListener("DOMContentLoaded", () => {
  initSelectors();
  updateRecommendations();
  updateIntegrationsPerCard();

  document.getElementById("cardsPerMonth").addEventListener("input",()=>{updateRecommendations();calculateDeal();});
  document.getElementById("sophistication").addEventListener("change",()=>{updateRecommendations();calculateDeal();});

  ["apisPerCard","cisPerCard"].forEach(id=>{
    document.getElementById(id).addEventListener("input",()=>{updateIntegrationsPerCard();calculateDeal();});
  });

  document.getElementById("licenseType").addEventListener("change",()=>{updateLicensePriceDisplay();calculateDeal();});

  [
    "ajPerCard","aiPerCard","pipesignPerCard",
    "paidUsers","licenseDiscount",
    "ajSku1","ajQty1","ajDisc1","ajSku2","ajQty2","ajDisc2",
    "apiSku1","apiQty1","apiDisc1","apiSku2","apiQty2","apiDisc2",
    "ciSku1","ciQty1","ciDisc1","ciSku2","ciQty2","ciDisc2",
    "aiSku1","aiQty1","aiDisc1","aiSku2","aiQty2","aiDisc2",
    "psSku1","psQty1","psDisc1"
  ].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    el.addEventListener("input",calculateDeal);
    el.addEventListener("change",calculateDeal);
  });

  document.getElementById("calcBtn").addEventListener("click",calculateDeal);
  calculateDeal();
});
