const norm = str =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, "")
    .trim();

let alerts = document.createElement("div");
document.body.append(alerts);
alerts.classList.add("alerts");

function alert(msg, type) {
  let elem = document.createElement("div");
  elem.innerText = msg;
  let remove = () => {
    elem.style.opacity = 0;
    setTimeout(() => elem.remove(), 1000);
  };
  elem.onclick = () => {
    clearTimeout(id);
    remove();
  };
  elem.classList.add("alert", type);
  let id = setTimeout(() => {
    remove();
  }, 5000);

  alerts.append(elem);
}

function getStudents() {
  let rows = document.querySelectorAll(
    "#cboTri ~ table.BlueTableau tr.Header + tr.Header ~ tr"
  );

  let students = [];
  for (let row of rows) {
    let student = {
      nom: norm(row.children[0].innerText.split(",")[0]),
      prenom: norm(row.children[0].innerText.split(",")[1]),
      da: row.children[1].innerText.trim(),
      codeperm: row.children[2].innerText.trim(),
      input: row.children[3].querySelector("input")
    };
    students.push(student);
  }
  return students;
}

function publish(students, grades) {
  let missing = 0;
  for (let student of students) {
    let nom = student.nom;
    let prenom = student.prenom;
    let prenomCourt = prenom.split(" ")[0];
    prenom = prenom.replace(/\s/g, "");
    nom = nom.replace(/\s/g, "");
    let value =
      grades[student.codeperm] ||
      grades[`${nom}${prenom}`] ||
      grades[`${prenom}${nom}`] ||
      grades[`${prenomCourt}${nom}`] ||
      grades[`${nom}${prenomCourt}`] ||
      grades[student.da] ||
      null;

    student.input.value = value || 0;
    if (value == null) {
      missing++;
      const img = document.createElement("img");
      img.src = "https://image.flaticon.com/icons/svg/196/196759.svg";
      img.classList.add("result", "icon", "publish");
      student.input.parentNode.insertBefore(
        img,
        student.input.parentNode.children[0]
      );
    }
  }
  return missing;
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
        res[norm(tokens[0]).replace(/\s/g, "")] = tokens[1].trim();
        return res;
      }, {});

    for (let student in grades) {
      if (isNaN(Number.parseFloat(grades[student]))) {
        throw new Error("Invalid content");
      }
    }
  }
  return grades;
}

function reset(students) {
  for (let student of students) {
    student.input.value = null;
  }
  document.querySelectorAll("img.publish.result.icon").forEach(x => x.remove());
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  let students;
  let grades;
  try {
    students = getStudents();
  } catch (e) {
    let result =
      "Impossible d'obtenir les informations des étudiants. La page actuelle n'est peut-être pas le cahier de notes?";
    sendResponse({ result });
    alert(result);
    return;
  }

  if (request.proc == "reset") {
    reset(students);
    sendResponse({ result: "done" });
  } else if (request.proc == "publish") {
    try {
      students = getStudents();
    } catch (e) {
      let result =
        "Impossible d'obtenir les informations des étudiants. La page actuelle n'est peut-être pas le cahier de notes?";
      sendResponse({ result });
      alert(result);
      return;
    }

    try {
      grades = parseGrades(request.content);
    } catch (e) {
      let result =
        "Impossible d'otenir les notes saisies selon les données fournies.";
      sendResponse({ result });
      alert(result, "error");
      return;
    }

    let missing = 0;
    try {
      missing = publish(students, grades);
    } catch (e) {
      let result = "L'insertion des données dans la page a échouée.";
      sendResponse({ result });
      alert(result, "error");
      return;
    }

    if (!missing) {
      alert("Terminé avec succès", "success");
    } else {
      alert(
        `Certains étudiants (${missing}) sont absents des données fournies`,
        "warning"
      );
    }
    sendResponse({ result: "done" });
  }
});
