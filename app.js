/* ================= TAB ================= */

function showTab(tabId){
document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
document.getElementById(tabId).classList.add('active');

if(tabId==="dashboard"){
updateScore();
updateWeekly();
renderPRI();
loadStrengthUpdate();
renderLatestMeasurement();
}

if(tabId==="workout"){
updateDirectiveFromStorage();
loadWorkout();
}

if(tabId==="measurements"){
renderMeasurement();
populateMeasurementForm();
}

if(tabId==="recovery"){
populateRecoveryForm();
}
}

/* ================= DATE ================= */

function todayKey(){
return new Date().toISOString().split('T')[0];
}

function getMonday(date){
let d=new Date(date);
let day=d.getDay();
let diff=d.getDate()-day+(day===0?-6:1);
return new Date(d.setDate(diff));
}

/* ================= STORAGE ================= */

function getData(key){
return JSON.parse(localStorage.getItem(key)||"{}");
}

function setData(key,val){
localStorage.setItem(key,JSON.stringify(val));
}

/* ================= WORKOUT DATA ================= */

const workouts={
Monday:["Squats","Bulgarian Split Squats","Romanian Deadlift","Walking Lunges","Calf Raises","Plank"],
Tuesday:["Mobility Flow","Glute Bridges","Thoracic Rotation","Brisk Walk"],
Wednesday:["Pushups","Shoulder Press","Lateral Raises","Dips"],
Thursday:["Bodyweight Squats","Glute Hold","Calf Raises","Dead Hang"],
Friday:["Pullups","Rows","Face Pulls","Biceps Curls"],
Saturday:["Light Cardio"],
Sunday:["Rest"]
};

const preStretch=["Neck Rolls","Shoulder Circles","Hip Circles","Ankle Rotations"];
const postStretch=["Hamstring Stretch","Hip Flexor Stretch","Deep Squat Hold","Breathing"];
const readingTask=["15 Min Reading"];

/* ================= WORKOUT ================= */

function loadWorkout(){

let todayName=new Date().toLocaleString('en-us',{weekday:'long'});
document.getElementById("dayTitle").innerText=todayName;

let date=todayKey();
let log=getData("dailyLog");
let dayLog=log[date]||{checked:[],alcohol:0};

renderSection("preStretch",preStretch,dayLog,false);
renderSection("exerciseList",workouts[todayName]||[],dayLog,true);
renderSection("postStretch",postStretch,dayLog,false);
renderSection("readingSection",readingTask,dayLog,false);

document.getElementById("alcoholInput").value=dayLog.alcohol||0;

updateScore();
}

function renderSection(id,items,dayLog,withWeight){
let container=document.getElementById(id);
container.innerHTML="";

items.forEach(ex=>{
let checked=dayLog.checked.includes(ex);

let html=`<label>
<input type="checkbox" ${checked?"checked":""}
onchange="toggleExercise('${ex}',this.checked)">
${ex}
</label>`;

if(withWeight){
html+=`<input type="number" placeholder="Weight (kg)"
oninput="saveWeight('${ex}',this.value)">`;
}

let div=document.createElement("div");
div.innerHTML=html;
container.appendChild(div);
});
}

function toggleExercise(ex,val){
let date=todayKey();
let log=getData("dailyLog");
if(!log[date]) log[date]={checked:[],alcohol:0};

if(val){
if(!log[date].checked.includes(ex)) log[date].checked.push(ex);
}else{
log[date].checked=log[date].checked.filter(e=>e!==ex);
}

setData("dailyLog",log);
updateScore();
}

function saveWeight(ex,weight){
let hist=getData("weightHistory");
if(!hist[ex]) hist[ex]=[];
hist[ex].push({date:todayKey(),weight:Number(weight)});
setData("weightHistory",hist);
toggleExercise(ex,true);
}

/* ================= SCORE ================= */

function updateScore(){

let date=todayKey();
let log=getData("dailyLog");
if(!log[date]) log[date]={checked:[],alcohol:0};

let todayName=new Date().toLocaleString('en-us',{weekday:'long'});

let total=preStretch.length
+(workouts[todayName]||[]).length
+postStretch.length
+readingTask.length;

let percent=Math.round((log[date].checked.length/total)*100);

let pegs=Number(document.getElementById("alcoholInput").value||0);
log[date].alcohol=pegs;
setData("dailyLog",log);

if(pegs>=3) percent-=10;
if(pegs>=4) percent-=10;
if(percent===0 && todayName!=="Sunday") percent-=10;
if(percent<0) percent=0;

let daily=getData("dailyScore");
daily[date]=percent;
setData("dailyScore",daily);

drawRing(percent);
document.getElementById("todayPercent").innerText=percent+"%";
updateWeekly();
}

