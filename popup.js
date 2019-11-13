// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";

const clipboard = document.getElementById("clipboard");
const drop = document.getElementById("drop");
const output = document.getElementById("output");
const version = document.getElementById("version");

var manifestData = chrome.runtime.getManifest();
version.innerText = manifestData.version;

function send(content) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { content, proc: "publish" },
      response => {
        console.log(response.farewell);
      }
    );
  });
}

function publish(content) {
  console.log(content);
  send(content);
}

clipboard.onclick = async evt => {
  evt.preventDefault();
  output.focus();
  document.execCommand("paste");
  output.blur();
  publish(output.value);
};

drop.ondrop = async evt => {
  console.log("drag drop");
  drop.classList.remove("drag");

  // Prevent default behavior (Prevent file from being opened)
  evt.preventDefault();

  let files = [];
  if (evt.dataTransfer.items) {
    for (var i = 0; i < evt.dataTransfer.items.length; i++) {
      if (evt.dataTransfer.items[i].kind === "file") {
        var file = evt.dataTransfer.items[i].getAsFile();
        files.push(file);
      }
    }
  } else {
    for (var i = 0; i < evt.dataTransfer.files.length; i++) {
      files.push(evt.dataTransfer.files[i]);
    }
  }

  if (files.length) {
    let content = await files[0].text();
    publish(content);
  }
};

drop.ondragenter = () => {
  drop.classList.add("drag");
};

drop.ondragleave = () => {
  drop.classList.remove("drag");
};

drop.ondragover = evt => {
  evt.preventDefault();
};
