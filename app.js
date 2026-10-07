/* =========================================
   UPS DAILY ATTENDANCE
   Frontend Application
========================================= */

const API_URL =
  "https://gzfiekjubrdgixnfrwxx.supabase.co/functions/v1/attendance-api";


/* =========================================
   APPLICATION STATE
========================================= */

let currentUser = null;
let currentEmail = "";

let currentAdminDate = "";
let currentProfileStudentId = "";
let currentClassCode = "";

let teacherAttendanceData = [];

/* ADMIN ATTENDANCE EDIT STATE */
let adminAttendanceData = [];
let adminAttendanceEditing = false;
let currentClassDetailDate = "";


/* =========================================
   DOM READY
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  restoreSession();
});


/* =========================================
   EVENT BINDINGS
========================================= */

function bindEvents() {

  const loginButton =
    document.getElementById("loginButton");

  const loginEmail =
    document.getElementById("loginEmail");

  const logoutButton =
    document.getElementById("logoutButton");


  if (loginButton) {
    loginButton.addEventListener(
      "click",
      loginUser
    );
  }


  if (loginEmail) {
    loginEmail.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          loginUser();
        }
      }
    );
  }


  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      logoutUser
    );
  }


  /* ADMIN DATE CONTROLS */

  document
    .getElementById("adminPreviousDate")
    ?.addEventListener(
      "click",
      () => changeAdminDate(-1)
    );


  document
    .getElementById("adminNextDate")
    ?.addEventListener(
      "click",
      () => changeAdminDate(1)
    );


  document
    .getElementById("adminTodayButton")
    ?.addEventListener(
      "click",
      () => {
        currentAdminDate =
          getDubaiDate();

        document.getElementById(
          "adminDateInput"
        ).value =
          currentAdminDate;

        loadAdminDashboard(
          currentAdminDate
        );
      }
    );


  document
    .getElementById("adminDateInput")
    ?.addEventListener(
      "change",
      event => {

        currentAdminDate =
          event.target.value;

        loadAdminDashboard(
          currentAdminDate
        );

      }
    );


  /* SEARCH */

  document
    .getElementById("studentSearchButton")
    ?.addEventListener(
      "click",
      searchStudents
    );


  document
    .getElementById("studentSearchInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          searchStudents();
        }

      }
    );


  /* ABSENTEE REPORT */

  document
    .getElementById(
      "printAbsentReportButton"
    )
    ?.addEventListener(
      "click",
      printAbsentReport
    );


  /* TEACHER */

  document
    .getElementById(
      "markAllPresentButton"
    )
    ?.addEventListener(
      "click",
      markAllPresent
    );


  document
    .getElementById(
      "submitAttendanceButton"
    )
    ?.addEventListener(
      "click",
      submitAttendance
    );


  /* MODALS */

  document
    .getElementById(
      "closeStudentProfileModal"
    )
    ?.addEventListener(
      "click",
      closeStudentProfile
    );


  document
    .getElementById(
      "closeClassDetailModal"
    )
    ?.addEventListener(
      "click",
      closeClassDetail
    );


  /* ADMIN ATTENDANCE EDITING */

  document
    .getElementById(
      "adminEditAttendanceButton"
    )
    ?.addEventListener(
      "click",
      enableAdminAttendanceEditing
    );


  document
    .getElementById(
      "adminCancelAttendanceEditButton"
    )
    ?.addEventListener(
      "click",
      cancelAdminAttendanceEditing
    );


  document
    .getElementById(
      "adminSaveAttendanceButton"
    )
    ?.addEventListener(
      "click",
      saveAdminAttendance
    );


  document
    .getElementById(
      "profileApplyDateButton"
    )
    ?.addEventListener(
      "click",
      () => {

        if (
          currentProfileStudentId
        ) {

          loadStudentProfile(
            currentProfileStudentId
          );

        }

      }
    );


  /* CLICK OUTSIDE MODAL */

  document
    .getElementById(
      "studentProfileModal"
    )
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "studentProfileModal"
        ) {

          closeStudentProfile();

        }

      }
    );


  document
    .getElementById(
      "classDetailModal"
    )
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "classDetailModal"
        ) {

          closeClassDetail();

        }

      }
    );

}


/* =========================================
   API HELPER
========================================= */

async function apiRequest(payload) {

  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );


  let data;

  try {

    data =
      await response.json();

  }
  catch {

    throw new Error(
      "The server returned an invalid response."
    );

  }


  if (!response.ok) {

    throw new Error(
      data.message ||
      "The request failed."
    );

  }


  if (
    data.success === false
  ) {

    throw new Error(
      data.message ||
      "The request failed."
    );

  }


  return data;

}


/* =========================================
   LOGIN
========================================= */

