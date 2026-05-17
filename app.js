// ================= BASIC =================
function showTab(tabId){
document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
let el = document.getElementById(tabId);
if(el) el.classList.add('active');

if(tabId==="dashboard") renderDashboard();
if(tabId==="workout") loadWorkout();
if(tabId==="measurements") renderMeasurement();
}

// ================= STORAGE =================
function getData(key){
return JSON.parse(localStorage.getItem(key)||"{}");
}
function setData(key,val){
localStorage.setItem(key,JSON.stringify(val));
}

// TIMEZONE SAFE DATE
function today(){
let d = new Date();
let local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
return local.toISOString().split('T')[0];
}

// ================= RECOVERY =================
function saveRecovery(){

let score =
(rec_sleep?.checked?15:0)+
(rec_alarm?.checked?15:0)+
(rec_joint?.checked?15:0)+
(rec_sharp?.checked?15:0)+
(rec_vital?.checked?15:0)+
((rec_cns?.value || 0)*5);

let data=getData("performance");
data[today()]={total:Math.min(100,Math.max(0,score))};
setData("performance",data);

renderDashboard();
}

// ================= DASHBOARD =================
function renderDashboard(){

let exec = getData("execution")[today()] || 0;

let canvas = document.getElementById("scoreRing");
if(!canvas) return;

let ctx = canvas.getContext("2d");
let percentEl = document.getElementById("todayPercent");

ctx.clearRect(0,0,160,160);

ctx.beginPath();
ctx.arc(80,80,60,0,2*Math.PI);
ctx.strokeStyle="#333";
ctx.lineWidth=10;
ctx.stroke();

ctx.beginPath();
ctx.arc(80,80,60,0,(exec/100)*2*Math.PI);
ctx.strokeStyle=exec<50?"red":exec<75?"orange":"green";
ctx.lineWidth=10;
ctx.stroke();

if(percentEl) percentEl.innerHTML = exec + "%";

let rec = getData("performance")[today()];
let perfEl = document.getElementById("performanceIndex");
if(perfEl){
perfEl.innerHTML = rec ? rec.total + "%" : "Not logged";
}
}

// ================= DAY =================
function getWorkoutDay(){
let d = localStorage.getItem("cycleDay");
if(!d){
d = 1;
localStorage.setItem("cycleDay",1);
}
return Number(d);
}

function nextWorkoutDay(){
let d = getWorkoutDay();
d = d===3 ? 1 : d+1;
localStorage.setItem("cycleDay",d);
}

// ================= DAY PROGRESSION =================
function handleDayProgression(){

let todayDate = today();
let lastDate = localStorage.getItem("lastDate");

if(!lastDate){
localStorage.setItem("lastDate", todayDate);
return;
}

if(lastDate === todayDate) return;

// -------- DATE CHANGED --------
let y = new Date();
y.setDate(y.getDate()-1);
let yDate = new Date(y.getTime() - y.getTimezoneOffset()*60000)
.toISOString().split('T')[0];

let execData = getData("execution");
let yScore = execData[yDate] || 0;

if(yScore >= 50){
nextWorkoutDay();
}

localStorage.setItem("lastDate", todayDate);

// reset today's data
let checks = getData("checks");
Object.keys(checks).forEach(k=>{
if(k.startsWith(todayDate)) delete checks[k];
});
setData("checks", checks);

let alcohol = getData("alcohol");
delete alcohol[todayDate];
setData("alcohol", alcohol);
}

// ================= WORKOUT PLAN =================
function getWorkoutPlan(day){

if(day===1){
return [
{name:"Kettlebell Snatch", weight:"8kg", sets:5, reps:12},
{name:"Clean & Press", weight:"12kg", sets:5, reps:8},
{name:"Pushups", weight:"BW", sets:5, reps:20},
{name:"Lateral Raises", weight:"8kg", sets:4, reps:12}
];
}

if(day===2){
return [
{name:"Kettlebell Swings", weight:"12kg", sets:5, reps:20},
{name:"Goblet Squats", weight:"12kg", sets:5, reps:12},
{name:"Rows", weight:"12kg", sets:4, reps:10},
{name:"Halos", weight:"8kg", sets:3, reps:12}
];
}

if(day===3){
return [
{name:"Leg Raises", weight:"BW", sets:4, reps:15},
{name:"Plank Hold", weight:"BW", sets:3, reps:"40s"},
{name:"Russian Twists", weight:"8kg", sets:4, reps:20},
{name:"Mountain Climbers", weight:"BW", sets:4, reps:30}
];
}
}

