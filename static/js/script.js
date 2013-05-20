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
        MPANELS.hack.init();
        MPANELS.save.init();
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
                            e.setValue(data['module'][EDITORS.names[i]],-1);
                        }
                        var parts = data['module']['name'].split('-');
                        MPANELS.save.set(parts[1], parts[2]);
                        alertify.success("Loaded module!");
                    })
                    .fail(function(data) {
                        console.log(data);
                        alertify.error("Could not load module, sorry.");
                    });
                return false;
            });
        },
        load: function(modules) {
            /**
            <select name="module">
                {% if user.modules.user | length > 0 %}
                <optgroup label="{{ user.name }}">
                    {% for m in user.modules.user %}
                    <optgroup label="{{ m }}">
                        {% for v in user.modules.user[m] %}
                        <option value="{{ user.name }}-{{ m }}-{{ v }}">{{ v }}</option>
                        {% endfor %}
                    </optgroup>    
                    {% endfor %}
                </optgroup>
                {% endif %}
                {% for u in user.modules.public %}
                <optgroup label="{{ u }}">
                    {% for m in user.modules.public[u] %}
                    <optgroup label="{{ m }}">
                        {% for v in user.modules.public[u][m] %}
                        <option value="{{ u }}-{{ m }}-{{ v }}">{{ v }}</option>
                        {% endfor %}
                    </optgroup>    
                    {% endfor %}
                </optgroup>
                {% endfor %}
            </select>
            **/
            var select = $(".mpanel.load select");
            select.children().remove();
            var optgroup = null;
            var n,m,v, val, option, parts;
            for (m in modules['user']) {
                optgroup = null;
                for (v in modules['user'][m]) {
                    val = modules['user'][m][v];
                    option = $("<option value='" + val + "'>" + v + "</option>");
                    if (optgroup === null) {
                        parts = val.split("-");
                        optgroup = $("<optgroup label='" + parts[0] + "-" + parts[1] + "'></optgroup>");

                    }
                    optgroup.append(option);
                }
                select.append(optgroup);
            }
            for (n in modules['public']) {
                for (m in modules['public'][n]) {
                    optgroup = null;
                    for (v in modules['public'][n][m]) {
                        val = modules['public'][n][m][v];
                        option = $("<option value='" + val + "'>" + v + "</option>");
                        if (optgroup === null) {
                            parts = val.split("-");
                            optgroup = $("<optgroup label='" + parts[0] + "-" + parts[1] + "'></optgroup>");

                        }
                        optgroup.append(option);
                    }
                    select.append(optgroup);
                }
            }
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
    },
    hack: {
        init: function() {
            $(".mpanel.hack a.button").click(function() {
                var ciphertext = $(".mpanel.hack input.input").val();
                try {
                    MPANELS.console.info('Loading python code');
                    WORKER.worker.postMessage({src: EDITORS.editors["hack"].getValue()});
                    MPANELS.console.info('Hacking ' + ciphertext + ' using python code');
                    var output = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
                    WORKER.worker.addEventListener('message', function(event) {
                        if (output in event.data) {
                            var plaintext = event.data[output];
                            MPANELS.console.success('Hacked into: ' + plaintext);
                            $(".mpanel.hack input.output").val(plaintext);
                            this.removeEventListener('message',arguments.callee,false);
                        }
                    }, false);
                    WORKER.worker.postMessage({execute: "hack('" + ciphertext + "');", output: output});
                } catch (err) {
                    MPANELS.console.error('There was a problem: ' + err);
                }
                return false;
            });
        }
    },
    save: {
        init: function() {
            $(".mpanel.save form").submit(function() {
                for (var i=0; i < EDITORS.names.length; i++) {
                    var e = EDITORS.editors[EDITORS.names[i]];
                    var src = e.getValue();
                    $(".mpanel.save input[name=" + EDITORS.names[i] + "]").val(src);
                }
                $.post("/api/modules/", $(".mpanel.save form").serialize())
                    .done(function(data) {
                        MPANELS.load.load(data['modules']);
                        alertify.success("Saved module!");
                    })
                    .fail(function(data) {
                        console.log(data);
                        alertify.error("Could not save module, sorry.");
                    });
                return false;
            });
        },
        set: function(name, version) {
            $(".mpanel.save input[name=name]").val(name);
            $(".mpanel.save input[name=version]").val(version);
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

