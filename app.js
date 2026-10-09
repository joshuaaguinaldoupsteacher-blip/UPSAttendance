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

let adminReportData = null;
let teacherReportData = null;

let adminClasses = [];

let currentClassData = null;
let adminClassEditMode = false;
let adminClassEditData = [];


/* =========================================
   PREFERRED CLASS ORDER
========================================= */

const CLASS_ORDER = [
  "KG1 Camel",
  "KG2 Oryx",
  "KG2 Falcon",
  "1 Abu Dhabi",
  "1 Al Ain",
  "2 Umm Al Quwain",
  "2 Ras Al Khaima",
  "3 Sharjah",
  "4 Fujaira",
  "5 Dubai",
  "6 Etihad",
  "7 Marina",
  "8 Hatta",
  "9 Oasis",
  "10 Jebel Hafeet",
  "11 Jebel Jais",
  "12 Jebel Ali"
];


/* =========================================
   DOM READY
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    bindEvents();

    initializeReportDates();

    restoreSession();

  }
);


/* =========================================
   EVENT BINDINGS
========================================= */

function bindEvents() {

  document
    .getElementById("loginButton")
    ?.addEventListener(
      "click",
      loginUser
    );


  document
    .getElementById("loginEmail")
    ?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          loginUser();
        }

      }
    );


  document
    .getElementById("logoutButton")
    ?.addEventListener(
      "click",
      logoutUser
    );


  /* =====================================
     ADMIN DATE CONTROLS
  ====================================== */

  document
    .getElementById(
      "adminPreviousDate"
    )
    ?.addEventListener(
      "click",
      () => changeAdminDate(-1)
    );


  document
    .getElementById(
      "adminNextDate"
    )
    ?.addEventListener(
      "click",
      () => changeAdminDate(1)
    );


  document
    .getElementById(
      "adminTodayButton"
    )
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
    .getElementById(
      "adminDateInput"
    )
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


  /* =====================================
     STUDENT SEARCH
  ====================================== */

  document
    .getElementById(
      "studentSearchButton"
    )
    ?.addEventListener(
      "click",
      searchStudents
    );


  document
    .getElementById(
      "studentSearchInput"
    )
    ?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          searchStudents();
        }

      }
    );


  /* =====================================
     ABSENTEE REPORT
  ====================================== */

  document
    .getElementById(
      "printAbsentReportButton"
    )
    ?.addEventListener(
      "click",
      printAbsentReport
    );


  /* =====================================
     TEACHER ATTENDANCE
  ====================================== */

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


  /* =====================================
     ADMIN ATTENDANCE EDITING
  ====================================== */

  document
    .getElementById(
      "adminEditAttendanceButton"
    )
    ?.addEventListener(
      "click",
      startAdminAttendanceEdit
    );


  document
    .getElementById(
      "adminMarkAllPresentButton"
    )
    ?.addEventListener(
      "click",
      adminMarkAllPresent
    );


  document
    .getElementById(
      "adminCancelEditButton"
    )
    ?.addEventListener(
      "click",
      cancelAdminAttendanceEdit
    );


  document
    .getElementById(
      "adminSaveAttendanceButton"
    )
    ?.addEventListener(
      "click",
      saveAdminAttendance
    );


  /* =====================================
     ADMIN ATTENDANCE REPORT
  ====================================== */

  document
    .getElementById(
      "adminGenerateReportButton"
    )
    ?.addEventListener(
      "click",
      generateAdminAttendanceReport
    );


  document
    .getElementById(
      "adminPrintReportButton"
    )
    ?.addEventListener(
      "click",
      () => printAttendanceReport(
        "ADMIN"
      )
    );


  /* =====================================
     TEACHER ATTENDANCE REPORT
  ====================================== */

  document
    .getElementById(
      "teacherGenerateReportButton"
    )
    ?.addEventListener(
      "click",
      generateTeacherAttendanceReport
    );


  document
    .getElementById(
      "teacherPrintReportButton"
    )
    ?.addEventListener(
      "click",
      () => printAttendanceReport(
        "TEACHER"
      )
    );


  /* =====================================
     MODALS
  ====================================== */

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


  document
    .getElementById(
      "profileApplyDateButton"
    )
    ?.addEventListener(
      "click",
      () => {

        if (currentProfileStudentId) {

          loadStudentProfile(
            currentProfileStudentId
          );

        }

      }
    );


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