// ================= LOAD WORKOUT =================
function loadWorkout(){

handleDayProgression();

let container = document.getElementById("exerciseList");
if(!container) return;

container.innerHTML="";

if(!getData("performance")[today()]){
container.innerHTML="<b>Log Recovery First</b>";
return;
}

let day = getWorkoutDay();
let dayEl = document.getElementById("dayTitle");
if(dayEl) dayEl.innerText="Day " + day;

let plan = getWorkoutPlan(day);
let state = getData("checks");

let html="";

plan.forEach(ex=>{

let safeName = ex.name.replace(/[^a-zA-Z0-9]/g,"");

html += `<div class="section"><b>${ex.name} (${ex.weight})</b>`;

for(let s=1;s<=ex.sets;s++){

let key = `${today()}_${safeName}_${s}`;
let checked = state[key] ? "checked" : "";

html += `
<label>
<input type="checkbox" data-main="1" data-key="${key}" ${checked}
onchange="handleCheck(this)">
<span>Set ${s} – ${ex.reps}</span>
</label>`;
}

html += `</div>`;
});

container.innerHTML = html;

// SAFE DOM rendering
let pre = document.getElementById("preStretch");
if(pre){
pre.innerHTML = simpleBlock(
["Neck Rolls","Shoulder Circles","Hip Circles","Ankle Rotations","Cat Camel","Thread The Needle","Bird Dog","Hip Hinge Drill"],"pre"
);
}

let post = document.getElementById("postStretch");
if(post){
post.innerHTML = simpleBlock(
["Child Pose","Doorway Pec Stretch","Lat Stretch","Hip Flexor","Deep Squat Hold","Crocodile Breathing"],"post"
);
}

let read = document.getElementById("readingSection");
if(read){
read.innerHTML = simpleBlock(["15 Min Reading"],"read");
}

// alcohol
let alc = document.getElementById("alcoholInput");
if(alc){
let alcData = getData("alcohol");
alc.value = alcData[today()] || 0;

alc.oninput = function(){
let data = getData("alcohol");
data[today()] = Number(alc.value);
setData("alcohol", data);
updateExecutionScore();
};
}
}

// ================= SIMPLE BLOCK =================
function simpleBlock(arr,type){

let html="";
let state = getData("checks");

arr.forEach((item,i)=>{

let key = `${today()}_${type}_${i}`;
let checked = state[key] ? "checked" : "";

html += `
<label>
<input type="checkbox" data-type="${type}" data-key="${key}" ${checked}
onchange="handleCheck(this)">
<span>${item}</span>
</label>`;
});

return html;
}

// ================= CHECK =================
function handleCheck(el){

let state = getData("checks");
state[el.dataset.key] = el.checked;
setData("checks", state);

updateExecutionScore();
}

// ================= SCORE =================
function updateExecutionScore(){

let main = document.querySelectorAll("input[data-main]");
let pre = document.querySelectorAll("input[data-type='pre']");
let post = document.querySelectorAll("input[data-type='post']");
let read = document.querySelectorAll("input[data-type='read']");

let count = (list)=>[...list].filter(c=>c.checked).length;

// let mainScore = main.length ? (count(main)/main.length)*60 : 0;
// let stretchScore = (pre.length+post.length) ?
// ((count(pre)+count(post))/(pre.length+post.length))*20 : 0;
// let readScore = read.length ? (count(read)/read.length)*10 : 0;

// let alcoholData = getData("alcohol");
// let alcohol = alcoholData[today()] || 0;
// let alcoholScore = alcohol===0 ? 10 : 0;

// let final = Math.round(mainScore + stretchScore + readScore + alcoholScore);
let mainScore = main.length
? (count(main)/main.length)*60
: 0;
let stretchScore = (pre.length + post.length)
? ((count(pre)+count(post)) /
(pre.length+post.length))*20
: 0;
let readScore = read.length
? (count(read)/read.length)*10
: 0;

let alcoholData = getData("alcohol");
let alcohol = alcoholData[today()] || 0;

// penalty only
let alcoholPenalty = alcohol > 2 ? -10 : 0;

let final = Math.round(
mainScore +
stretchScore +
readScore +
alcoholPenalty
);

final = Math.max(0, Math.min(100, final));

let data = getData("execution");
data[today()] = final;
setData("execution", data);

renderDashboard();
}




// ================= MEASUREMENTS =================
function saveMeasurement(){

let data=getData("measurements");

data[today()] = {
weight:+m_weight.value || 0,
waist:+m_waist.value || 0,
chest:+m_chest.value || 0,
arms:+m_arms.value || 0,
thighs:+m_thighs.value || 0,
shoulders:+m_shoulders.value || 0,
bodyfat:+m_bodyfat.value || 0
};

setData("measurements",data);
renderMeasurement();
}

function renderMeasurement(){

let data=getData("measurements");
let keys=Object.keys(data);
if(!keys.length) return;

let x=data[keys[keys.length-1]];
let w=x.waist || 1;

let latest = document.getElementById("latestMeasurement");
let comp = document.getElementById("measurementComparison");

if(latest){
latest.innerHTML =
`Weight: ${x.weight} kg<br>
Waist: ${x.waist} in<br>
Body Fat: ${x.bodyfat}%`;
}

if(comp){
comp.innerHTML =
`Chest: ${x.chest} / ${(w*1.4).toFixed(1)}<br>
Shoulders: ${x.shoulders} / ${(w*1.6).toFixed(1)}<br>
Arms: ${x.arms} / ${(w*0.5).toFixed(1)}<br>
Thighs: ${x.thighs} / ${(w*0.75).toFixed(1)}`;
}
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", function(){

handleDayProgression(); // important
renderDashboard();
renderMeasurement();

});