function drawRing(percent){
let c=document.getElementById("scoreRing");
if(!c) return;
let ctx=c.getContext("2d");
ctx.clearRect(0,0,160,160);

ctx.beginPath();
ctx.arc(80,80,60,0,2*Math.PI);
ctx.strokeStyle="#333";
ctx.lineWidth=10;
ctx.stroke();

ctx.beginPath();
ctx.arc(80,80,60,-Math.PI/2,(percent/100)*2*Math.PI-Math.PI/2);
ctx.strokeStyle="#aaa";
ctx.lineWidth=10;
ctx.stroke();
}

/* ================= WEEKLY ================= */

function updateWeekly(){
let daily=getData("dailyScore");
let monday=getMonday(new Date());

let sum=0;
for(let i=0;i<7;i++){
let d=new Date(monday);
d.setDate(monday.getDate()+i);
let key=d.toISOString().split('T')[0];
sum+=daily[key]?daily[key]:0;
}

let avg=Math.round(sum/7);

document.getElementById("weeklyPercent").innerText=avg+"%";
let bar=document.getElementById("weeklyBar");
bar.style.width=avg+"%";
bar.style.background=avg>=80?"green":avg>=60?"gray":"red";
}

/* ================= RECOVERY ================= */

function saveRecovery(){

let sleep=document.getElementById("rec_sleep").checked;
let alarm=document.getElementById("rec_alarm").checked;
let joint=document.getElementById("rec_joint").checked;
let sharp=document.getElementById("rec_sharp").checked;
let vital=document.getElementById("rec_vital").checked;
let cns=Number(document.getElementById("rec_cns").value);

let count=[sleep,alarm,joint,sharp,vital].filter(v=>v).length;

let total=(count*15)+(cns*5);

let data=getData("performance");
data[todayKey()]={sleep,alarm,joint,sharp,vital,cns,total};
setData("performance",data);

renderPRI();
alert("Recovery Saved");
}

function renderPRI(){

let data=getData("performance");
let today=data[todayKey()];
let el=document.getElementById("performanceIndex");

if(!today){
el.innerHTML="Not logged today";
updateDirective(null);
return;
}

let score=today.total;

let color="gray";
let label="Normal Load";

if(score>=80){
color="green";
label="High Readiness";
}
else if(score<60){
color="red";
label="Reduce Intensity";
}

el.innerHTML=`<div style="color:${color};font-weight:bold;">
${score}% – ${label}
</div>`;

updateDirective(score);
}

function populateRecoveryForm(){
let data=getData("performance");
let today=data[todayKey()];
if(!today) return;

document.getElementById("rec_sleep").checked=today.sleep;
document.getElementById("rec_alarm").checked=today.alarm;
document.getElementById("rec_joint").checked=today.joint;
document.getElementById("rec_sharp").checked=today.sharp;
document.getElementById("rec_vital").checked=today.vital;
document.getElementById("rec_cns").value=today.cns;
}

/* ================= DIRECTIVE ================= */

function updateDirective(score){

let box=document.getElementById("trainingDirective");
if(!box) return;

if(score===null){
box.className="directive gray";
box.innerText="Log Recovery First";
return;
}

if(score>=80){
box.className="directive green";
box.innerText="Push Intensity Today";
}
else if(score<60){
box.className="directive red";
box.innerText="Reduce Load 15%";
}
else{
box.className="directive gray";
box.innerText="Train As Planned";
}
}

function updateDirectiveFromStorage(){
let data=getData("performance");
let today=data[todayKey()];
if(!today){
updateDirective(null);
}else{
updateDirective(today.total);
}
}

/* ================= MEASUREMENTS ================= */

function saveMeasurement(){
let weight=document.getElementById("m_weight").value;
let waist=document.getElementById("m_waist").value;

if(!weight||!waist){ alert("Weight and Waist required"); return; }

let log=getData("measurementLog");
log[todayKey()] = {
weight:Number(weight),
waist:Number(waist),
chest:Number(document.getElementById("m_chest").value||0),
arms:Number(document.getElementById("m_arms").value||0),
thighs:Number(document.getElementById("m_thighs").value||0),
shoulders:Number(document.getElementById("m_shoulders").value||0),
bodyfat:Number(document.getElementById("m_bodyfat").value||0)
};

setData("measurementLog",log);
renderMeasurement();
renderLatestMeasurement();
populateMeasurementForm();
alert("Saved");
}

