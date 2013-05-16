var ALERTIFY = {
    init: function() {
        $(".flashes li").each(function(index, value) {
            var t = $(value);
            if (t.hasClass("success")) {
                alertify.success(t.text());
            } else if (t.hasClass("error")) {
                alertify.error(t.text());
            } else {
                alertify.log(t.text());
            }
        });
    }
};
var MPANELS = {
    init: function() {
        MPANELS.show("intro");
        MPANELS.load.init();
        MPANELS.encrypt.init();
        MPANELS.decrypt.init();
    },
    show: function(mpanel) {
        $(".mpanel")
            .hide()
            .filter("." + mpanel)
            .show();
    },
    console: {
        error: function(message) {
            alertify.error("Check your console");
            $(".mpanel.console ul.console").append($("<li class='error'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        },
        success: function(message) {
            alertify.success("Check your console");
            $(".mpanel.console ul.console").append($("<li class='success'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        },
        info: function(message) {
            $(".mpanel.console ul.console").append($("<li class='info'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        }
    },
    load: {
        init: function() {
            $(".mpanel.load form").submit(function() {
                var module = $(".mpanel.load form select").val();
                $.getJSON("/api/modules/" + module)
                    .done(function(data) {
                        for (var i=0; i < EDITORS.names.length; i++) {
                            var e = EDITORS.editors[EDITORS.names[i]];
                            e.setValue(data['module'][EDITORS.names[i]]);
                            e.navigateFileStart();
                        }
                        alertify.success("Loaded module!");
                    })
                    .fail(function(data) {
                        console.log(data);
                        alertify.error("Could not load module, sorry.");
                    });
                return false;
            });
        }
    },
    encrypt: {
        init: function() {
            $(".mpanel.encrypt a.button").click(function() {
                var plaintext = $(".mpanel.encrypt input.input").val();
                try {
                    MPANELS.console.info('Loading python code');
                    WORKER.worker.postMessage({src: EDITORS.editors["encrypt"].getValue()});
                    MPANELS.console.info('Encrypting ' + plaintext + ' using python code');
                    var output = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
                    WORKER.worker.addEventListener('message', function(event) {
                        if (output in event.data) {
                            var ciphertext = event.data[output];
                            MPANELS.console.success('Encrypted into: ' + ciphertext);
                            $(".mpanel.encrypt input.output").val(ciphertext);
                            this.removeEventListener('message',arguments.callee,false);
                        }
                    }, false);
                    WORKER.worker.postMessage({execute: "encrypt('" + plaintext + "');", output: output});
                } catch (err) {
                    MPANELS.console.error('There was a problem: ' + err);
                }
                return false;
            });
        }
    },
    decrypt: {
        init: function() {
            $(".mpanel.decrypt a.button").click(function() {
                var ciphertext = $(".mpanel.decrypt input.input").val();
                try {
                    MPANELS.console.info('Loading python code');
                    WORKER.worker.postMessage({src: EDITORS.editors["decrypt"].getValue()});
                    MPANELS.console.info('Encrypting ' + ciphertext + ' using python code');
                    var output = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
                    WORKER.worker.addEventListener('message', function(event) {
                        if (output in event.data) {
                            var plaintext = event.data[output];
                            MPANELS.console.success('Decrypted into: ' + plaintext);
                            $(".mpanel.decrypt input.output").val(plaintext);
                            this.removeEventListener('message',arguments.callee,false);
                        }
                    }, false);
                    WORKER.worker.postMessage({execute: "decrypt('" + ciphertext + "');", output: output});
                } catch (err) {
                    MPANELS.console.error('There was a problem: ' + err);
                }
                return false;
            });
        }
    }
};
var TOPBAR = {
    init: function() {
        for (var i=0; i<TOPBAR.links.length; i++) {
            TOPBAR.click(i);
        }
    },
    links: ["intro", "contact", "links", "lobby", "create", "load", "encrypt", "decrypt", "hack", "console", "save"],
    click: function(i) {
        $(".top-bar a." + TOPBAR.links[i]).click(function() {
            MPANELS.show(TOPBAR.links[i]);
            return false;
        });
    }
};
var WORKER = {
    init: function() {
        WORKER.worker = new Worker("/static/js/worker.js");
        WORKER.worker.onmessage = function(event) {
            if ("info" in event.data) MPANELS.console.info(event.data["info"]);
            if ("error" in event.data) MPANELS.console.error(event.data["error"]);
            if ("success" in event.data) MPANELS.console.success(event.data["success"]);
            if ("log" in event.data) console.log(event.data["log"]);
        };
        WORKER.worker.postMessage({init: true});
        $.get("/static/dictionary.txt", function(txt) {
            WORKER.worker.postMessage({dictionary: txt.split("\n")});
        });
    }
};
var EDITORS = {
    names: ["encrypt", "decrypt", "hack"],
    editors: {},
    init: function() {
        for (var i=0; i<EDITORS.names.length; i++) {
            var editor = ace.edit(EDITORS.names[i] + "_editor");
            editor.setTheme("ace/theme/chrome");
            editor.getSession().setMode("ace/mode/python");
            editor.setPrintMarginColumn(false);
            EDITORS.editors[EDITORS.names[i]] = editor;
        }
    }
};
var APP = {
    init: function() {
        ALERTIFY.init();
        MPANELS.init();
        TOPBAR.init();
        WORKER.init();
        EDITORS.init();
        $(document).foundation();
    }
};
$(document).ready(function() {
    APP.init();
});

