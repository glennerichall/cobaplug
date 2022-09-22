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
      console.log("missing")
      const img = document.createElement("img");
      img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAL1SURBVFiFvZbNaxNBHIafmf2KtQnYxENi41ewKH6gh3qzBxFvin9ADwqePAoVTFACLQie/Cc8e1cR9KJQEUXE0hY/0LRg0ZPUZreZ8ZAmzSa7yWz8eE87uzO/ed9nZjIRDKFapVTElnfRnAdA8FALPTNeXf6atJZIOmClOpHTSr8BCl2fvurAOjl+Z+F7knoyqQGl9BxQEDZ4xzfwjm8gbADGpduYS1ovEYGV6sG9WllLgOsdrWPvCQDYrDnU33kICIS0JvLVhU+mNRMRUMoqA64cUdiFzfZ7uxAgRxQaHK0aN5LUNCYQl76lYSkYE9hOr0PpW7ILm8gRnZiCEYFQ+mN17EIQ2W8YCkYEQmuf703f0jB7YSCBuPS/fIvNxtbEFuxwm42kFOxBBpSyyqIr/Y+fDpfunELppn8pNA9uviY76mMXAoKPDmpdOjQpXOtXv+8S1CqlooDLAM6BAIQGwLNVe3IApQUpewuH2Orb1NXV6uH9QxsQtiwDXve535lq4Lmq3XYdxc5Uo91OshdiDdQqpaLWXIFw+payo377OZf2w4MTUIg1EJe+bSC9/S6X7j2WphQiDQxK3zSwnXoswoAphUgDg9JDeAmyUQYwo9BjwCQ9wK6OJRgbjTZgQqHHgEl66Cbgx/YbRCFkwDQ9wFiIQLzRQRRCBkzTQ/jo5TL1vn37UWj/nNUqpSKWXAK8qPu+W35DcP/pHgCmp2o4djwtiL8j2neBsGVZa7P0AK6luXLW/E9w3B0hIHn6lj6v7QBg3+5fRv2jKEhItvYtPX6TZfreCabvneDJ26zRmKi9IJPs/E69+pBBa9AaXi5njMZEnQiJJWdImB7gwuQaubRPLu1z8fQ343GdFJRqXBcrtw+taMi7R+o4RbO1/1MFXxz89x5ATWrIAMiU6j/qL6pjroyN5jmCc/UlD1f4SPffGlG+JFh0W80XYvXWxKQS+hmQ+qcz92pDajEl87OL81KLKTSPgfX/MPE68EhIeSY/uzj/G7i3jf+nfcAnAAAAAElFTkSuQmCC";
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