async function loginUser() {

  const emailInput =
    document.getElementById(
      "loginEmail"
    );


  const message =
    document.getElementById(
      "loginMessage"
    );


  const button =
    document.getElementById(
      "loginButton"
    );


  const email =
    emailInput.value
      .trim()
      .toLowerCase();


  message.textContent = "";


  if (!email) {

    message.textContent =
      "Please enter your registered email.";

    return;

  }


  if (
    !isValidEmail(email)
  ) {

    message.textContent =
      "Please enter a valid email address.";

    return;

  }


  button.disabled = true;
  button.textContent =
    "Checking...";


  try {

    const result =
      await apiRequest({
        action: "login",
        email
      });


    if (
      !result.authorized
    ) {

      message.textContent =
        result.message ||
        "This email is not authorized.";

      return;

    }


    currentUser = result;
    currentEmail =
      result.email;


    sessionStorage.setItem(
      "upsAttendanceEmail",
      currentEmail
    );


    await openApplication();

  }
  catch (error) {

    message.textContent =
      error.message;

  }
  finally {

    button.disabled = false;
    button.textContent =
      "Continue";

  }

}


/* =========================================
   RESTORE SESSION
========================================= */

async function restoreSession() {

  const savedEmail =
    sessionStorage.getItem(
      "upsAttendanceEmail"
    );


  if (!savedEmail) {
    return;
  }


  showLoading(
    "Restoring session..."
  );


  try {

    const result =
      await apiRequest({
        action: "login",
        email: savedEmail
      });


    if (
      !result.authorized
    ) {

      sessionStorage.removeItem(
        "upsAttendanceEmail"
      );

      return;

    }


    currentUser = result;
    currentEmail =
      result.email;


    await openApplication();

  }
  catch (error) {

    console.error(error);

    sessionStorage.removeItem(
      "upsAttendanceEmail"
    );

  }
  finally {

    hideLoading();

  }

}


/* =========================================
   OPEN APPLICATION
========================================= */

async function openApplication() {

  document
    .getElementById("loginView")
    .classList.remove(
      "active-view"
    );


  document
    .getElementById("mainView")
    .classList.add(
      "active-view"
    );


  document.getElementById(
    "headerUserName"
  ).textContent =
    currentUser.name ||
    currentUser.email;


  document.getElementById(
    "headerUserRole"
  ).textContent =
    currentUser.role;


  document
    .getElementById("adminView")
    .classList.add("hidden");


  document
    .getElementById("teacherView")
    .classList.add("hidden");


  if (
    currentUser.role ===
    "ADMIN"
  ) {

    document
      .getElementById(
        "adminView"
      )
      .classList.remove(
        "hidden"
      );


    currentAdminDate =
      getDubaiDate();


    document.getElementById(
      "adminDateInput"
    ).value =
      currentAdminDate;


    await loadAdminDashboard(
      currentAdminDate
    );

  }
  else if (
    currentUser.role ===
    "TEACHER"
  ) {

    document
      .getElementById(
        "teacherView"
      )
      .classList.remove(
        "hidden"
      );


    await loadTeacherAttendance();

  }
  else {

    showToast(
      "Your account does not currently have dashboard access."
    );

  }

}


/* =========================================
   LOGOUT
========================================= */

function logoutUser() {

  sessionStorage.removeItem(
    "upsAttendanceEmail"
  );


  currentUser = null;
  currentEmail = "";


  document
    .getElementById(
      "mainView"
    )
    .classList.remove(
      "active-view"
    );


  document
    .getElementById(
      "loginView"
    )
    .classList.add(
      "active-view"
    );


  document.getElementById(
    "loginEmail"
  ).value = "";


  document.getElementById(
    "loginMessage"
  ).textContent = "";

}


/* =========================================
   ADMIN DASHBOARD
========================================= */

