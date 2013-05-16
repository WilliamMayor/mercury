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
    },
    show: function(mpanel) {
        $(".mpanel")
            .hide()
            .filter("." + mpanel)
            .show();
    },
    console: {
        error: function(message) {
            $(".mpanel.console ul.console").append($("<li class='error'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        },
        success: function(message) {
            $(".mpanel.console ul.console").append($("<li class='success'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        },
        info: function(message) {
            $(".mpanel.console ul.console").append($("<li class='info'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
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
        $.getJSON('/api/modules/').done(function(data) {
            var user = {};
            var _public = {};
            console.log(data);
            for (var i=0; i<data['modules']['user'].length; i++) {
                var iparts = data['modules']['user'][i].split('-');
                if (!(iparts[0] in user)) {
                    user[iparts[0]] = [];
                }
                if (!(iparts[1] in user[iparts[0]])) {
                    user[iparts[0]][iparts[1]] = [];
                }
                user[iparts[0]][iparts[1]].push(iparts[2]);
            }
            for (var j=0; j<data['modules']['public'].length; j++) {
                var jparts = data['modules']['public'][j].split('-');
                if (!(jparts[0] in _public)) {
                    _public[jparts[0]] = {};
                }
                if (!(jparts[1] in _public[jparts[0]])) {
                    _public[jparts[0]][jparts[1]] = [];
                }
                _public[jparts[0]][jparts[1]].push(jparts[2]);
            }
            var select = $(".mpanel.load select");
            for (var n in user) {
                var namegroup = $("<optgroup>");
                namegroup.attr("label", n);
                for (var m in user[n]) {
                    var modulegroup = $("<optgroup>");
                    modulegroup.attr("label", m);
                    for (var k=0; k<user[n][m].length; k++) {
                        var option = $("<option>"+user[n][m][k]+"</option>");
                        option.attr("value", n + "-" + m + "-" + user[n][m][k]);
                        modulegroup.append(option);
                    }
                    namegroup.append(modulegroup);
                }
                select.append(namegroup);
            }
            for (var n in _public) {
                var namegroup = $("<optgroup>");
                namegroup.attr("label", n);
                for (var m in _public[n]) {
                    var modulegroup = $("<optgroup>");
                    modulegroup.attr("label", m);
                    for (var k=0; k<_public[n][m].length; k++) {
                        var option = $("<option>"+_public[n][m][k]+"</option>");
                        option.attr("value", n + "-" + m + "-" + _public[n][m][k]);
                        modulegroup.append(option);
                    }
                    namegroup.append(modulegroup);
                }
                select.append(namegroup);
            }
        });
        $(document).foundation();
    }
};

makeEditor = function(id, inputfile) {
    $.get(inputfile).done(function(src) {
        editor.setValue(src);
        editor.navigateFileStart();
    }).fail(function() {
        error("Could not fetch " + inputfile);
    });
};
$(document).ready(function() {
    APP.init();
    return;
    

    var setup_editor = makeEditor("setup", "/examples/setup.py");
    var encrypt_editor = makeEditor("encrypt", "/examples/encrypt.py");
    var decrypt_editor = makeEditor("decrypt", "/examples/decrypt.py");
    var hack_editor = makeEditor("hack", "/examples/hack.py");

    $("#encrypt a.execute").click(function() {
        var plaintext = $("#encrypt input.input").val();
        try {
            info('Loading python code');
            worker.postMessage({src: setup_editor.getValue()});
            worker.postMessage({src: encrypt_editor.getValue()});
            info('Encrypting ' + plaintext + ' using python code');
            var output = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
            worker.addEventListener('message', function(event) {
                if (output in event.data) {
                    var ciphertext = event.data[output];
                    success('Encrypted into: ' + ciphertext);
                    $("#encrypt input.output").val(ciphertext);
                    this.removeEventListener('message',arguments.callee,false);
                }
            }, false);
            worker.postMessage({execute: "encrypt('" + plaintext + "');", output: output});
        } catch (err) {
            error('There was a problem: ' + err);
        }
        return false;
    });

    $("#decrypt a.execute").click(function() {
        var ciphertext = $("#decrypt input.input").val();
        try {
            info('Loading python code');
            worker.postMessage({src: setup_editor.getValue()});
            worker.postMessage({src: decrypt_editor.getValue()});
            info('Decrypting ' + ciphertext + ' using python code');
            var output = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
            worker.addEventListener('message', function(event) {
                if (output in event.data) {
                    var plaintext = event.data[output];
                    success('Decrypted into: ' + plaintext);
                    $("#decrypt input.output").val(plaintext);
                    this.removeEventListener('message',arguments.callee,false);
                }
            }, false);
            worker.postMessage({execute: "decrypt('" + ciphertext + "');", output: output});
        } catch (err) {
            error('There was a problem: ' + err);
        }
        return false;
    });

    $("#hack a.execute").click(function() {
        var ciphertext = $("#hack input.input").val();
        try {
            info('Loading python code');
            worker.postMessage({src: hack_editor.getValue()});
            info('Hacking ' + ciphertext + ' using python code');
            var output = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
            worker.addEventListener('message', function(event) {
                if (output in event.data) {
                    var plaintext = event.data[output];
                    success('Hacked into: ' + plaintext);
                    $("#hack input.output").val(plaintext);
                    this.removeEventListener('message',arguments.callee,false);
                }
            }, false);
            worker.postMessage({execute: "hack('" + ciphertext + "');", output: output});
        } catch (err) {
            error('There was a problem: ' + err);
        }
        return false;
    });

    $("#navbar a").click(function() {
        $("#panels").removeClass("hidden");
        $("#panels .panel").hide();
        $("#" + $(this).attr("class")).show(400);
        return false;
    });
});

