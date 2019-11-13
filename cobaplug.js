function getStudents() {
  let rows = document.querySelectorAll(
    "#cboTri ~ table.BlueTableau tr.Header + tr.Header ~ tr"
  );

  let students = [];
  for (let row of rows) {
    let student = {
      nom: row.children[0].innerText.split(",")[0].trim(),
      prenom: row.children[0].innerText.split(",")[1].trim(),
      da: row.children[1].innerText.trim(),
      codeperm: row.children[2].innerText.trim(),
      input: row.children[3].children[0]
    };
    students.push(student);
  }
  return students;
}

function publish(students, grades) {
  for (let student of students) {
    
    let value =
      grades[student.codeperm] ||
      grades[`${student.nom} ${student.prenom}`] ||
      grades[`${student.prenom} ${student.nom}`] ||
      grades[student.da] ||
      null;

    student.input.value = value || 0;
    if (value == null) {
      const img = document.createElement("img");
      img.src = "https://image.flaticon.com/icons/svg/196/196759.svg";
      img.classList.add("result", "icon", "publish");
    //   student.input.parentNode.style.position = 'relative';
      student.input.parentNode.appendChild(img);
    }
  }
}

function parseGrades(content) {
  let grades;
  try {
    grades = JSON.parse(content);
  } catch (_) {
    grades = content
      .split("\n")
      .filter(line => line.trim())
      .reduce((res, line) => {
        const tokens = line.split(":");
        res[tokens[0].trim()] = tokens[1].trim();
        return res;
      }, {});
  }
  return grades;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.proc == "publish") {
    let students = getStudents();
    publish(students, parseGrades(request.content));
    sendResponse({ farewell: "goodbye" });
  }
});
