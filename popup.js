// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";

const clipboard = document.getElementById("clipboard");
const drop = document.getElementById("drop");
const output = document.getElementById("output");
const version = document.getElementById("version");
const ofdialog = document.getElementById("ofdialog");
const resetBtn = document.getElementById("reset");

var manifestData = chrome.runtime.getManifest();
version.innerText = manifestData.version;

function call(proc, content) {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!chrome.runtime.lastError) {
            chrome.tabs.sendMessage(tabs[0].id, {content, proc}, response => {
                console.log(response);
            });
        } else {
            console.log(chrome.runtime.lastError);
        }

    });
}

resetBtn.onclick = () => {
    call("reset");
};

drop.onclick = () => {
    ofdialog.value = null;
    ofdialog.click();
};

ofdialog.onchange = () => {
    var file = ofdialog.files[0];
    var reader = new FileReader();
    reader.readAsText(file, 'utf-8');
    reader.onload = readerEvent => {
        var content = readerEvent.target.result;
        publish(content);
    };
};

function send(content) {
    call("publish", content);
}

function publish(content) {
    send(content);
}

clipboard.onclick = async evt => {
    evt.preventDefault();
    evt.stopPropagation();
    output.focus();
    document.execCommand("paste");
    output.blur();
    publish(output.value);
};

drop.ondrop = async evt => {
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
