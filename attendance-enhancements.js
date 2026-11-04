/* UPS Attendance — documented absence reporting enhancement */
(function () {
  "use strict";
  var originalSubmit = window.submitAttendance;
  var originalAdminSave = window.saveAdminAttendance;
  var lastAbsentData = null;

  function text(s) { return String(s == null ? "" : s); }
  function esc(s) { return text(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function kind(v) {
    v=text(v).trim();
    if(!v) return "EMPTY";
    if(/^no updates? from parents?$/i.test(v)) return "NO_UPDATE";
    return "VALID";
  }
  function getFilters() {
    return {
      empty: !!document.getElementById("absenteeIncludeEmptyRemarks")?.checked,
      noUpdate: !!document.getElementById("absenteeIncludeNoUpdate")?.checked
    };
  }
  function makeModel(data) {
    var all=data.students || [], f=getFilters(), groups=new Map();
    all.forEach(function(s) {
      var key=s.classCode || s.className || "Unassigned";
      if(!groups.has(key)) groups.set(key,{name:s.className || key,all:[],shown:[]});
      var g=groups.get(key);
      g.all.push(s);
      if((f.empty || kind(s.remarks)!=="EMPTY") && (f.noUpdate || kind(s.remarks)!=="NO_UPDATE"))g.shown.push(s);
    });
    var sections=Array.from(groups.values()).sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true});});
    return {all:all,groups:sections,shown:sections.reduce(function(n,g){return n+g.shown.length;},0),filters:f};
  }
  function page(g,date) {
    var rows=g.shown.map(function(s,i) {
      return "<tr><td>"+(i+1)+"</td><td>"+esc(s.studentName)+"</td><td>"+esc(s.remarks || "—")+"</td></tr>";
    }).join("");
    return '<section class="ups-absent-page"><div class="ups-absent-title"><h2>UPS Daily Absentee Report</h2><div>'+esc(date)+'</div></div>'+
      '<h3>'+esc(g.name)+'</h3><p>Recorded absences: <b>'+g.all.length+'</b> &nbsp; | &nbsp; Filtered absences: <b>'+g.shown.length+
      '</b> &nbsp; | &nbsp; Excluded: <b>'+(g.all.length-g.shown.length)+'</b></p>'+
      '<table><thead><tr><th>#</th><th>Student Name</th><th>Remarks</th></tr></thead><tbody>'+
      (rows || '<tr><td colspan="3">No matching absences.</td></tr>')+'</tbody></table></section>';
  }
  function renderDaily(data) {
    lastAbsentData=data;
    var area=document.getElementById("absenteeReportArea");
    if(!area)return;
    var m=makeModel(data), date=data.displayDate || data.date || "";
    if(!m.all.length){area.innerHTML='<div class="empty-state">No absent students recorded for '+esc(date)+'.</div>';return;}
    area.innerHTML='<div class="ups-absent-totals"><b>Recorded absent: '+m.all.length+'</b><b>Filtered absent: '+m.shown+'</b><b>Excluded: '+(m.all.length-m.shown)+
      '</b><small>Empty remarks: '+(m.filters.empty?'Included':'Excluded')+' | No Update from Parents: '+(m.filters.noUpdate?'Included':'Excluded')+
      '. Excluded records are treated as present-equivalent in the filtered REPORT ONLY; database status stays absent.</small></div>'+
      m.groups.map(function(g){return page(g,date);}).join("");
  }
  function printDaily() {
    if(!lastAbsentData){window.showToast?.("Load a date before printing.",true);return;}
    var m=makeModel(lastAbsentData);
    if(!m.all.length){window.showToast?.("No absentee records to print.",true);return;}
    var w=window.open("","_blank");
    if(!w){window.showToast?.("Allow pop-ups to print the report.",true);return;}
    var date=lastAbsentData.displayDate || lastAbsentData.date || "";
    var summary="Filtered absent: "+m.shown+" / Recorded absent: "+m.all.length+" | Empty remarks: "+
      (m.filters.empty?"Included":"Excluded")+" | No Update from Parents: "+(m.filters.noUpdate?"Included":"Excluded");
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>UPS Daily Absentee Report</title><style>'+
      '@page{size:A4 portrait;margin:12mm}body{font:11px Arial,sans-serif;color:#222;margin:0}'+
      '.ups-absent-page{break-after:page;page-break-after:always;break-inside:avoid;page-break-inside:avoid}'+
      '.ups-absent-page:last-child{break-after:auto;page-break-after:auto}'+
      '.ups-absent-title h2{font-size:16px;margin:0}.ups-absent-title{margin-bottom:16px}'+
      '.ups-absent-title div{color:#555;margin-top:4px}.ups-absent-page h3{font-size:17px;border-bottom:2px solid #62418e;padding-bottom:7px;margin:0 0 6px}'+
      '.ups-absent-page p{margin:0 0 14px}table{width:100%;border-collapse:collapse;table-layout:fixed}'+
      'th,td{border:1px solid #bbb;padding:6px;text-align:left;overflow-wrap:anywhere}th{background:#eee}'+
      'th:first-child{width:25px}th:last-child{width:34%}.print-note{font-size:10px;color:#555;margin-bottom:14px}'+
      '</style></head><body><div class="print-note">'+esc(summary)+'</div>'+
      m.groups.map(function(g){return page(g,date);}).join("")+'</body></html>');
    w.document.close();
    w.focus();
    setTimeout(function(){w.print();},300);
  }

  /* New reason picker reuses the original text input and its existing change handler. */
  function enhanceTable(rootSelector, data) {
    var root=document.querySelector(rootSelector);
    if(!root || !Array.isArray(data)) return;
    var admin=rootSelector==="#classDetailBody";
    var inputClass=admin?".admin-attendance-remarks":".attendance-remarks";
    var statusClass=admin?".admin-attendance-status":".attendance-status";
    Array.from(root.querySelectorAll("tr")).forEach(function(row,index){
      var old=row.querySelector(inputClass),status=row.querySelector(statusClass),student=data[index];
      if(!old || !status || !student || row.querySelector(".ups-absence-select"))return;
      var existing=text(old.value).trim();
      var select=document.createElement("select");
      select.className="ups-absence-select";
      select.innerHTML='<option value="">Select a reason</option><option value="Sick">Sick</option>'+
        '<option value="Travel">Travel</option><option value="No Update from Parents">No Update from Parents</option>'+
        '<option value="Others">Others</option>';
      var isDefault=["Sick","Travel","No Update from Parents"].some(function(v){return v.toLowerCase()===existing.toLowerCase();});
      select.value=isDefault ? (existing.toLowerCase().startsWith("no update")?"No Update from Parents":existing.charAt(0).toUpperCase()+existing.slice(1).toLowerCase()) :
        existing ? "Others" : "";
      if(select.value==="Others") old.value=existing.replace(/^Others:\s*/i,"");
      old.placeholder="Specify other reason";
      old.style.display=select.value==="Others"?"block":"none";
      row.querySelector("td:last-child").insertBefore(select,old);
      function sync() {
        var required=status.value==="ABSENT";
        select.required=required;
        old.required=required && select.value==="Others";
        old.style.display=select.value==="Others"?"block":"none";
        var reason=select.value==="Others" ? (old.value.trim() ? "Others: "+old.value.trim() : "") : select.value;
        student.remarks=reason;
      }
      select.addEventListener("change",sync);
      old.addEventListener("input",sync);
      status.addEventListener("change",sync);
      select.required=status.value==="ABSENT";
      old.required=status.value==="ABSENT" && select.value==="Others";
    });
  }
  function valid(data) {
    if(!Array.isArray(data))return true;
    var missing=data.find(function(s){
      return s.status==="ABSENT" && (!text(s.remarks).trim() || /^Others:\s*$/i.test(s.remarks));
    });
    if(!missing)return true;
    window.showToast?.("Select an absence reason for "+text(missing.studentName)+". For Others, enter a reason.",true);
    return false;
  }
  var prevTeacherRender=window.renderTeacherAttendance;
  var prevAdminRender=window.renderAdminClassEditTable;
  window.renderTeacherAttendance=function(){
    var result=prevTeacherRender.apply(this,arguments);
    enhanceTable("#teacherAttendanceBody",teacherAttendanceData);
    return result;
  };
  window.renderAdminClassEditTable=function(){
    var result=prevAdminRender.apply(this,arguments);
    enhanceTable("#classDetailBody",adminClassEditData);
    return result;
  };
  window.submitAttendance=function(){
    if(!valid(teacherAttendanceData))return;
    return originalSubmit.apply(this,arguments);
  };
  window.saveAdminAttendance=function(){
    if(!valid(adminClassEditData))return;
    return originalAdminSave.apply(this,arguments);
  };
  window.renderAbsentReport=renderDaily;
  window.printAbsentReport=printDaily;


  // Shared controls for ADMIN and TEACHER date-range attendance reports.
  function addDateRangeFilters() {
    ["admin", "teacher"].forEach(function(role) {
      var section=document.getElementById(role+"AttendanceReportSection");
      var controls=document.getElementById(role+"ReportStartDate")?.closest(".report-controls");
      if(!controls || controls.querySelector(".ups-range-filter-panel"))return;
      var wrapper=document.createElement("div");
      wrapper.className="ups-range-filter-panel";
      wrapper.innerHTML='<strong>Absence Reason Filters (Date-Range Report)</strong>'+
        '<label><input type="checkbox" class="ups-range-empty"> Include empty remarks</label>'+
        '<label><input type="checkbox" class="ups-range-no-update"> Include "No Update from Parents"</label>'+
        '<small>Unchecked absences count as present-equivalent in this summary only. The original records remain absent.</small>';
      controls.insertAdjacentElement("afterend",wrapper);
      var empty=wrapper.querySelector(".ups-range-empty");
      var noUpdate=wrapper.querySelector(".ups-range-no-update");
      // Both report views share global checkbox state, but only the active report's
      // values are relevant when the Generate button is clicked.
      empty.checked=!!document.getElementById("reportIncludeEmptyRemarks")?.checked;
      noUpdate.checked=!!document.getElementById("reportIncludeNoUpdate")?.checked;
      function changed() {
        document.getElementById("reportIncludeEmptyRemarks").checked=empty.checked;
        document.getElementById("reportIncludeNoUpdate").checked=noUpdate.checked;
        document.getElementById(role+"PrintReportButton").disabled=true;
        document.getElementById(role+"ReportMessage").textContent="Filters changed. Generate the report again to refresh all figures.";
        document.querySelectorAll(".ups-range-empty").forEach(function(el){el.checked=empty.checked;});
        document.querySelectorAll(".ups-range-no-update").forEach(function(el){el.checked=noUpdate.checked;});
      }
      empty.addEventListener("change",changed);
      noUpdate.addEventListener("change",changed);
    });
  }
  function updateDateRangeNotice(role, data) {
    var id=role==="admin"?"adminReportSummary":"teacherReportSummary";
    var target=document.getElementById(id);
    if(!target)return;
    var old=document.getElementById(role+"RangeFilterNotice");
    if(old)old.remove();
    var s=data.summary||{};
    var note=document.createElement("div");
    note.className="ups-range-summary";
    note.id=role+"RangeFilterNotice";
    note.innerHTML="<strong>Recorded absences: "+(s.originalAbsent ?? s.absent ?? 0)+
      "</strong><strong>Filtered absences: "+(s.absent || 0)+
      "</strong><strong>Excluded (present-equivalent for this report): "+((s.excludedEmptyAbsences || 0)+(s.excludedNoUpdateAbsences || 0))+
      "</strong><small>Empty remarks: "+(s.includeEmptyRemarks?"Included":"Excluded")+
      " | No Update from Parents: "+(s.includeNoUpdateFromParents?"Included":"Excluded")+"</small>";
    target.insertAdjacentElement("afterend",note);
  }
  var renderAdminRange=window.renderAdminAttendanceReport;
  var renderTeacherRange=window.renderTeacherAttendanceReport;
  window.renderAdminAttendanceReport=function(data){
    var out=renderAdminRange.apply(this,arguments);
    updateDateRangeNotice("admin",data);
    return out;
  };
  window.renderTeacherAttendanceReport=function(data){
    var out=renderTeacherRange.apply(this,arguments);
    updateDateRangeNotice("teacher",data);
    return out;
  };
  document.addEventListener("DOMContentLoaded",function(){
    ["reportIncludeEmptyRemarks","reportIncludeNoUpdate"].forEach(function(id){
      if(!document.getElementById(id)){
        var control=document.createElement("input");
        control.type="checkbox";control.id=id;control.hidden=true;
        document.body.appendChild(control);
      }
    });
    addDateRangeFilters();
    var panel=document.getElementById("absenteeReportArea");
    if(panel){
      var controls=document.createElement("div");
      controls.className="ups-absent-filters";
      controls.innerHTML='<label><input type="checkbox" id="absenteeIncludeEmptyRemarks"> Include empty remarks</label>'+
        '<label><input type="checkbox" id="absenteeIncludeNoUpdate"> Include "No Update from Parents"</label>'+
        '<small>Unchecked categories are excluded from filtered counts only. Saved attendance records stay unchanged.</small>';
      panel.before(controls);
      controls.addEventListener("change",function(){if(lastAbsentData)renderDaily(lastAbsentData);});
    }
    var style=document.createElement("style");
    style.textContent='.ups-absent-filters{display:flex;flex-wrap:wrap;gap:12px 24px;margin:12px 0;font-size:13px}'+
      '.ups-absent-filters label{display:flex;align-items:center;gap:6px}.ups-absent-filters small{width:100%;color:#666}'+
      '.ups-absent-totals{display:flex;gap:10px 20px;flex-wrap:wrap;background:#f4f0fa;padding:12px;margin-bottom:16px;border-radius:7px}'+
      '.ups-absent-totals small{width:100%;color:#555}.ups-absent-page{padding:16px;border:1px solid #ddd;border-radius:8px;margin-bottom:16px}'+
      '.ups-absent-title h2{margin:0;font-size:16px}.ups-absent-title{margin-bottom:12px}'+
      '.ups-absent-page h3{margin:0 0 6px;border-bottom:2px solid #62418e;padding-bottom:6px}'+
      '.ups-absent-page p{font-size:12px;margin:0 0 10px}.ups-absent-page table{width:100%;border-collapse:collapse}'+
      '.ups-absent-page th,.ups-absent-page td{padding:7px;border:1px solid #ddd;text-align:left}'+
      '.ups-absence-select{width:100%;padding:6px;margin-bottom:5px;border:1px solid #ccc;border-radius:5px}';
    style.textContent += '.ups-range-filter-panel{margin:12px 0 20px;padding:12px;background:#f6f2fb;border-radius:8px;display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:13px}'+
      '.ups-range-filter-panel label{display:flex;gap:6px;align-items:center}'+
      '.ups-range-filter-panel small{width:100%;color:#666}.ups-range-summary{display:flex;flex-wrap:wrap;gap:10px 20px;margin:12px 0 16px;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:13px}'+
      '.ups-range-summary small{width:100%;color:#666}';
    document.head.appendChild(style);
  });
})();