async function loadAdminDashboard(
  date
) {

  showLoading(
    "Loading dashboard..."
  );


  try {

    const data =
      await apiRequest({
        action:
          "get-admin-dashboard",

        email:
          currentEmail,

        date
      });


    if (
      data.authorized === false
    ) {

      throw new Error(
        data.message ||
        "Administrator access required."
      );

    }


    currentAdminDate =
      data.selectedDate;


    document.getElementById(
      "adminDateInput"
    ).value =
      data.selectedDate;


    renderAdminSummary(
      data
    );


    renderClassMonitor(
      data.classes || []
    );


    renderAttentionList(
      data
    );


    await loadAbsentStudents(
      data.selectedDate
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }
  finally {

    hideLoading();

  }

}


/* =========================================
   ADMIN SUMMARY
========================================= */

function renderAdminSummary(
  data
) {

  const summary =
    data.summary || {};


  setText(
    "kpiTotalClasses",
    summary.totalClasses || 0
  );


  setText(
    "kpiSubmissionProgress",
    `${summary.submissionPercentage || 0}%`
  );


  setText(
    "kpiRecordedStudents",
    summary.recordedStudents || 0
  );


  setText(
    "kpiAbsenteeRate",
    `${summary.absentPercentage || 0}%`
  );


  setText(
    "summaryPresent",
    summary.present || 0
  );


  setText(
    "summaryPresentPercent",
    `${summary.presentPercentage || 0}%`
  );


  setText(
    "summaryAbsent",
    summary.absent || 0
  );


  setText(
    "summaryAbsentPercent",
    `${summary.absentPercentage || 0}%`
  );


  setText(
    "summaryLate",
    summary.late || 0
  );


  setText(
    "summaryLatePercent",
    `${summary.latePercentage || 0}%`
  );


  setText(
    "summaryExcused",
    summary.excused || 0
  );


  setText(
    "summaryExcusedPercent",
    `${summary.excusedPercentage || 0}%`
  );


  setText(
    "submissionProgressText",
    `${summary.submitted || 0} of ${summary.totalClasses || 0} classes submitted`
  );


  document.getElementById(
    "submissionProgressBar"
  ).style.width =
    `${summary.submissionPercentage || 0}%`;


  setText(
    "distributionPresentText",
    `${summary.presentPercentage || 0}%`
  );


  setText(
    "distributionAbsentText",
    `${summary.absentPercentage || 0}%`
  );


  setText(
    "distributionLateText",
    `${summary.latePercentage || 0}%`
  );


  setText(
    "distributionExcusedText",
    `${summary.excusedPercentage || 0}%`
  );


  setWidth(
    "distributionPresentBar",
    summary.presentPercentage
  );


  setWidth(
    "distributionAbsentBar",
    summary.absentPercentage
  );


  setWidth(
    "distributionLateBar",
    summary.latePercentage
  );


  setWidth(
    "distributionExcusedBar",
    summary.excusedPercentage
  );

}


/* =========================================
   CLASS MONITOR
========================================= */

function renderClassMonitor(
  classes
) {

  const body =
    document.getElementById(
      "classMonitorBody"
    );


  body.innerHTML = "";


  if (!classes.length) {

    body.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="table-empty"
        >
          No class data available.
        </td>
      </tr>
    `;

    return;

  }


  classes.forEach(
    item => {

      const row =
        document.createElement(
          "tr"
        );


      row.classList.add(
        "clickable-row"
      );


      row.innerHTML = `
        <td>
          <strong>
            ${escapeHtml(
              item.className ||
              item.classCode
            )}
          </strong>
        </td>

        <td>
          ${item.enrolled || 0}
        </td>

        <td>
          ${item.recorded || 0}
        </td>

        <td>
          ${item.present || 0}
        </td>

        <td>
          ${item.absent || 0}
        </td>

        <td>
          ${item.late || 0}
        </td>

        <td>
          ${item.excused || 0}
        </td>

        <td>
          ${statusBadge(
            item.status
          )}
        </td>
      `;


      row.addEventListener(
        "click",
        () => {

          loadClassDetails(
            item.classCode,
            currentAdminDate
          );

        }
      );


      body.appendChild(row);

    }
  );

}


/* =========================================
   ATTENTION LIST
========================================= */

function renderAttentionList(
  data
) {

  const container =
    document.getElementById(
      "attentionList"
    );


  const summary =
    data.summary || {};


  const items = [];


  if (
    summary.pending > 0
  ) {

    items.push({
      title:
        "Pending Class Submissions",

      value:
        `${summary.pending} class${summary.pending === 1 ? "" : "es"}`
    });

  }


  if (
    summary.absent > 0
  ) {

    items.push({
      title:
        "Absent Students",

      value:
        `${summary.absent} student${summary.absent === 1 ? "" : "s"}`
    });

  }


  if (
    summary.late > 0
  ) {

    items.push({
      title:
        "Late Students",

      value:
        `${summary.late} student${summary.late === 1 ? "" : "s"}`
    });

  }


  if (
    summary.excused > 0
  ) {

    items.push({
      title:
        "Excused Students",

      value:
        `${summary.excused} student${summary.excused === 1 ? "" : "s"}`
    });

  }


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state">
        No items requiring attention.
      </div>
    `;

    return;

  }


  container.innerHTML =
    items
      .map(
        item => `
          <div class="attention-item">

            <strong>
              ${escapeHtml(
                item.title
              )}
            </strong>

            <span>
              ${escapeHtml(
                item.value
              )}
            </span>

          </div>
        `
      )
      .join("");

}


/* =========================================
   CHANGE ADMIN DATE
========================================= */

function changeAdminDate(
  numberOfDays
) {

  if (!currentAdminDate) {

    currentAdminDate =
      getDubaiDate();

  }


  const date =
    parseDateOnly(
      currentAdminDate
    );


  date.setDate(
    date.getDate() +
    numberOfDays
  );


  currentAdminDate =
    formatDateOnly(date);


  document.getElementById(
    "adminDateInput"
  ).value =
    currentAdminDate;


  loadAdminDashboard(
    currentAdminDate
  );

}


/* =========================================
   ABSENT STUDENTS
========================================= */

async function loadAbsentStudents(
  date
) {

  try {

    const data =
      await apiRequest({
        action:
          "get-absent-students",

        email:
          currentEmail,

        date
      });


    renderAbsentReport(
      data
    );

  }
  catch (error) {

    document.getElementById(
      "absenteeReportArea"
    ).innerHTML = `
      <div class="empty-state">
        ${escapeHtml(
          error.message
        )}
      </div>
    `;

  }

}


/* =========================================
   ABSENTEE REPORT
========================================= */

function renderAbsentReport(
  data
) {

  const area =
    document.getElementById(
      "absenteeReportArea"
    );


  const students =
    data.students || [];


  if (!students.length) {

    area.innerHTML = `
      <div class="empty-state">
        No absent students recorded for
        ${escapeHtml(
          data.displayDate ||
          data.date ||
          ""
        )}.
      </div>
    `;

    return;

  }


  const rows =
    students
      .map(
        (student, index) => `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHtml(
                student.studentName
              )}
            </td>

            <td>
              ${escapeHtml(
                student.className ||
                student.classCode
              )}
            </td>

            <td>
              ${escapeHtml(
                student.remarks || ""
              )}
            </td>

          </tr>
        `
      )
      .join("");


  area.innerHTML = `
    <div class="absentee-print-header">

      <h3>
        UPS Daily Absentee Report
      </h3>

      <p>
        ${escapeHtml(
          data.displayDate ||
          data.date ||
          ""
        )}
      </p>

    </div>

    <div class="table-wrapper">

      <table class="data-table">

        <thead>
          <tr>
            <th>#</th>
            <th>Student</th>
            <th>Class</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>

      </table>

    </div>
  `;

}


/* =========================================
   PRINT ABSENTEE REPORT
========================================= */

function printAbsentReport() {

  const content =
    document.getElementById(
      "absenteeReportArea"
    ).innerHTML;


  const printWindow =
    window.open(
      "",
      "_blank"
    );


  if (!printWindow) {

    showToast(
      "Please allow pop-ups to print the report.",
      true
    );

    return;

  }


  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>

      <title>
        UPS Absentee Report
      </title>

      <style>

        body {
          font-family:
            Arial,
            sans-serif;

          padding: 30px;

          color: #222;
        }

        h3 {
          margin-bottom: 5px;
        }

        p {
          color: #666;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th,
        td {
          border:
            1px solid #ccc;

          padding: 8px;

          text-align: left;

          font-size: 12px;
        }

        th {
          background: #f2f2f2;
        }

      </style>

    </head>

    <body>

      ${content}

    </body>
    </html>
  `);


  printWindow.document.close();


  printWindow.focus();


  setTimeout(
    () => {

      printWindow.print();

    },
    300
  );

}


/* =========================================
   TEACHER ATTENDANCE
========================================= */

async function loadTeacherAttendance() {

  showLoading(
    "Loading your class..."
  );


  try {

    const data =
      await apiRequest({
        action:
          "get-teacher-attendance",

        email:
          currentEmail
      });


    if (
      data.authorized === false
    ) {

      throw new Error(
        data.message ||
        "Teacher access required."
      );

    }


    teacherAttendanceData =
      data.students || [];


    setText(
      "teacherName",
      data.user?.name ||
      currentUser.name ||
      "-"
    );


    setText(
      "teacherClassName",
      data.className ||
      data.user?.classCode ||
      "-"
    );


    setText(
      "teacherStudentCount",
      teacherAttendanceData.length
    );


    setText(
      "teacherDateDisplay",
      data.date ||
      "Today's attendance"
    );


    setText(
      "teacherLastUpdated",
      data.lastUpdated ||
      data.submittedTime ||
      "Not submitted"
    );


    const statusElement =
      document.getElementById(
        "teacherSubmissionStatus"
      );


    if (
      data.alreadySubmitted
    ) {

      statusElement.textContent =
        "Submitted";

      statusElement.className =
        "status-badge submitted";

      document.getElementById(
        "submitAttendanceButton"
      ).textContent =
        "Update Attendance";

    }
    else {

      statusElement.textContent =
        "Pending";

      statusElement.className =
        "status-badge pending";

      document.getElementById(
        "submitAttendanceButton"
      ).textContent =
        "Submit Attendance";

    }


    renderTeacherAttendance();

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }
  finally {

    hideLoading();

  }

}


/* =========================================
   RENDER TEACHER ATTENDANCE
========================================= */

function renderTeacherAttendance() {

  const body =
    document.getElementById(
      "teacherAttendanceBody"
    );


  body.innerHTML = "";


  if (
    !teacherAttendanceData.length
  ) {

    body.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="table-empty"
        >
          No active students found
          for this class.
        </td>
      </tr>
    `;

    updateTeacherCounts();

    return;

  }


  teacherAttendanceData.forEach(
    (student, index) => {

      const row =
        document.createElement(
          "tr"
        );


      const options = [
        "PRESENT",
        "ABSENT",
        "LATE",
        "EXCUSED"
      ]
        .map(
          status => `
            <option
              value="${status}"
              ${
                student.status ===
                status
                  ? "selected"
                  : ""
              }
            >
              ${capitalize(status)}
            </option>
          `
        )
        .join("");


      row.innerHTML = `
        <td>
          ${index + 1}
        </td>

        <td>

          <button
            type="button"
            class="student-name-button"
          >
            ${escapeHtml(
              student.studentName
            )}
          </button>

        </td>

        <td>

          <select
            class="attendance-status"
            data-index="${index}"
          >
            ${options}
          </select>

        </td>

        <td>

          <input
            type="text"
            class="attendance-remarks"
            data-index="${index}"
            value="${escapeAttribute(
              student.remarks || ""
            )}"
            placeholder="Optional remarks"
          />

        </td>
      `;


      const nameButton =
        row.querySelector(
          ".student-name-button"
        );


      nameButton.addEventListener(
        "click",
        () => {

          openStudentProfile(
            student.studentId
          );

        }
      );


      const select =
        row.querySelector(
          ".attendance-status"
        );


      select.addEventListener(
        "change",
        event => {

          teacherAttendanceData[
            index
          ].status =
            event.target.value;


          updateTeacherCounts();

        }
      );


      const remarks =
        row.querySelector(
          ".attendance-remarks"
        );


      remarks.addEventListener(
        "input",
        event => {

          teacherAttendanceData[
            index
          ].remarks =
            event.target.value;

        }
      );


      body.appendChild(row);

    }
  );


  updateTeacherCounts();

}


/* =========================================
   TEACHER COUNTS
========================================= */

function updateTeacherCounts() {

  const counts = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0
  };


  teacherAttendanceData
    .forEach(
      student => {

        if (
          counts[
            student.status
          ] !== undefined
        ) {

          counts[
            student.status
          ]++;

        }

      }
    );


  setText(
    "teacherPresentCount",
    counts.PRESENT
  );


  setText(
    "teacherAbsentCount",
    counts.ABSENT
  );


  setText(
    "teacherLateCount",
    counts.LATE
  );


  setText(
    "teacherExcusedCount",
    counts.EXCUSED
  );

}


