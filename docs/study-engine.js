'use strict';
/* Pure scheduling, validation and measurement. No network or account data. */
(function(root){
 const DAY=86400000, intervals=[1,3,7,21];
 const group=n=>n<=14?'権利関係':n<=22?'法令上の制限':n<=25?'税・その他':n<=45?'宅建業法':'免除';
 const today=(now=Date.now())=>new Date(now+9*3600000).toISOString().slice(0,10);
 const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
 const weekday=d=>new Date(d+'T00:00:00Z').getUTCDay();
 const off=d=>[2,3].includes(weekday(d));
 const week=d=>addDays(d,-((weekday(d)+5)%7)); // Tuesday is the first day of a study week.
 const fresh=()=>({schema:1,app:'takken2027',settings:{offMinutes:165,workMinutes:30,annualHours:420,targetDate:''},attempts:[],exposure:{},mockRuns:[],session:null,baseline:{},comparisons:[],lawChecks:[],time:[],legacySnapshot:null});
 const uid=()=>root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 function nextReview(previous,good,day){
  const level=good?(previous&&previous.good&&day>=previous.due?Math.min(3,previous.level+1):previous?.good?previous.level:0):0;
  return {level,due:addDays(day,intervals[level]),good};
 }
 function latest(attempts){return Object.fromEntries([...attempts].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)).map(a=>[a.qid,a]));}
 function schedules(attempts){const out={};for(const a of [...attempts].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){out[a.qid]=nextReview(out[a.qid],a.correct&&a.quality===2,today(a.at));}return out;}
 const due=(s,day=today())=>Object.entries(schedules(s.attempts)).filter(([,v])=>v.due<=day).sort((a,b)=>a[1].due.localeCompare(b[1].due)).map(([id])=>id);
 function metrics(s,bank){const all=Object.values(latest(s.attempts));return ['宅建業法','法令上の制限','権利関係','税・その他'].map(g=>{const rows=all.filter(a=>bank[a.qid]?.group===g);return{group:g,n:rows.length,correct:rows.filter(a=>a.correct).length,understood:rows.filter(a=>a.correct&&a.quality===2).length};});}
 function validate(raw,bank){
  const fail=()=>{throw Error('バックアップの形式・数値・問題IDを確認してください。')};
  const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);const str=(v,n=5000)=>typeof v==='string'&&v.length<=n;
  const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;const stamp=v=>Number.isFinite(v)&&v>0&&v<4102444800000;
  const date=v=>str(v,10)&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
  const array=(v,fn,n=50000)=>{if(!Array.isArray(v)||v.length>n||!v.every(fn))fail();return v};
  const unique=a=>new Set(a.map(x=>x.id)).size===a.length;
  if(!obj(raw)||raw.app!=='takken2027'||raw.schema!==1)fail();const s=fresh();
  if(!obj(raw.settings))fail();const t=raw.settings;if(!int(t.offMinutes,0,600)||!int(t.workMinutes,0,300)||!int(t.annualHours,1,2000)||!(t.targetDate===''||date(t.targetDate)))fail();s.settings={offMinutes:t.offMinutes,workMinutes:t.workMinutes,annualHours:t.annualHours,targetDate:t.targetDate};
  s.attempts=array(raw.attempts,a=>obj(a)&&str(a.id,100)&&!!bank[a.qid]&&stamp(a.at)&&int(a.answer,1,4)&&int(a.quality,0,2)&&Array.isArray(a.reasons)&&a.reasons.length===4&&a.reasons.every(r=>str(r,2000))&&(a.quality!==2||a.reasons.every(r=>r.trim().length>0))&&str(a.cause,80)).map(a=>({id:a.id,qid:a.qid,at:a.at,answer:a.answer,correct:a.answer===bank[a.qid].officialAnswer,quality:a.quality,reasons:a.reasons.slice(),cause:a.cause}));if(!unique(s.attempts))fail();
  if(!obj(raw.exposure))fail();for(const [k,v]of Object.entries(raw.exposure)){if(!bank[k]||!stamp(v))fail();s.exposure[k]=v;}for(const a of s.attempts)s.exposure[a.qid]=Math.min(s.exposure[a.qid]||a.at,a.at);
  const answers=v=>{if(!obj(v))fail();const out={};for(const[k,x]of Object.entries(v)){if(!bank[k]||!int(x,1,4))fail();out[k]=x;}return out;};
  s.mockRuns=array(raw.mockRuns,r=>obj(r)&&str(r.id,100)&&stamp(r.at)&&int(r.year,2022,2025)&&int(r.elapsed,0,86400000)&&typeof r.unseen==='boolean',5000).map(r=>{const a=answers(r.answers);const ids=Object.keys(bank).filter(k=>bank[k].year===r.year);if(Object.keys(a).some(k=>!ids.includes(k)))fail();return{id:r.id,at:r.at,year:r.year,elapsed:r.elapsed,unseen:r.unseen,answers:a,score:ids.filter(k=>a[k]===bank[k].officialAnswer).length};});if(!unique(s.mockRuns))fail();
  if(raw.session!==null){const x=raw.session;if(!obj(x)||!['drill','mock'].includes(x.kind)||!stamp(x.started)||!str(x.id,100))fail();const ids=array(x.ids,k=>!!bank[k],180);if(!ids.length||new Set(ids).size!==ids.length||!int(x.pos,0,ids.length-1))fail();const a=answers(x.answers);if(Object.keys(a).some(k=>!ids.includes(k)))fail();const reasons=x.reasons;if(!obj(reasons))fail();const rr={};for(const[k,v]of Object.entries(reasons)){if(!ids.includes(k)||!Array.isArray(v)||v.length!==4||!v.every(t=>str(t,2000)))fail();rr[k]=v.slice();}
   if(typeof x.revealed!=='boolean'||typeof x.unseen!=='boolean'||!int(x.year,0,2025)||!stamp(x.deadline))fail();if(x.kind==='mock'&&(ids.length!==45||ids.some(k=>bank[k].year!==x.year)||x.deadline-x.started!==110*60000))fail();
   s.session={id:x.id,kind:x.kind,ids:ids.slice(),pos:x.pos,answers:a,reasons:rr,started:x.started,deadline:x.deadline,revealed:x.revealed,unseen:x.unseen,year:x.year};
  }
  if(!obj(raw.baseline))fail();for(const[k,v]of Object.entries(raw.baseline)){if(!/^(?:[1-9]|[1-4][0-9]|50)$/.test(k)||!obj(v)||!str(v.topic,200)||!str(v.cause,80)||!str(v.note,3000)||!stamp(v.updated))fail();s.baseline[k]={topic:v.topic,cause:v.cause,note:v.note,updated:v.updated};}
  s.comparisons=array(raw.comparisons,c=>obj(c)&&str(c.id,100)&&int(c.round,1,4)&&int(c.mockQ,1,50)&&int(c.examQ,1,50)&&int(c.level,1,3)&&str(c.topic,200)&&str(c.evidence,3000)&&c.evidence.trim().length>0&&stamp(c.updated),1000).map(c=>({id:c.id,round:c.round,mockQ:c.mockQ,examQ:c.examQ,level:c.level,topic:c.topic,evidence:c.evidence,updated:c.updated}));if(!unique(s.comparisons))fail();
  s.lawChecks=array(raw.lawChecks,c=>obj(c)&&str(c.id,100)&&str(c.topic,200)&&str(c.url,2000)&&/^https:\/\//.test(c.url)&&date(c.date)&&str(c.note,3000)&&typeof c.verified==='boolean'&&stamp(c.updated),1000).map(c=>({id:c.id,topic:c.topic,url:c.url,date:c.date,note:c.note,verified:c.verified,updated:c.updated}));if(!unique(s.lawChecks))fail();
  s.time=array(raw.time,r=>obj(r)&&str(r.id,100)&&date(r.day)&&int(r.minutes,1,1440)&&str(r.note,200)&&stamp(r.updated),10000).map(r=>({id:r.id,day:r.day,minutes:r.minutes,note:r.note,updated:r.updated}));if(!unique(s.time))fail();
  if(raw.legacySnapshot!==null){if(!str(raw.legacySnapshot,12000000))fail();let l;try{l=JSON.parse(raw.legacySnapshot)}catch{fail()}if(l?.app!=='takken2026'||l.schema!==1)fail();s.legacySnapshot=raw.legacySnapshot;}
  return s;
 }
 function merge(local,remote,bank){const out=JSON.parse(JSON.stringify(local));const join=(a,b)=>{const m=new Map(a.map(x=>[x.id,x]));for(const r of b){const l=m.get(r.id);if(!l||(r.updated||r.at)>(l.updated||l.at))m.set(r.id,r);}return [...m.values()];};for(const k of ['attempts','mockRuns','comparisons','lawChecks','time'])out[k]=join(local[k],remote[k]);for(const[k,v]of Object.entries(remote.exposure))out.exposure[k]=Math.min(out.exposure[k]||v,v);for(const[k,v]of Object.entries(remote.baseline))if(!out.baseline[k]||v.updated>out.baseline[k].updated)out.baseline[k]=v;out.legacySnapshot=local.legacySnapshot||remote.legacySnapshot; out.session=local.session||remote.session; // Keep a local in-flight session, otherwise resume the imported one.
  return validate(out,bank);
 }
 root.Study2027={DAY,intervals,group,today,addDays,weekday,off,week,fresh,uid,nextReview,latest,schedules,due,metrics,validate,merge};
 if(typeof module!=='undefined')module.exports=root.Study2027;
})(typeof globalThis!=='undefined'?globalThis:this);