function renderMeasurement(){
let log=getData("measurementLog");
let dates=Object.keys(log).sort();
if(dates.length===0){
document.getElementById("measurementComparison").innerHTML="No data";
return;
}

let latest=log[dates[dates.length-1]];
let waist=latest.waist;

let ideal={
shoulders:(waist*1.6),
chest:(waist*1.4),
arms:(waist*0.5),
thighs:(waist*0.75)
};

function bar(label,current,idealVal){
let percent=Math.min((current/idealVal)*100,100);
let color=percent>=95?"green":percent>=80?"gray":"red";

return `<div style="margin-bottom:10px;">
${label}: ${current} / ${idealVal.toFixed(1)}
<div style="background:#222;height:6px;border-radius:3px;">
<div style="width:${percent}%;background:${color};height:6px;border-radius:3px;"></div>
</div></div>`;
}

document.getElementById("measurementComparison").innerHTML=
bar("Chest",latest.chest,ideal.chest)+
bar("Shoulders",latest.shoulders,ideal.shoulders)+
bar("Arms",latest.arms,ideal.arms)+
bar("Thighs",latest.thighs,ideal.thighs);
}

function renderLatestMeasurement(){
let log=getData("measurementLog");
let dates=Object.keys(log).sort();
let el=document.getElementById("latestMeasurement");

if(dates.length===0){ el.innerHTML="No data"; return; }

let latest=log[dates[dates.length-1]];
el.innerHTML=`Weight: ${latest.weight} kg<br>
Waist: ${latest.waist} in<br>
Body Fat: ${latest.bodyfat}%`;
}

function populateMeasurementForm(){
let log=getData("measurementLog");
let dates=Object.keys(log).sort();
if(dates.length===0) return;
let latest=log[dates[dates.length-1]];

document.getElementById("m_weight").value=latest.weight;
document.getElementById("m_waist").value=latest.waist;
document.getElementById("m_chest").value=latest.chest;
document.getElementById("m_arms").value=latest.arms;
document.getElementById("m_thighs").value=latest.thighs;
document.getElementById("m_shoulders").value=latest.shoulders;
document.getElementById("m_bodyfat").value=latest.bodyfat;
}

/* ================= STRENGTH ================= */

function loadStrengthUpdate(){
let hist=getData("weightHistory");
let output="";
for(let ex in hist){
let arr=hist[ex];
if(arr.length>1){
let last=arr[arr.length-1].weight;
let prev=arr[arr.length-2].weight;
let diff=last-prev;
output+=`${ex}: ${prev} → ${last} (${diff>=0?'+':''}${diff})<br>`;
}
}
let el=document.getElementById("strengthUpdate");
if(el) el.innerHTML=output;
}

/* ================= REMINDERS ================= */

function saveReminders(){
let r={
workout:document.getElementById("r_workout").value,
supplement:document.getElementById("r_supplement").value,
sleep:document.getElementById("r_sleep").value
};
setData("reminders",r);
alert("Saved");
}

function loadReminders(){
let r=getData("reminders");
if(!r) return;
document.getElementById("r_workout").value=r.workout||"";
document.getElementById("r_supplement").value=r.supplement||"";
document.getElementById("r_sleep").value=r.sleep||"";
}

function checkReminders(){
let r=getData("reminders");
if(!r) return;

let now=new Date();
let time=now.toTimeString().slice(0,5);
let today=todayKey();
let fired=getData("reminderFired");
if(!fired[today]) fired[today]={};

Object.keys(r).forEach(type=>{
if(r[type]===time && !fired[today][type]){
new Notification(type+" Reminder",{body:"Discipline > Mood"});
fired[today][type]=true;
setData("reminderFired",fired);
}
});
}

setInterval(checkReminders,150000);

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded",function(){
loadWorkout();
updateScore();
updateWeekly();
renderPRI();
renderMeasurement();
renderLatestMeasurement();
populateMeasurementForm();
populateRecoveryForm();
loadStrengthUpdate();
loadReminders();
updateDirectiveFromStorage();
Notification.requestPermission();
});