/* =========================================
   MARK ALL PRESENT
========================================= */

function markAllPresent() {

  teacherAttendanceData =
    teacherAttendanceData.map(
      student => ({
        ...student,
        status:
          "PRESENT"
      })
    );


  renderTeacherAttendance();


  showToast(
    "All students marked Present."
  );

}


/* =========================================
   SUBMIT ATTENDANCE
========================================= */

async function submitAttendance() {

  if (
    !teacherAttendanceData.length
  ) {

    showToast(
      "There are no students to submit.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "submitAttendanceButton"
    );


  const message =
    document.getElementById(
      "teacherSubmitMessage"
    );


  button.disabled = true;
  button.textContent =
    "Saving...";


  message.textContent = "";


  try {

    const attendance =
      teacherAttendanceData.map(
        student => ({
          studentId:
            student.studentId,

          status:
            student.status,

          remarks:
            student.remarks || ""
        })
      );


    const result =
      await apiRequest({
        action:
          "submit-attendance",

        email:
          currentEmail,

        attendance
      });


    message.style.color =
      "var(--success)";


    message.textContent =
      result.message ||
      "Attendance saved successfully.";


    showToast(
      result.message ||
      "Attendance saved successfully."
    );


    await loadTeacherAttendance();

  }
  catch (error) {

    message.style.color =
      "var(--danger)";


    message.textContent =
      error.message;


    showToast(
      error.message,
      true
    );

  }
  finally {

    button.disabled = false;

  }

}


/* =========================================
   SEARCH STUDENTS
========================================= */

async function searchStudents() {

  const input =
    document.getElementById(
      "studentSearchInput"
    );


  const container =
    document.getElementById(
      "studentSearchResults"
    );


  const searchText =
    input.value.trim();


  if (
    searchText.length < 2
  ) {

    container.innerHTML = `
      <div class="empty-state">
        Enter at least 2 characters.
      </div>
    `;

    return;

  }


  container.innerHTML = `
    <div class="empty-state">
      Searching...
    </div>
  `;


  try {

    const students =
      await apiRequest({
        action:
          "search-students",

        email:
          currentEmail,

        searchText
      });


    renderSearchResults(
      students
    );

  }
  catch (error) {

    container.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(
          error.message
        )}
      </div>
    `;

  }

}


/* =========================================
   SEARCH RESULTS
========================================= */

function renderSearchResults(
  students
) {

  const container =
    document.getElementById(
      "studentSearchResults"
    );


  if (
    !students.length
  ) {

    container.innerHTML = `
      <div class="empty-state">
        No matching students found.
      </div>
    `;

    return;

  }


  container.innerHTML = "";


  students.forEach(
    student => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "search-result-card";


      card.innerHTML = `
        <div>

          <strong>
            ${escapeHtml(
              student.studentName
            )}
          </strong>

          <span>
            ID:
            ${escapeHtml(
              student.studentId
            )}

            &nbsp;•&nbsp;

            ${escapeHtml(
              student.className ||
              student.classCode
            )}
          </span>

        </div>

        <button
          type="button"
          class="secondary-button"
        >
          View Profile
        </button>
      `;


      card
        .querySelector(
          "button"
        )
        .addEventListener(
          "click",
          () => {

            openStudentProfile(
              student.studentId
            );

          }
        );


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================
   STUDENT PROFILE
========================================= */

function openStudentProfile(
  studentId
) {

  currentProfileStudentId =
    studentId;


  const modal =
    document.getElementById(
      "studentProfileModal"
    );


  modal.classList.remove(
    "hidden"
  );


  const endDate =
    getDubaiDate();


  const end =
    parseDateOnly(
      endDate
    );


  const start =
    new Date(
      end.getFullYear(),
      end.getMonth(),
      1
    );


  document.getElementById(
    "profileStartDate"
  ).value =
    formatDateOnly(
      start
    );


  document.getElementById(
    "profileEndDate"
  ).value =
    endDate;


  loadStudentProfile(
    studentId
  );

}


/* =========================================
   LOAD STUDENT PROFILE
========================================= */

async function loadStudentProfile(
  studentId
) {

  showLoading(
    "Loading student profile..."
  );


  try {

    const startDate =
      document.getElementById(
        "profileStartDate"
      ).value;


    const endDate =
      document.getElementById(
        "profileEndDate"
      ).value;


    const data =
      await apiRequest({
        action:
          "get-student-profile",

        email:
          currentEmail,

        studentId,

        startDate,

        endDate
      });


    renderStudentProfile(
      data
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }
  finally {

    hideLoading();

  }

}


/* =========================================
   RENDER STUDENT PROFILE
========================================= */

function renderStudentProfile(
  data
) {

  const student =
    data.student || {};


  const summary =
    data.summary || {};


  setText(
    "profileStudentName",
    student.studentName || "-"
  );


  setText(
    "profileStudentId",
    student.studentId || "-"
  );


  setText(
    "profileClassName",
    student.className ||
    student.classCode ||
    "-"
  );


  setText(
    "profileAttendanceRate",
    `${summary.attendanceRate || 0}%`
  );


  setText(
    "profileStudentSubheading",
    `${student.grade || ""} ${student.section || ""}`.trim() ||
    "Attendance history"
  );


  setText(
    "profilePresentCount",
    summary.present || 0
  );


  setText(
    "profileAbsentCount",
    summary.absent || 0
  );


  setText(
    "profileLateCount",
    summary.late || 0
  );


  setText(
    "profileExcusedCount",
    summary.excused || 0
  );


  if (
    data.range
  ) {

    document.getElementById(
      "profileStartDate"
    ).value =
      data.range.startDate;


    document.getElementById(
      "profileEndDate"
    ).value =
      data.range.endDate;

  }


  const historyBody =
    document.getElementById(
      "studentHistoryBody"
    );


  const history =
    data.history || [];


  if (
    !history.length
  ) {

    historyBody.innerHTML = `
      <tr>
        <td
          colspan="3"
          class="table-empty"
        >
          No attendance history
          for this period.
        </td>
      </tr>
    `;

    return;

  }


  historyBody.innerHTML =
    history
      .map(
        record => `
          <tr>

            <td>
              ${escapeHtml(
                record.displayDate ||
                record.date
              )}
            </td>

            <td>
              ${statusBadge(
                record.status
              )}
            </td>

            <td>
              ${escapeHtml(
                record.remarks || ""
              )}
            </td>

          </tr>
        `
      )
      .join("");

}


/* =========================================
   CLOSE STUDENT PROFILE
========================================= */

function closeStudentProfile() {

  document
    .getElementById(
      "studentProfileModal"
    )
    .classList.add(
      "hidden"
    );


  currentProfileStudentId =
    "";

}


/* =========================================
   CLASS DETAILS
========================================= */

async function loadClassDetails(
  classCode,
  date
) {

  currentClassCode =
    classCode;

  currentClassDetailDate =
    date || currentAdminDate || getDubaiDate();

  adminAttendanceEditing = false;


  document
    .getElementById(
      "classDetailModal"
    )
    .classList.remove(
      "hidden"
    );


  showLoading(
    "Loading class details..."
  );


  try {

    const data =
      await apiRequest({
        action:
          "get-class-details",

        email:
          currentEmail,

        classCode,

        date
      });


    renderClassDetails(
      data
    );

  }
  catch (error) {

    closeClassDetail();


    showToast(
      error.message,
      true
    );

  }
  finally {

    hideLoading();

  }

}


/* =========================================
   RENDER CLASS DETAILS
========================================= */

function renderClassDetails(
  data
) {

  setText(
    "classDetailTitle",
    data.className ||
    data.classCode ||
    "Class Attendance"
  );


  setText(
    "classDetailDate",
    data.displayDate ||
    data.date ||
    "-"
  );


  currentClassDetailDate =
    data.date ||
    currentClassDetailDate ||
    currentAdminDate ||
    getDubaiDate();


  const summary =
    data.summary || {};


  setText(
    "classDetailEnrolled",
    summary.enrolled || 0
  );


  setText(
    "classDetailPresent",
    summary.present || 0
  );


  setText(
    "classDetailAbsent",
    summary.absent || 0
  );


  setText(
    "classDetailLate",
    summary.late || 0
  );


  adminAttendanceData =
    (data.students || []).map(
      student => ({
        ...student,
        status:
          String(
            student.status ||
            "PRESENT"
          )
            .trim()
            .toUpperCase(),

        remarks:
          student.remarks || ""
      })
    );


  adminAttendanceEditing = false;

  setAdminAttendanceEditMode(
    false
  );

  renderAdminClassAttendanceRows();

}


/* =========================================
   ADMIN CLASS ATTENDANCE ROWS
========================================= */

function renderAdminClassAttendanceRows() {

  const body =
    document.getElementById(
      "classDetailBody"
    );


  if (!body) {
    return;
  }


  if (
    !adminAttendanceData.length
  ) {

    body.innerHTML = `
      <tr>
        <td
          colspan="3"
          class="table-empty"
        >
          No active students found.
        </td>
      </tr>
    `;

    return;

  }


  body.innerHTML = "";


  adminAttendanceData.forEach(
    (student, index) => {

      const row =
        document.createElement(
          "tr"
        );


      const studentButton = `
        <button
          type="button"
          class="student-name-button"
          data-student-id="${escapeAttribute(
            student.studentId
          )}"
        >
          ${escapeHtml(
            student.studentName
          )}
        </button>
      `;


      if (
        adminAttendanceEditing
      ) {

        const options = [
          "PRESENT",
          "ABSENT",
          "LATE",
          "EXCUSED"
        ]
          .map(
            status => `
              <option
                value="${status}"
                ${
                  student.status === status
                    ? "selected"
                    : ""
                }
              >
                ${capitalize(status)}
              </option>
            `
          )
          .join("");


        row.innerHTML = `
          <td>
            ${studentButton}
          </td>

          <td>
            <select
              class="attendance-status admin-attendance-status"
              data-index="${index}"
            >
              ${options}
            </select>
          </td>

          <td>
            <input
              type="text"
              class="attendance-remarks admin-attendance-remarks"
              data-index="${index}"
              value="${escapeAttribute(
                student.remarks || ""
              )}"
              placeholder="Optional remarks"
            />
          </td>
        `;

      }
      else {

        row.innerHTML = `
          <td>
            ${studentButton}
          </td>

          <td>
            ${statusBadge(
              student.status
            )}
          </td>

          <td>
            ${escapeHtml(
              student.remarks || ""
            )}
          </td>
        `;

      }


      row
        .querySelector(
          ".student-name-button"
        )
        ?.addEventListener(
          "click",
          () => {

            openStudentProfile(
              student.studentId
            );

          }
        );


      if (
        adminAttendanceEditing
      ) {

        row
          .querySelector(
            ".admin-attendance-status"
          )
          ?.addEventListener(
            "change",
            event => {

              adminAttendanceData[
                index
              ].status =
                event.target.value;

              updateAdminClassCounts();

            }
          );


        row
          .querySelector(
            ".admin-attendance-remarks"
          )
          ?.addEventListener(
            "input",
            event => {

              adminAttendanceData[
                index
              ].remarks =
                event.target.value;

            }
          );

      }


      body.appendChild(
        row
      );

    }
  );


  updateAdminClassCounts();

}


/* =========================================
   ADMIN ATTENDANCE EDIT MODE
========================================= */

function setAdminAttendanceEditMode(
  editing
) {

  adminAttendanceEditing =
    editing;


  const editButton =
    document.getElementById(
      "adminEditAttendanceButton"
    );


  const saveButton =
    document.getElementById(
      "adminSaveAttendanceButton"
    );


  const cancelButton =
    document.getElementById(
      "adminCancelAttendanceEditButton"
    );


  const message =
    document.getElementById(
      "adminAttendanceEditMessage"
    );


  if (editButton) {
    editButton.classList.toggle(
      "hidden",
      editing
    );
  }


  if (saveButton) {
    saveButton.classList.toggle(
      "hidden",
      !editing
    );
  }


  if (cancelButton) {
    cancelButton.classList.toggle(
      "hidden",
      !editing
    );
  }


  if (message) {

    message.textContent =
      editing
        ? "Administrator edit mode is active."
        : "";

  }

}


/* =========================================
   ENABLE ADMIN ATTENDANCE EDITING
========================================= */

function enableAdminAttendanceEditing() {

  if (
    !currentUser ||
    currentUser.role !== "ADMIN"
  ) {

    showToast(
      "Administrator access required.",
      true
    );

    return;

  }


  if (
    !adminAttendanceData.length
  ) {

    showToast(
      "There are no students to edit.",
      true
    );

    return;

  }


  setAdminAttendanceEditMode(
    true
  );


  renderAdminClassAttendanceRows();

}


/* =========================================
   CANCEL ADMIN ATTENDANCE EDITING
========================================= */

async function cancelAdminAttendanceEditing() {

  if (
    !currentClassCode
  ) {

    setAdminAttendanceEditMode(
      false
    );

    return;

  }


  setAdminAttendanceEditMode(
    false
  );


  await loadClassDetails(
    currentClassCode,
    currentClassDetailDate ||
    currentAdminDate
  );

}


/* =========================================
   ADMIN CLASS COUNTS
========================================= */

function updateAdminClassCounts() {

  const counts = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0
  };


  adminAttendanceData.forEach(
    student => {

      const status =
        String(
          student.status || ""
        )
          .trim()
          .toUpperCase();


      if (
        counts[
          status
        ] !== undefined
      ) {

        counts[
          status
        ]++;

      }

    }
  );


  setText(
    "classDetailPresent",
    counts.PRESENT
  );


  setText(
    "classDetailAbsent",
    counts.ABSENT
  );


  setText(
    "classDetailLate",
    counts.LATE
  );

}


/* =========================================
   SAVE ADMIN ATTENDANCE
========================================= */

async function saveAdminAttendance() {

  if (
    !currentUser ||
    currentUser.role !== "ADMIN"
  ) {

    showToast(
      "Administrator access required.",
      true
    );

    return;

  }


  if (
    !currentClassCode
  ) {

    showToast(
      "No class is selected.",
      true
    );

    return;

  }


  if (
    !adminAttendanceData.length
  ) {

    showToast(
      "There are no students to save.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "adminSaveAttendanceButton"
    );


  const message =
    document.getElementById(
      "adminAttendanceEditMessage"
    );


  if (button) {

    button.disabled = true;
    button.textContent =
      "Saving...";

  }


  if (message) {

    message.textContent = "";

  }


  try {

    const attendance =
      adminAttendanceData.map(
        student => ({
          studentId:
            student.studentId,

          status:
            student.status,

          remarks:
            student.remarks || ""
        })
      );


    const result =
      await apiRequest({
        action:
          "admin-submit-attendance",

        email:
          currentEmail,

        classCode:
          currentClassCode,

        date:
          currentClassDetailDate ||
          currentAdminDate ||
          getDubaiDate(),

        attendance
      });


    if (message) {

      message.style.color =
        "var(--success)";

      message.textContent =
        result.message ||
        "Attendance saved by administrator.";

    }


    showToast(
      result.message ||
      "Attendance saved by administrator."
    );


    setAdminAttendanceEditMode(
      false
    );


    await loadAdminDashboard(
      currentAdminDate
    );


    await loadClassDetails(
      currentClassCode,
      currentClassDetailDate ||
      currentAdminDate
    );

  }
  catch (error) {

    if (message) {

      message.style.color =
        "var(--danger)";

      message.textContent =
        error.message;

    }


    showToast(
      error.message,
      true
    );

  }
  finally {

    if (button) {

      button.disabled = false;
      button.textContent =
        "Save Attendance";

    }

  }

}


/* =========================================
   CLOSE CLASS DETAIL
========================================= */

function closeClassDetail() {

  document
    .getElementById(
      "classDetailModal"
    )
    .classList.add(
      "hidden"
    );


  currentClassCode =
    "";

  currentClassDetailDate =
    "";

  adminAttendanceData = [];

  adminAttendanceEditing =
    false;

  setAdminAttendanceEditMode(
    false
  );

}


/* =========================================
   STATUS BADGE
========================================= */

function statusBadge(
  status
) {

  const cleanStatus =
    String(
      status || ""
    )
      .trim()
      .toUpperCase();


  const className =
    cleanStatus
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      );


  return `
    <span
      class="status-badge ${className}"
    >
      ${escapeHtml(
        cleanStatus ||
        "UNKNOWN"
      )}
    </span>
  `;

}


/* =========================================
   LOADING
========================================= */

function showLoading(
  text = "Loading..."
) {

  const overlay =
    document.getElementById(
      "loadingOverlay"
    );


  const label =
    document.getElementById(
      "loadingText"
    );


  label.textContent =
    text;


  overlay.classList.remove(
    "hidden"
  );

}


function hideLoading() {

  document
    .getElementById(
      "loadingOverlay"
    )
    .classList.add(
      "hidden"
    );

}


/* =========================================
   TOAST
========================================= */

let toastTimer = null;


function showToast(
  message,
  isError = false
) {

  const toast =
    document.getElementById(
      "toast"
    );


  toast.textContent =
    message;


  toast.style.background =
    isError
      ? "#9f3d47"
      : "#2e2c38";


  toast.classList.remove(
    "hidden"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      3200
    );

}


/* =========================================
   DATE HELPERS
========================================= */

function getDubaiDate() {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Dubai",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    )
      .formatToParts(
        new Date()
      );


  const map = {};


  parts.forEach(
    part => {

      map[
        part.type
      ] =
        part.value;

    }
  );


  return (
    `${map.year}-${map.month}-${map.day}`
  );

}


function parseDateOnly(
  value
) {

  const [
    year,
    month,
    day
  ] =
    value
      .split("-")
      .map(Number);


  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );

}


function formatDateOnly(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}


/* =========================================
   GENERAL HELPERS
========================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


function setWidth(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    const safeValue =
      Math.max(
        0,
        Math.min(
          100,
          Number(value) || 0
        )
      );


    element.style.width =
      `${safeValue}%`;

  }

}


function capitalize(
  value
) {

  const text =
    String(value || "")
      .toLowerCase();


  return (
    text.charAt(0)
      .toUpperCase() +
    text.slice(1)
  );

}


function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


/* =========================================
   HTML SAFETY
========================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}