async function apiRequest(
  payload
) {

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


  if (!isValidEmail(email)) {

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


    if (!result.authorized) {

      message.textContent =
        result.message ||
        "This email is not authorized.";

      return;

    }


    currentUser =
      result;


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

    button.disabled =
      false;


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

        action:
          "login",

        email:
          savedEmail

      });


    if (!result.authorized) {

      sessionStorage.removeItem(
        "upsAttendanceEmail"
      );

      return;

    }


    currentUser =
      result;


    currentEmail =
      result.email;


    await openApplication();

  }
  catch (error) {

    console.error(
      error
    );


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
    .getElementById(
      "loginView"
    )
    .classList.remove(
      "active-view"
    );


  document
    .getElementById(
      "mainView"
    )
    .classList.add(
      "active-view"
    );


  setText(
    "headerUserName",
    currentUser.name ||
    currentUser.email
  );


  setText(
    "headerUserRole",
    currentUser.role
  );


  document
    .getElementById(
      "adminView"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "teacherView"
    )
    .classList.add(
      "hidden"
    );


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

  teacherAttendanceData = [];

  adminReportData = null;

  teacherReportData = null;

  currentClassData = null;

  adminClassEditData = [];

  adminClassEditMode = false;


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
      data.authorized ===
      false
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


    const sortedClasses =
      sortClasses(
        data.classes || []
      );


    renderAdminSummary(
      data
    );


    renderClassMonitor(
      sortedClasses
    );


    renderAttentionList(
      data
    );


    populateAdminReportClassDropdown(
      sortedClasses
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
   CLASS SORTING
========================================= */

function sortClasses(
  classes
) {

  return [
    ...(classes || [])
  ].sort(
    (a, b) => {

      const aName =
        normalizeClassName(
          a.className ||
          a.classCode
        );


      const bName =
        normalizeClassName(
          b.className ||
          b.classCode
        );


      const aIndex =
        CLASS_ORDER.findIndex(
          item =>
            normalizeClassName(item) ===
            aName
        );


      const bIndex =
        CLASS_ORDER.findIndex(
          item =>
            normalizeClassName(item) ===
            bName
        );


      const safeA =
        aIndex === -1
          ? 999
          : aIndex;


      const safeB =
        bIndex === -1
          ? 999
          : bIndex;


      if (safeA !== safeB) {

        return safeA - safeB;

      }


      return aName.localeCompare(
        bName
      );

    }
  );

}


function normalizeClassName(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toLowerCase();

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


  setWidth(
    "submissionProgressBar",
    summary.submissionPercentage
  );


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


  const sortedClasses =
    sortClasses(
      classes
    );


  sortedClasses.forEach(
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


      body.appendChild(
        row
      );

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
    formatDateOnly(
      date
    );


  document.getElementById(
    "adminDateInput"
  ).value =
    currentAdminDate;


  loadAdminDashboard(
    currentAdminDate
  );

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


  adminClassEditMode =
    false;


  adminClassEditData =
    [];


  resetAdminEditButtons();


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


    currentClassData =
      data;


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


  renderAdminClassReadOnly(
    data.students || []
  );

}


/* =========================================
   ADMIN CLASS READ-ONLY VIEW
========================================= */

function renderAdminClassReadOnly(
  students
) {

  const body =
    document.getElementById(
      "classDetailBody"
    );


  body.innerHTML = "";


  if (!students.length) {

    body.innerHTML = `
      <tr>

        <td
          colspan="4"
          class="table-empty"
        >
          No active students found.
        </td>

      </tr>
    `;

    return;

  }


  students.forEach(
    (
      student,
      index
    ) => {

      const row =
        document.createElement(
          "tr"
        );


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
          ${statusBadge(
            student.status
          )}
        </td>

        <td>
          ${escapeHtml(
            student.remarks ||
            ""
          )}
        </td>

      `;


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


      body.appendChild(
        row
      );

    }
  );

}


/* =========================================
   START ADMIN EDIT
========================================= */

function startAdminAttendanceEdit() {

  if (!currentClassData) {

    showToast(
      "No class data is loaded.",
      true
    );

    return;

  }


  adminClassEditMode =
    true;


  adminClassEditData =
    (
      currentClassData.students ||
      []
    ).map(
      student => ({

        studentId:
          student.studentId,

        studentName:
          student.studentName,

        status:
          normalizeEditableStatus(
            student.status
          ),

        remarks:
          student.remarks ||
          ""

      })
    );


  document
    .getElementById(
      "adminEditAttendanceButton"
    )
    ?.classList.add(
      "hidden"
    );


  document
    .getElementById(
      "adminMarkAllPresentButton"
    )
    ?.classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "adminCancelEditButton"
    )
    ?.classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "adminSaveAttendanceButton"
    )
    ?.classList.remove(
      "hidden"
    );


  setText(
    "adminClassEditHint",
    "You are editing attendance for this class and selected date."
  );


  setText(
    "adminClassEditMessage",
    ""
  );


  renderAdminClassEditTable();

}


/* =========================================
   ADMIN EDIT TABLE
========================================= */

function renderAdminClassEditTable() {

  const body =
    document.getElementById(
      "classDetailBody"
    );


  body.innerHTML = "";


  if (!adminClassEditData.length) {

    body.innerHTML = `
      <tr>

        <td
          colspan="4"
          class="table-empty"
        >
          No active students found.
        </td>

      </tr>
    `;

    return;

  }


  adminClassEditData.forEach(
    (
      student,
      index
    ) => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          <strong>
            ${escapeHtml(
              student.studentName
            )}
          </strong>
        </td>

        <td>

          <select
            class="admin-attendance-status"
            data-index="${index}"
          >

            ${attendanceOptions(
              student.status
            )}

          </select>

        </td>

        <td>

          <input
            type="text"
            class="admin-attendance-remarks"
            data-index="${index}"
            value="${escapeAttribute(
              student.remarks ||
              ""
            )}"
            placeholder="Optional remarks"
          >

        </td>

      `;


      row
        .querySelector(
          ".admin-attendance-status"
        )
        ?.addEventListener(
          "change",
          event => {

            adminClassEditData[
              index
            ].status =
              event.target.value;


            updateAdminEditSummary();

          }
        );


      row
        .querySelector(
          ".admin-attendance-remarks"
        )
        ?.addEventListener(
          "input",
          event => {

            adminClassEditData[
              index
            ].remarks =
              event.target.value;

          }
        );


      body.appendChild(
        row
      );

    }
  );


  updateAdminEditSummary();

}


/* =========================================
   ATTENDANCE OPTIONS
========================================= */

function attendanceOptions(
  selectedStatus
) {

  const statuses = [
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED"
  ];


  return statuses
    .map(
      status => `
        <option
          value="${status}"
          ${
            selectedStatus === status
              ? "selected"
              : ""
          }
        >
          ${capitalize(status)}
        </option>
      `
    )
    .join("");

}


/* =========================================
   NORMALIZE ADMIN STATUS
========================================= */

function normalizeEditableStatus(
  status
) {

  const value =
    String(
      status || ""
    )
      .trim()
      .toUpperCase();


  if (
    value === "PRESENT" ||
    value === "ABSENT" ||
    value === "LATE" ||
    value === "EXCUSED"
  ) {

    return value;

  }


  /*
    If attendance has never been recorded,
    initialize it as PRESENT when ADMIN enters
    edit mode.

    ADMIN can change it before saving.
  */

  return "PRESENT";

}


/* =========================================
   ADMIN EDIT COUNTS
========================================= */

function updateAdminEditSummary() {

  let present = 0;
  let absent = 0;
  let late = 0;


  adminClassEditData.forEach(
    student => {

      if (
        student.status ===
        "PRESENT"
      ) {
        present++;
      }
      else if (
        student.status ===
        "ABSENT"
      ) {
        absent++;
      }
      else if (
        student.status ===
        "LATE"
      ) {
        late++;
      }

    }
  );


  setText(
    "classDetailEnrolled",
    adminClassEditData.length
  );


  setText(
    "classDetailPresent",
    present
  );


  setText(
    "classDetailAbsent",
    absent
  );


  setText(
    "classDetailLate",
    late
  );

}


/* =========================================
   ADMIN MARK ALL PRESENT
========================================= */

function adminMarkAllPresent() {

  if (!adminClassEditMode) {
    return;
  }


  adminClassEditData =
    adminClassEditData.map(
      student => ({

        ...student,

        status:
          "PRESENT"

      })
    );


  renderAdminClassEditTable();


  showToast(
    "All students marked Present."
  );

}


/* =========================================
   CANCEL ADMIN EDIT
========================================= */

function cancelAdminAttendanceEdit() {

  adminClassEditMode =
    false;


  adminClassEditData =
    [];


  resetAdminEditButtons();


  if (
    currentClassData
  ) {

    renderClassDetails(
      currentClassData
    );

  }

}


/* =========================================
   RESET ADMIN EDIT BUTTONS
========================================= */

function resetAdminEditButtons() {

  document
    .getElementById(
      "adminEditAttendanceButton"
    )
    ?.classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "adminMarkAllPresentButton"
    )
    ?.classList.add(
      "hidden"
    );


  document
    .getElementById(
      "adminCancelEditButton"
    )
    ?.classList.add(
      "hidden"
    );


  document
    .getElementById(
      "adminSaveAttendanceButton"
    )
    ?.classList.add(
      "hidden"
    );


  setText(
    "adminClassEditHint",
    "View attendance or switch to edit mode."
  );


  setText(
    "adminClassEditMessage",
    ""
  );

}


/* =========================================
   SAVE ADMIN ATTENDANCE
========================================= */

async function saveAdminAttendance() {

  if (
    !adminClassEditMode ||
    !currentClassCode ||
    !adminClassEditData.length
  ) {

    showToast(
      "No attendance data is available to save.",
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
      "adminClassEditMessage"
    );


  button.disabled =
    true;


  button.textContent =
    "Saving...";


  message.textContent =
    "";


  try {

    const attendance =
      adminClassEditData.map(
        student => ({

          studentId:
            student.studentId,

          status:
            student.status,

          remarks:
            student.remarks ||
            ""

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
          currentAdminDate,

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


    adminClassEditMode =
      false;


    adminClassEditData =
      [];


    resetAdminEditButtons();


    /*
      Refresh dashboard first so the KPIs,
      submission status, and class monitor
      reflect the saved attendance.
    */

    await loadAdminDashboard(
      currentAdminDate
    );


    /*
      Then reload this class so ADMIN sees
      the newly saved records immediately.
    */

    await reloadCurrentClassDetails();

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

    button.disabled =
      false;


    button.textContent =
      "Save Attendance";

  }

}


/* =========================================
   RELOAD CURRENT CLASS
========================================= */

async function reloadCurrentClassDetails() {

  if (!currentClassCode) {
    return;
  }


  showLoading(
    "Refreshing class attendance..."
  );


  try {

    const data =
      await apiRequest({

        action:
          "get-class-details",

        email:
          currentEmail,

        classCode:
          currentClassCode,

        date:
          currentAdminDate

      });


    currentClassData =
      data;


    renderClassDetails(
      data
    );


    document
      .getElementById(
        "classDetailModal"
      )
      ?.classList.remove(
        "hidden"
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


  currentClassCode = "";

  currentClassData = null;

  adminClassEditMode = false;

  adminClassEditData = [];


  resetAdminEditButtons();

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
        (
          student,
          index
        ) => `
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
                student.remarks ||
                ""
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

          padding:
            30px;

          color:
            #222;
        }

        h3 {
          margin-bottom:
            5px;
        }

        p {
          color:
            #666;
        }

        table {
          width:
            100%;

          border-collapse:
            collapse;

          margin-top:
            20px;
        }

        th,
        td {
          border:
            1px solid
            #ccc;

          padding:
            8px;

          text-align:
            left;

          font-size:
            12px;
        }

        th {
          background:
            #f2f2f2;
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
      data.authorized ===
      false
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
    (
      student,
      index
    ) => {

      const row =
        document.createElement(
          "tr"
        );


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

            ${attendanceOptions(
              student.status
            )}

          </select>

        </td>

        <td>

          <input
            type="text"
            class="attendance-remarks"
            data-index="${index}"
            value="${escapeAttribute(
              student.remarks ||
              ""
            )}"
            placeholder="Optional remarks"
          >

        </td>

      `;


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


      row
        .querySelector(
          ".attendance-status"
        )
        ?.addEventListener(
          "change",
          event => {

            teacherAttendanceData[
              index
            ].status =
              event.target.value;


            updateTeacherCounts();

          }
        );


      row
        .querySelector(
          ".attendance-remarks"
        )
        ?.addEventListener(
          "input",
          event => {

            teacherAttendanceData[
              index
            ].remarks =
              event.target.value;

          }
        );


      body.appendChild(
        row
      );

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


  teacherAttendanceData.forEach(
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
   SUBMIT TEACHER ATTENDANCE
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


  button.disabled =
    true;


  button.textContent =
    "Saving...";


  message.textContent =
    "";


  try {

    const attendance =
      teacherAttendanceData.map(
        student => ({

          studentId:
            student.studentId,

          status:
            student.status,

          remarks:
            student.remarks ||
            ""

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

    button.disabled =
      false;

  }

}


/* =========================================
   ADMIN REPORT CLASS DROPDOWN
========================================= */

function populateAdminReportClassDropdown(
  classes
) {

  adminClasses =
    sortClasses(
      classes || []
    );


  const select =
    document.getElementById(
      "adminReportClass"
    );


  if (!select) {
    return;
  }


  const previousValue =
    select.value ||
    "ALL";


  select.innerHTML = `
    <option value="ALL">
      All Classes
    </option>
  `;


  adminClasses.forEach(
    item => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        item.classCode;


      option.textContent =
        item.className ||
        item.classCode;


      select.appendChild(
        option
      );

    }
  );


  if (
    Array.from(
      select.options
    ).some(
      option =>
        option.value ===
        previousValue
    )
  ) {

    select.value =
      previousValue;

  }

}


/* =========================================
   INITIALIZE REPORT DATES
========================================= */

function initializeReportDates() {

  const today =
    getDubaiDate();


  const currentDate =
    parseDateOnly(
      today
    );


  const firstDay =
    new Date(

      currentDate.getFullYear(),

      currentDate.getMonth(),

      1

    );


  const firstDayString =
    formatDateOnly(
      firstDay
    );


  setDateInput(
    "adminReportStartDate",
    firstDayString
  );


  setDateInput(
    "adminReportEndDate",
    today
  );


  setDateInput(
    "teacherReportStartDate",
    firstDayString
  );


  setDateInput(
    "teacherReportEndDate",
    today
  );

}


/* =========================================
   ADMIN ATTENDANCE REPORT
========================================= */

async function generateAdminAttendanceReport() {

  const startDate =
    document.getElementById(
      "adminReportStartDate"
    ).value;


  const endDate =
    document.getElementById(
      "adminReportEndDate"
    ).value;


  const classCode =
    document.getElementById(
      "adminReportClass"
    ).value ||
    "ALL";


  const message =
    document.getElementById(
      "adminReportMessage"
    );


  const button =
    document.getElementById(
      "adminGenerateReportButton"
    );


  message.textContent = "";


  if (
    !validateReportDates(
      startDate,
      endDate,
      message
    )
  ) {
    return;
  }


  button.disabled =
    true;


  button.textContent =
    "Generating...";


  showLoading(
    "Generating attendance report..."
  );


  try {

    const data =
      await apiRequest({

        action:
          "get-attendance-report",

        email:
          currentEmail,

        startDate,

        endDate,

        classCode

      });


    adminReportData =
      data;


    renderAdminAttendanceReport(
      data
    );


    document.getElementById(
      "adminPrintReportButton"
    ).disabled =
      false;


    showToast(
      "Attendance report generated."
    );

  }
  catch (error) {

    adminReportData =
      null;


    document.getElementById(
      "adminPrintReportButton"
    ).disabled =
      true;


    message.textContent =
      error.message;


    showToast(
      error.message,
      true
    );

  }
  finally {

    button.disabled =
      false;


    button.textContent =
      "Generate Report";


    hideLoading();

  }

}


/* =========================================
   RENDER ADMIN REPORT
========================================= */

function renderAdminAttendanceReport(
  data
) {

  const summary =
    data.summary || {};


  [
    "adminReportHeader",
    "adminReportSummary",
    "adminReportStatusSummary",
    "adminReportClassSummaryArea",
    "adminReportStudentArea"
  ].forEach(
    id => {

      document
        .getElementById(id)
        ?.classList.remove(
          "hidden"
        );

    }
  );


  setText(
    "adminReportTitle",
    `${data.scope?.className || "Attendance"} Report`
  );


  setText(
    "adminReportPeriod",
    `${data.range?.startDisplay || data.range?.startDate || ""} to ${data.range?.endDisplay || data.range?.endDate || ""}`
  );


  setText(
    "adminReportStudents",
    summary.totalStudents || 0
  );


  setText(
    "adminReportRecordedDates",
    summary.recordedDates || 0
  );


  setText(
    "adminReportTotalRecords",
    summary.totalRecords || 0
  );


  setText(
    "adminReportAttendanceRate",
    `${summary.attendanceRate || 0}%`
  );


  setText(
    "adminReportPresent",
    summary.present || 0
  );


  setText(
    "adminReportAbsent",
    summary.absent || 0
  );


  setText(
    "adminReportLate",
    summary.late || 0
  );


  setText(
    "adminReportExcused",
    summary.excused || 0
  );


  renderAdminClassSummary(
    data.classSummaries || []
  );


  renderAdminStudentSummary(
    data.students || []
  );

}


/* =========================================
   ADMIN CLASS SUMMARY
========================================= */

function renderAdminClassSummary(
  classes
) {

  const body =
    document.getElementById(
      "adminReportClassSummaryBody"
    );


  const sortedClasses =
    sortClasses(
      classes || []
    );


  if (!sortedClasses.length) {

    body.innerHTML = `
      <tr>

        <td
          colspan="7"
          class="table-empty"
        >
          No class records found
          for the selected period.
        </td>

      </tr>
    `;

    return;

  }


  body.innerHTML =
    sortedClasses
      .map(
        item => `
          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  item.className ||
                  item.classCode
                )}
              </strong>
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
              ${formatAttendanceRate(
                item.attendanceRate
              )}
            </td>

          </tr>
        `
      )
      .join("");

}


/* =========================================
   ADMIN STUDENT SUMMARY
========================================= */

function renderAdminStudentSummary(
  students
) {

  const body =
    document.getElementById(
      "adminReportStudentBody"
    );


  if (!students.length) {

    body.innerHTML = `
      <tr>

        <td
          colspan="9"
          class="table-empty"
        >
          No attendance records found
          for the selected period.
        </td>

      </tr>
    `;

    return;

  }


  body.innerHTML =
    students
      .map(
        (
          student,
          index
        ) => `
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
              ${student.recordedDays || 0}
            </td>

            <td>
              ${student.present || 0}
            </td>

            <td>
              ${student.absent || 0}
            </td>

            <td>
              ${student.late || 0}
            </td>

            <td>
              ${student.excused || 0}
            </td>

            <td>
              ${formatAttendanceRate(
                student.attendanceRate
              )}
            </td>

          </tr>
        `
      )
      .join("");

}


/* =========================================
   TEACHER ATTENDANCE REPORT
========================================= */

async function generateTeacherAttendanceReport() {

  const startDate =
    document.getElementById(
      "teacherReportStartDate"
    ).value;


  const endDate =
    document.getElementById(
      "teacherReportEndDate"
    ).value;


  const message =
    document.getElementById(
      "teacherReportMessage"
    );


  const button =
    document.getElementById(
      "teacherGenerateReportButton"
    );


  message.textContent = "";


  if (
    !validateReportDates(
      startDate,
      endDate,
      message
    )
  ) {
    return;
  }


  button.disabled =
    true;


  button.textContent =
    "Generating...";


  showLoading(
    "Generating attendance report..."
  );


  try {

    const data =
      await apiRequest({

        action:
          "get-attendance-report",

        email:
          currentEmail,

        startDate,

        endDate

      });


    teacherReportData =
      data;


    renderTeacherAttendanceReport(
      data
    );


    document.getElementById(
      "teacherPrintReportButton"
    ).disabled =
      false;


    showToast(
      "Attendance report generated."
    );

  }
  catch (error) {

    teacherReportData =
      null;


    document.getElementById(
      "teacherPrintReportButton"
    ).disabled =
      true;


    message.textContent =
      error.message;


    showToast(
      error.message,
      true
    );

  }
  finally {

    button.disabled =
      false;


    button.textContent =
      "Generate Report";


    hideLoading();

  }

}


/* =========================================
   RENDER TEACHER REPORT
========================================= */

function renderTeacherAttendanceReport(
  data
) {

  const summary =
    data.summary || {};


  [
    "teacherReportHeader",
    "teacherReportSummary",
    "teacherReportStatusSummary",
    "teacherReportStudentArea"
  ].forEach(
    id => {

      document
        .getElementById(id)
        ?.classList.remove(
          "hidden"
        );

    }
  );


  setText(
    "teacherReportTitle",
    `${data.scope?.className || "Class"} Attendance Report`
  );


  setText(
    "teacherReportPeriod",
    `${data.range?.startDisplay || data.range?.startDate || ""} to ${data.range?.endDisplay || data.range?.endDate || ""}`
  );


  setText(
    "teacherReportStudents",
    summary.totalStudents || 0
  );


  setText(
    "teacherReportRecordedDates",
    summary.recordedDates || 0
  );


  setText(
    "teacherReportTotalRecords",
    summary.totalRecords || 0
  );


  setText(
    "teacherReportAttendanceRate",
    `${summary.attendanceRate || 0}%`
  );


  setText(
    "teacherReportPresent",
    summary.present || 0
  );


  setText(
    "teacherReportAbsent",
    summary.absent || 0
  );


  setText(
    "teacherReportLate",
    summary.late || 0
  );


  setText(
    "teacherReportExcused",
    summary.excused || 0
  );


  renderTeacherStudentSummary(
    data.students || []
  );

}


/* =========================================
   TEACHER STUDENT SUMMARY
========================================= */

function renderTeacherStudentSummary(
  students
) {

  const body =
    document.getElementById(
      "teacherReportStudentBody"
    );


  if (!students.length) {

    body.innerHTML = `
      <tr>

        <td
          colspan="8"
          class="table-empty"
        >
          No attendance records found
          for the selected period.
        </td>

      </tr>
    `;

    return;

  }


  body.innerHTML =
    students
      .map(
        (
          student,
          index
        ) => `
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
              ${student.recordedDays || 0}
            </td>

            <td>
              ${student.present || 0}
            </td>

            <td>
              ${student.absent || 0}
            </td>

            <td>
              ${student.late || 0}
            </td>

            <td>
              ${student.excused || 0}
            </td>

            <td>
              ${formatAttendanceRate(
                student.attendanceRate
              )}
            </td>

          </tr>
        `
      )
      .join("");

}


/* =========================================
   VALIDATE REPORT DATES
========================================= */

function validateReportDates(
  startDate,
  endDate,
  messageElement
) {

  if (
    !startDate ||
    !endDate
  ) {

    messageElement.textContent =
      "Please select a start date and end date.";

    return false;

  }


  if (
    startDate >
    endDate
  ) {

    messageElement.textContent =
      "Start date cannot be later than end date.";

    return false;

  }


  return true;

}


/* =========================================
   PRINT ATTENDANCE REPORT
========================================= */

function printAttendanceReport(
  role
) {

  const data =
    role === "ADMIN"
      ? adminReportData
      : teacherReportData;


  if (!data) {

    showToast(
      "Generate a report first.",
      true
    );

    return;

  }


  const students =
    data.students || [];


  const classSummaries =
    sortClasses(
      data.classSummaries ||
      []
    );


  const summary =
    data.summary || {};


  const isAdmin =
    role === "ADMIN";


  const studentRows =
    students
      .map(
        (
          student,
          index
        ) => `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHtml(
                student.studentName
              )}
            </td>

            ${
              isAdmin
                ? `
                  <td>
                    ${escapeHtml(
                      student.className ||
                      student.classCode
                    )}
                  </td>
                `
                : ""
            }

            <td>
              ${student.recordedDays || 0}
            </td>

            <td>
              ${student.present || 0}
            </td>

            <td>
              ${student.absent || 0}
            </td>

            <td>
              ${student.late || 0}
            </td>

            <td>
              ${student.excused || 0}
            </td>

            <td>
              ${student.attendanceRate || 0}%
            </td>

          </tr>
        `
      )
      .join("");


  const classSummarySection =
    isAdmin &&
    classSummaries.length
      ? `
        <h3>
          Class Summary
        </h3>

        <table>

          <thead>

            <tr>

              <th>Class</th>
              <th>Records</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Excused</th>
              <th>Attendance Rate</th>

            </tr>

          </thead>

          <tbody>

            ${
              classSummaries
                .map(
                  item => `
                    <tr>

                      <td>
                        ${escapeHtml(
                          item.className ||
                          item.classCode
                        )}
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
                        ${item.attendanceRate || 0}%
                      </td>

                    </tr>
                  `
                )
                .join("")
            }

          </tbody>

        </table>
      `
      : "";


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
        UPS Attendance Report
      </title>

      <style>

        @page {
          size: landscape;
          margin: 12mm;
        }

        body {
          font-family:
            Arial,
            sans-serif;

          color:
            #222;

          padding:
            10px;
        }

        .header {
          margin-bottom:
            18px;
        }

        .header h1 {
          margin:
            0
            0
            4px;

          font-size:
            22px;
        }

        .header h2 {
          margin:
            0
            0
            5px;

          font-size:
            17px;
        }

        .header p {
          margin:
            3px
            0;

          color:
            #555;

          font-size:
            12px;
        }

        .summary {
          display:
            grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap:
            8px;

          margin-bottom:
            18px;
        }

        .summary-box {
          border:
            1px solid
            #ccc;

          padding:
            10px;
        }

        .summary-box span {
          display:
            block;

          font-size:
            10px;

          color:
            #666;
        }

        .summary-box strong {
          display:
            block;

          margin-top:
            4px;

          font-size:
            16px;
        }

        h3 {
          margin-top:
            22px;

          margin-bottom:
            8px;
        }

        table {
          width:
            100%;

          border-collapse:
            collapse;

          margin-bottom:
            20px;
        }

        th,
        td {
          border:
            1px solid
            #bbb;

          padding:
            6px;

          text-align:
            left;

          font-size:
            9px;
        }

        th {
          background:
            #f0edf7;
        }

      </style>

    </head>

    <body>


      <div class="header">

        <h1>
          Universal Philippine School
        </h1>

        <h2>
          Attendance Report
        </h2>

        <p>
          Class:
          ${escapeHtml(
            data.scope?.className ||
            "All Classes"
          )}
        </p>

        <p>
          Period:
          ${escapeHtml(
            data.range?.startDisplay ||
            data.range?.startDate ||
            ""
          )}
          -
          ${escapeHtml(
            data.range?.endDisplay ||
            data.range?.endDate ||
            ""
          )}
        </p>

      </div>


      <div class="summary">

        <div class="summary-box">

          <span>Students</span>

          <strong>
            ${summary.totalStudents || 0}
          </strong>

        </div>


        <div class="summary-box">

          <span>Recorded Days</span>

          <strong>
            ${summary.recordedDates || 0}
          </strong>

        </div>


        <div class="summary-box">

          <span>Total Records</span>

          <strong>
            ${summary.totalRecords || 0}
          </strong>

        </div>


        <div class="summary-box">

          <span>Attendance Rate</span>

          <strong>
            ${summary.attendanceRate || 0}%
          </strong>

        </div>


        <div class="summary-box">

          <span>Present</span>

          <strong>
            ${summary.present || 0}
          </strong>

        </div>


        <div class="summary-box">

          <span>Absent</span>

          <strong>
            ${summary.absent || 0}
          </strong>

        </div>


        <div class="summary-box">

          <span>Late</span>

          <strong>
            ${summary.late || 0}
          </strong>

        </div>


        <div class="summary-box">

          <span>Excused</span>

          <strong>
            ${summary.excused || 0}
          </strong>

        </div>

      </div>


      ${classSummarySection}


      <h3>
        Student Attendance Summary
      </h3>


      <table>

        <thead>

          <tr>

            <th>#</th>

            <th>
              Student Name
            </th>

            ${
              isAdmin
                ? `
                  <th>
                    Class
                  </th>
                `
                : ""
            }

            <th>
              Recorded Days
            </th>

            <th>Present</th>

            <th>Absent</th>

            <th>Late</th>

            <th>Excused</th>

            <th>
              Attendance Rate
            </th>

          </tr>

        </thead>

        <tbody>

          ${studentRows}

        </tbody>

      </table>


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
   FORMAT ATTENDANCE RATE
========================================= */

function formatAttendanceRate(
  value
) {

  const rate =
    Number(value) || 0;


  let extraClass =
    "good";


  if (rate < 75) {

    extraClass =
      "low";

  }
  else if (
    rate < 90
  ) {

    extraClass =
      "warning";

  }


  return `
    <span
      class="report-rate ${extraClass}"
    >
      ${rate}%
    </span>
  `;

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


  if (!students.length) {

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
        ?.addEventListener(
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


  document
    .getElementById(
      "studentProfileModal"
    )
    .classList.remove(
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


  if (data.range) {

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


  if (!history.length) {

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
                record.remarks ||
                ""
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


  if (label) {

    label.textContent =
      text;

  }


  overlay
    ?.classList.remove(
      "hidden"
    );

}


function hideLoading() {

  document
    .getElementById(
      "loadingOverlay"
    )
    ?.classList.add(
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


  if (!toast) {
    return;
  }


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


function setDateInput(
  id,
  value
) {

  const input =
    document.getElementById(
      id
    );


  if (input) {

    input.value =
      value;

  }

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
    String(
      value || ""
    )
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
    .test(
      email
    );

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
