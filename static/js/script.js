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
        MPANELS.lobby.init();
        MPANELS.create.init();
        MPANELS.chat.init();
    },
    show: function(mpanel) {
        $(".mpanel")
            .hide()
            .filter("." + mpanel)
            .show();
    },
    exists: function(name) {
        return $(".mpanel." + name).length;
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
                        MPANELS.show("encrypt");
                    })
                    .fail(function(data) {
                        console.log(data);
                        alertify.error("Could not load module, sorry.");
                    });
                return false;
            });
        },
        load: function(modules) {
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
    },
    lobby: {
        init: function() {
            $(".mpanel.lobby ul.rooms").on("click", "a", function() {
                var room_name = $(this).text();
                var safe_name = $(this).attr('href');
                if (!MPANELS.exists(safe_name)) {
                    TOPBAR.chat.add(room_name, safe_name);
                    MPANELS.chat.add(room_name, safe_name);
                }
                MPANELS.show(safe_name);
                return false;
            });
        },
        add: function(name) {
            var li = $("<li><a class='room' href='" + name.replace(' ', '_') + "'>" + name + "</a></li>");
            $(".mpanel.lobby ul.rooms").append(li);
        }
    },
    create: {
        init: function() {
            $(".mpanel.create form").submit(function() {
                $.post("/api/chat/", $(".mpanel.create form").serialize())
                    .done(function(data) {
                        TOPBAR.chat.add(data['room']);
                        MPANELS.chat.add(data['room']);
                        $(".mpanel.create form")[0].reset();
                        MPANELS.lobby.add(data['room']);
                        MPANELS.show(data['room']);
                        alertify.success("Created chat room!");
                    })
                    .fail(function(data) {
                        console.log(data);
                        alertify.error("Could not create chat room, sorry.");
                    });
                return false;
            });
        }
    },
    chat: {
        init: function() {
            $("body").on("submit", ".mpanel.chat.room form", function() {
                var name;
                var classList = $(this).parents("div.mpanel").attr('class').split(/\s+/);
                $.each(classList, function(index, item){
                    if($.inArray(item, ["mpanel", "chat", "room"]) == -1 ){
                          name = item;
                    }
                });
                var that = $(this);
                $.post("/api/chat/" + name + "/", that.serialize())
                    .done(function(data) {
                        that[0].reset();
                    })
                    .fail(function(data) {
                        console.log(data);
                        alertify.error("Error sending message");
                    });
                return false;
            });
        },
        add: function(room_name, safe_name) {
            var mpanel = $("<div class='mpanel chat room " + safe_name + "'></div>");
            mpanel.append("<div class='row'><h1>" + room_name + "</h1></div>");
            var conversation = $("<div class='row conversation'></div>");
            var ul = $("<ul class='messages'></ul>");
            conversation.append(ul);
            mpanel.append(conversation);
            var chatbar = $("<div class='row chatbar'></div>");
            var form = $("<form method='POST' action='/api/chat/" + safe_name + "/'><input type='text' name='message' placeholder='Message' /><input type='submit' class='button' value='Send' /></form>");
            chatbar.append(form);
            mpanel.append(chatbar);
            $("body").append(mpanel);
            var source = new EventSource("/api/chat/" + safe_name + "/");
            source.onmessage = function(e) {
                var li = $("<li></li>");
                var parts = e.data.split("]:");
                if (parts.length === 1) {
                    li.append(e.data);
                } else {
                    var span = $("<span class='user'>" + parts[0].slice(1) + "</span>");
                    li.append("[").append(span).append("]: ").append(parts[1]);
                }
                ul.append(li);
            };
        }
    }
};
var TOPBAR = {
    init: function() {
        $(".top-bar").on("click", "a.nav", function() {
            MPANELS.show($(this).attr("href"));
            return false;
        });
    },
    chat: {
        add: function(room_name, safe_name) {
            var li = $("<li><a class='nav' href='" + safe_name + "'>" + room_name + "</a></li>");
            $(".top-bar ul.chat").append(li);
        }
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

