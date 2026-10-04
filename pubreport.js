/* VillageManPublic - standalone resident-facing Common-area Utility Report.
   Reads window.VILLAGEMAN_DATA (exported from the VillageMan app, pushed to this public repo).
   No localStorage, no private data, no photo/receipt links. */
(function(){
"use strict";

// ---- minimal util (mirrors the app's CM_UTIL for the fields this report uses) ----
function fmtMoney(n){ var v=Number(n)||0; return '\u0e3f'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(iso){ if(!iso) return ''; var p=String(iso).split('-'); if(p.length!==3) return iso; return p[2]+'/'+p[1]+'/'+p[0]; }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function fmtRate(n){ var v=Number(n)||0; return v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4}); }
var U={ fmtMoney:fmtMoney, fmtDate:fmtDate, esc:esc, fmtRate:fmtRate };

function _data(){ return (window.VILLAGEMAN_DATA && typeof window.VILLAGEMAN_DATA==='object') ? window.VILLAGEMAN_DATA : {meters:[],utility_bills:[]}; }

var _pubYear=new Date().getFullYear();
var _pubSort='period', _pubAsc=false;
function setPubYear(y){ _pubYear=parseInt(y,10)||new Date().getFullYear(); renderPubReport(); }
function _pubSortVal(b,col){
  var isSplit=!!b.split_meter;
  if(col==='period') return b.period||'';
  if(col==='meter') return String(b.central_meter_no||b.meter_no||b.installation||'').toLowerCase();
  if(col==='prev') return isSplit?(Number(b.central_prev)||0):(Number(b.prev_reading)||0);
  if(col==='pres') return isSplit?(Number(b.central_present)||0):(Number(b.present_reading)||0);
  if(col==='units') return isSplit?(Number(b.central_units)||0):(Number(b.units_used)||0);
  if(col==='energy') return isSplit?(Number(b.central_energy)||0):(Number(b.energy_charge)||0);
  if(col==='vat') return isSplit?(Number(b.central_vat)||0):(Number(b.vat)||0);
  if(col==='total') return isSplit?(Number(b.central_amount)||0):(Number(b.total_amount)||0);
  if(col==='status') return b.paid?1:0;
  return b.period||'';
}
function setPubSort(col){ if(_pubSort===col){ _pubAsc=!_pubAsc; } else { _pubSort=col; _pubAsc=true; } renderPubReport(); }
function _pubArrow(col){ if(_pubSort!==col) return ''; return _pubAsc?' \u25b2':' \u25bc'; }

function _pubMonthlyCostChart(bills){
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var vals=[]; for(var i=0;i<12;i++) vals.push(0);
  (bills||[]).forEach(function(b){ var pp=(b.period||'').split('-'); if(pp.length<2) return; var mi=parseInt(pp[1],10)-1; if(mi<0||mi>11) return; vals[mi]+=b.split_meter?(Number(b.central_amount)||0):(Number(b.total_amount)||0); });
  var max=Math.max.apply(null, vals.concat([1]));
  var W=640,H=170,padT=12,padB=22,padL=8,padR=8,n=12,bw=(W-padL-padR)/n,bars='';
  var maxIdx=-1,maxV=-1; for(var k=0;k<12;k++){ if(vals[k]>maxV){maxV=vals[k];maxIdx=k;} }
  for(var j=0;j<n;j++){
    var v=vals[j], bh=max>0?(v/max)*(H-padT-padB):0, x=padL+j*bw+bw*0.15, y=H-padB-bh, w=bw*0.7;
    var fill=(j===maxIdx&&v>0)?'var(--error)':'var(--primary-bg)', stroke=(j===maxIdx&&v>0)?'var(--error)':'var(--border2)';
    bars+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(0,bh).toFixed(1)+'" rx="2" fill="'+fill+'" stroke="'+stroke+'"><title>'+MON[j]+': '+U.fmtMoney(v)+'</title></rect>';
    if(v>0){ bars+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" text-anchor="middle" font-size="7" fill="var(--text3)">'+Math.round(v)+'</text>'; }
    bars+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(H-padB+10)+'" text-anchor="middle" font-size="8" fill="var(--text3)">'+MON[j]+'</text>';
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block" preserveAspectRatio="xMidYMid meet">'+bars+'</svg>';
}

function _calcSteps(b){
  var mainUnits=Number(b.units_used)||0, cu=Number(b.central_units)||0;
  var ce=(b.central_energy!=null)?Number(b.central_energy):null, cf=(b.central_ft!=null)?Number(b.central_ft):null, cv=(b.central_vat!=null)?Number(b.central_vat):null;
  var ca=Number(b.central_amount)||0, energyTot=(b.energy_charge!=null)?Number(b.energy_charge):null;
  var ratePerUnit=(energyTot!=null && mainUnits>0)?(energyTot/mainUnits):null;
  var S=function(n,label,val){ return '<div style="display:flex;justify-content:space-between;gap:10px;padding:2px 0"><span><b>'+n+'.</b> '+label+'</span><span style="white-space:nowrap">'+val+'</span></div>'; };
  var dash='<span class="text-muted">-</span>', h='';
  h+=S(1,'\u0e04\u0e48\u0e32\u0e1e\u0e25\u0e31\u0e07\u0e07\u0e32\u0e19\u0e23\u0e27\u0e21 (energy) \u00f7 \u0e2b\u0e19\u0e48\u0e27\u0e22\u0e23\u0e27\u0e21', (energyTot!=null?U.fmtMoney(energyTot):dash)+' \u00f7 '+(mainUnits?Math.round(mainUnits):dash));
  h+=S(2,'= \u0e23\u0e32\u0e04\u0e32\u0e15\u0e48\u0e2d\u0e2b\u0e19\u0e48\u0e27\u0e22', (ratePerUnit!=null?U.fmtMoney(ratePerUnit):dash));
  var ftRate=(cf!=null && cu>0)?(cf/cu):null;
  var preVat=((ce!=null?ce:0)+(cf!=null?cf:0));
  h+=S(3,'\u00d7 \u0e2b\u0e19\u0e48\u0e27\u0e22\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07 ('+Math.round(cu)+')', (ce!=null?('<span class="text-muted" style="font-size:10px">('+(ratePerUnit!=null?U.fmtMoney(ratePerUnit):dash)+' \u00d7 '+Math.round(cu)+') = </span>'+U.fmtMoney(ce)):dash));
  h+=S(4,'+ Ft (\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07)', (cf!=null?('<span class="text-muted" style="font-size:10px">('+(ftRate!=null?U.fmtRate(ftRate):dash)+' \u00d7 '+Math.round(cu)+') = </span>'+U.fmtMoney(cf)):dash));
  h+=S(5,'+ VAT 7%', (cv!=null?('<span class="text-muted" style="font-size:10px">('+U.fmtMoney(preVat)+' \u00d7 7%) = </span>'+U.fmtMoney(cv)):dash));
  h+=S(6,'<b>= \u0e22\u0e2d\u0e14\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e40\u0e01\u0e47\u0e1a</b>', '<b>'+U.fmtMoney(ca)+'</b>');
  h+='<div style="font-size:9px;color:var(--text3);margin-top:4px">* \u0e04\u0e48\u0e32\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23\u0e44\u0e21\u0e48\u0e23\u0e27\u0e21\u0e43\u0e19\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07 (\u0e40\u0e1b\u0e47\u0e19\u0e04\u0e48\u0e32\u0e21\u0e34\u0e40\u0e15\u0e2d\u0e23\u0e4c\u0e02\u0e2d\u0e07\u0e1a\u0e49\u0e32\u0e19)</div>';
  return h;
}

function renderPubReport(){
  var el=document.getElementById('pub-root'); if(!el) return;
  var D=_data();
  var meters=D.meters||[];
  var _meterById={}; meters.forEach(function(m){ _meterById[m.id]=m; });
  function _meterNo(b){ if(b&&b.central_meter_no) return b.central_meter_no; var m=_meterById[b.meter_id]; if(!m) return '-'; return m.installation||m.meter_no||m.ca_no||'-'; }
  var bills=(D.utility_bills||[]).filter(function(b){ if(b.home_only) return false; var y=(b.period||'').split('-')[0]; return parseInt(y,10)===_pubYear; });
  var ys={}; (D.utility_bills||[]).forEach(function(b){ var y=(b.period||'').split('-')[0]; if(y) ys[y]=1; }); ys[String(_pubYear)]=1; ys[String(new Date().getFullYear())]=1;
  var yearList=Object.keys(ys).sort(function(a,b){return b-a;});
  var yearOpts=yearList.map(function(y){ return '<option value="'+y+'"'+(parseInt(y,10)===_pubYear?' selected':'')+'>'+y+'</option>'; }).join('');
  var totCentral=0,nSplit=0,nFlat=0,cUnits=0;
  bills.forEach(function(b){ if(b.split_meter){ nSplit++; totCentral+=Number(b.central_amount)||0; cUnits+=Number(b.central_units)||0; } else { nFlat++; totCentral+=Number(b.total_amount)||0; cUnits+=Number(b.units_used)||0; } });
  var months=bills.length, avg=months?totCentral/months:0;
  var kpi=function(label,val,cls,sub){ return '<div class="kpi"><div class="kpi-label">'+label+'</div><div class="kpi-val '+(cls||'')+'">'+val+'</div>'+(sub?'<div style="font-size:9px;color:var(--text3);margin-top:2px">'+sub+'</div>':'')+'</div>'; };
  var sorted=bills.slice().sort(function(a,b){ var va=_pubSortVal(a,_pubSort),vb=_pubSortVal(b,_pubSort),r; if(typeof va==='number'&&typeof vb==='number'){r=va-vb;}else{r=String(va).localeCompare(String(vb));} if(r===0){r=(a.period||'').localeCompare(b.period||'');} return _pubAsc?r:-r; });
  var rows=sorted.map(function(b){
    var isSplit=!!b.split_meter;
    var typ=(b.utility_type==='water')?'\u0e19\u0e49\u0e33':'\u0e44\u0e1f';
    var central=isSplit?(Number(b.central_amount)||0):(Number(b.total_amount)||0);
    var units=isSplit?(Number(b.central_units)||0):(Number(b.units_used)||0);
    var prev=isSplit?(Number(b.central_prev)||0):(Number(b.prev_reading)||0);
    var pres=isSplit?(Number(b.central_present)||0):(Number(b.present_reading)||0);
    var energy=isSplit?((b.central_energy!=null)?Number(b.central_energy):null):((b.energy_charge!=null)?Number(b.energy_charge):null);
    var vat=isSplit?((b.central_vat!=null)?Number(b.central_vat):null):((b.vat!=null)?Number(b.vat):null);
    var meterNo=U.esc(_meterNo(b)), dash='<span class="text-muted">-</span>';
    var expBtn=isSplit?('<button class="lnk" title="\u0e14\u0e39\u0e27\u0e34\u0e18\u0e35\u0e04\u0e34\u0e14" onclick="pubToggle(\''+b.id+'\')"><i class="fa-solid fa-caret-right" id="pc-'+b.id+'"></i></button> '):'';
    var r='<tr>'
      +'<td>'+expBtn+U.esc(b.period||'-')+'</td><td>'+typ+'</td><td>'+meterNo+'</td>'
      +'<td class="r">'+Math.round(prev)+'</td><td class="r">'+Math.round(pres)+'</td><td class="r">'+Math.round(units)+'</td>'
      +'<td class="r">'+(energy!=null?U.fmtMoney(energy):dash)+'</td><td class="r">'+(vat!=null?U.fmtMoney(vat):dash)+'</td>'
      +'<td class="r"><b>'+U.fmtMoney(central)+'</b></td>'
      +'<td class="r">'+(b.paid?'<span class="tag tag-active">\u0e08\u0e48\u0e32\u0e22\u0e41\u0e25\u0e49\u0e27</span>':'<span class="tag tag-planned">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e08\u0e48\u0e32\u0e22</span>')+(b.paid&&b.paid_date?('<div style="font-size:8px;color:var(--text3);margin-top:2px">'+U.fmtDate(b.paid_date)+'</div>'):'')+'</td>'
      +'</tr>';
    if(isSplit){
      r+='<tr class="pub-detail" id="pd-'+b.id+'" style="display:none;background:var(--bg2)"><td colspan="10" style="padding:10px 14px;font-size:11px;line-height:1.6">'
        +'<div style="font-weight:700;margin-bottom:4px"><i class="fa-solid fa-calculator"></i> \u0e27\u0e34\u0e18\u0e35\u0e04\u0e34\u0e14\u0e22\u0e2d\u0e14\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07 ('+U.esc(b.period||'')+')</div>'
        +'<div style="max-width:460px">'+_calcSteps(b)+'</div>'
        +'<div style="margin-top:6px;font-size:10px;color:var(--text3)">\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e23\u0e27\u0e21\u0e17\u0e31\u0e49\u0e07\u0e1a\u0e34\u0e25 '+Math.round(Number(b.units_used)||0)+' \u2014 \u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07 '+Math.round(Number(b.central_units)||0)+' / \u0e1a\u0e49\u0e32\u0e19 '+Math.round(Number(b.home_units)||0)+'</div>'
        +'</td></tr>';
    }
    return r;
  }).join('');
  var head='<table class="tbl"><thead><tr>'
    +'<th style="cursor:pointer" onclick="setPubSort(\'period\')">\u0e07\u0e27\u0e14'+_pubArrow('period')+'</th><th>\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17</th><th style="cursor:pointer" onclick="setPubSort(\'meter\')">\u0e40\u0e25\u0e02\u0e21\u0e34\u0e40\u0e15\u0e2d\u0e23\u0e4c'+_pubArrow('meter')+'</th>'
    +'<th class="r" style="cursor:pointer" onclick="setPubSort(\'prev\')">\u0e40\u0e25\u0e02\u0e40\u0e01\u0e48\u0e32'+_pubArrow('prev')+'</th><th class="r" style="cursor:pointer" onclick="setPubSort(\'pres\')">\u0e40\u0e25\u0e02\u0e43\u0e2b\u0e21\u0e48'+_pubArrow('pres')+'</th><th class="r" style="cursor:pointer" onclick="setPubSort(\'units\')">\u0e2b\u0e19\u0e48\u0e27\u0e22'+_pubArrow('units')+'</th><th class="r" style="cursor:pointer" onclick="setPubSort(\'energy\')">\u0e04\u0e48\u0e32\u0e1e\u0e25\u0e31\u0e07\u0e07\u0e32\u0e19'+_pubArrow('energy')+'</th><th class="r" style="cursor:pointer" onclick="setPubSort(\'vat\')">VAT'+_pubArrow('vat')+'</th><th class="r" style="cursor:pointer" onclick="setPubSort(\'total\')">\u0e23\u0e27\u0e21(\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07)'+_pubArrow('total')+'</th><th class="r" style="cursor:pointer" onclick="setPubSort(\'status\')">\u0e2a\u0e16\u0e32\u0e19\u0e30'+_pubArrow('status')+'</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table>';
  var tbl=sorted.length?head:'<p class="text-muted" style="padding:10px">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1a\u0e34\u0e25\u0e43\u0e19\u0e1b\u0e35\u0e19\u0e35\u0e49</p>';
  var genNote = D.generated_at ? ('<div style="font-size:10px;color:var(--text3);text-align:right">\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25 \u0e13 '+U.esc(String(D.generated_at).slice(0,10))+'</div>') : '';
  el.innerHTML='<div class="card">'
    +'<h2><i class="fa-solid fa-users"></i> \u0e2a\u0e23\u0e38\u0e1b\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07 (\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e25\u0e39\u0e01\u0e1a\u0e49\u0e32\u0e19)'+(D.estate_name?(' \u2014 '+U.esc(D.estate_name)):'')+'</h2>'
    +'<p class="text-muted" style="font-size:12px;margin:-4px 0 10px">\u0e2b\u0e19\u0e49\u0e32\u0e19\u0e35\u0e49\u0e41\u0e2a\u0e14\u0e07\u0e04\u0e48\u0e32\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07\u0e02\u0e2d\u0e07\u0e2b\u0e21\u0e39\u0e48\u0e1a\u0e49\u0e32\u0e19 \u0e27\u0e48\u0e32\u0e41\u0e15\u0e48\u0e25\u0e30\u0e07\u0e27\u0e14\u0e04\u0e34\u0e14\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e44\u0e23 \u0e23\u0e27\u0e21\u0e40\u0e17\u0e48\u0e32\u0e44\u0e23</p>'
    +genNote
    +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><label class="text-muted" style="font-size:12px">\u0e1b\u0e35:</label><select class="inp" style="max-width:120px" onchange="setPubYear(this.value)">'+yearOpts+'</select></div>'
    +'<div class="card" style="background:var(--bg2);margin-bottom:12px"><h3 style="font-size:12px;margin:0 0 6px"><i class="fa-solid fa-chart-column"></i> \u0e04\u0e48\u0e32\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07\u0e23\u0e32\u0e22\u0e40\u0e14\u0e37\u0e2d\u0e19 ('+_pubYear+')</h3>'+_pubMonthlyCostChart(bills)+'</div>'
    +'<div class="kpi-grid">'
      +kpi('\u0e23\u0e27\u0e21\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07\u0e17\u0e31\u0e49\u0e07\u0e1b\u0e35', U.fmtMoney(totCentral), 'text-error', months+' \u0e07\u0e27\u0e14')
      +kpi('\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22\u0e15\u0e48\u0e2d\u0e40\u0e14\u0e37\u0e2d\u0e19', U.fmtMoney(avg), '', '')
      +kpi('\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e2a\u0e48\u0e27\u0e19\u0e01\u0e25\u0e32\u0e07\u0e23\u0e27\u0e21', Math.round(cUnits), '', '')
      +kpi('\u0e1a\u0e34\u0e25\u0e1e\u0e48\u0e27\u0e07 / \u0e1a\u0e34\u0e25\u0e18\u0e23\u0e23\u0e21\u0e14\u0e32', nSplit+' / '+nFlat, '', '\u0e1a\u0e34\u0e25')
    +'</div>'+tbl+'</div>';
}
function pubToggle(id){ var row=document.getElementById('pd-'+id), ic=document.getElementById('pc-'+id); if(!row) return; var open=row.style.display!=='none'; row.style.display=open?'none':''; if(ic) ic.className='fa-solid '+(open?'fa-caret-right':'fa-caret-down'); }

window.renderPubReport=renderPubReport;
window.setPubYear=setPubYear;
window.setPubSort=setPubSort;
window.pubToggle=pubToggle;
document.addEventListener('DOMContentLoaded', function(){ try{ renderPubReport(); }catch(e){ var el=document.getElementById('pub-root'); if(el) el.innerHTML='<div class="card"><p class="text-muted">\u0e42\u0e2b\u0e25\u0e14\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08: '+(e&&e.message?e.message:e)+'</p></div>'; } });
})();
