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
            $(".mpanel.console ul.console").append($("<li class='error'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        },
        success: function(message) {
            $(".mpanel.console ul.console").append($("<li class='success'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        },
        info: function(message) {
            $(".mpanel.console ul.console").append($("<li class='info'>" + message + "</li>")).scrollTop($(".mpanel.console ul.console")[0].scrollHeight);
        }
    },
    load: {
        init: function() {
            $(".mpanel.load form").submit(function() {
                var option = $(".mpanel.load form select option").filter(":selected");
                var user = option.data('user');
                var name = option.data('name');
                var version = option.data('version');
                $.getJSON("/api/modules/" + user + "/" + name + "/" + version + "/")
                    .done(function(data) {
                        for (var i=0; i < EDITORS.names.length; i++) {
                            var e = EDITORS.editors[EDITORS.names[i]];
                            e.setValue(data['module'][EDITORS.names[i]],-1);
                        }
                        MPANELS.save.set(data['module']['name'], data['module']['version']);
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
            for (var m in modules) {
                var option = $("<option></option>");
                option.data('user', m['user']);
                option.data('name', m['name']);
                option.data('version', m['version']);
                option.val([m['user'], m['name'], m['version']].join("-"));
                select.append(option);
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
                        } else if ('progress' in event.data) {
                            $(".mpanel.encrypt .meter").width(event.data['progress']);
                        } else if ('success' in event.data) {
                            alertify.success(event.data['success']);
                        } else if ('error' in event.data) {
                            alertify.error(event.data['error']);
                            this.removeEventListener('message',arguments.callee,false);
                        }
                    }, false);
                    WORKER.worker.postMessage({execute: "encrypt('" + plaintext.replace(/'/g, "\\'") + "');", output: output});
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
                        } else if ('progress' in event.data) {
                            $(".mpanel.decrypt .meter").width(event.data['progress']);
                        } else if ('success' in event.data) {
                            alertify.success(event.data['success']);
                        } else if ('error' in event.data) {
                            alertify.error(event.data['error']);
                            this.removeEventListener('message',arguments.callee,false);
                        }
                    }, false);
                    WORKER.worker.postMessage({execute: "decrypt('" + ciphertext.replace(/'/g, "\\'") + "');", output: output});
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
                        } else if ('progress' in event.data) {
                            $(".mpanel.hack .meter").width(event.data['progress']);
                        } else if ('success' in event.data) {
                            alertify.success(event.data['success']);
                        } else if ('error' in event.data) {
                            alertify.error(event.data['error']);
                            this.removeEventListener('message',arguments.callee,false);
                        }
                    }, false);
                    WORKER.worker.postMessage({execute: "hack('" + ciphertext.replace(/'/g, "\\'") + "');", output: output});
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
                MPANELS.save.save();
                return false;
            });
            document.addEventListener("keydown", function(e) {
                if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                    e.preventDefault();
                    MPANELS.save.save();
              }
            }, false);
        },
        set: function(name, version) {
            $(".mpanel.save input[name=name]").val(name);
            $(".mpanel.save input[name=version]").val(version);
        },
        save: function() {
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
        add: function(room_name, safe_name) {
            var li = $("<li><a class='room' href='" + safe_name + "'>" + room_name + "</a></li>");
            $(".mpanel.lobby ul.rooms").append(li);
        }
    },
    create: {
        init: function() {
            $(".mpanel.create form").submit(function() {
                var option = $(".mpanel.create form select option").filter(":selected");
                var form = $(".mpanel.create form").serializeArray();
                form.push({'name': 'module_user', 'value': option.data('user')});
                form.push({'name': 'module_name', 'value': option.data('name')});
                form.push({'name': 'module_version', 'value': option.data('version')});
                $.post("/api/chat/", $.param(form))
                    .done(function(data) {
                        var room_name = data['room']['name'];
                        var safe_name = room_name.replace(' ', '_');
                        TOPBAR.chat.add(room_name, safe_name);
                        MPANELS.chat.add(room_name, safe_name);
                        $(".mpanel.create form")[0].reset();
                        MPANELS.lobby.add(room_name, safe_name);
                        MPANELS.show(safe_name);
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

            var worker = new Worker("/static/js/worker.js");
            worker.postMessage({init: true});
            worker.addEventListener('message', function(event) {
                console.log(event);
                if ('display' in event.data) {
                    var user_span = $("<span class='user " + event.data['user'] + "'>" + event.data['user'] + "</span>");
                    var message_span = $("<span></span>");
                    message_span.text(event.data['display']);
                    var li = $("<li></li>");
                    li.append("[").append(user_span).append("]: ").append(message_span);
                    ul.append(li);
                }
                if ('send' in event.data) {
                    $.post("/api/chat/" + safe_name + "/", {'message': event.data['send']})
                        .done(function(data) {
                            form[0].reset();
                        })
                        .fail(function(data) {
                            console.log(data);
                            alertify.error("Error sending message");
                        });
                }
                if ('success' in event.data && event.data['success'] !== undefined) {
                    alertify.success(event.data['success']);
                }
                if ('error' in event.data && event.data['error'] !== undefined) {
                    alertify.error(event.data['error']);
                }
                if ('prompt' in event.data) {
                    var o = {};
                    o[event.data['output']] = prompt(event.data['prompt']);
                    console.log(o);
                    worker.postMessage(o);
                }
            });
            $.getJSON("/api/chat/" + safe_name + "/code/")
                .done(function(data) {
                    worker.postMessage({src: data['module']['encrypt']});
                    worker.postMessage({src: data['module']['decrypt']});
                    worker.postMessage({src: data['module']['comms']});
                    worker.postMessage({execute: 'init()'});
                    var source = new EventSource("/api/chat/" + safe_name + "/");
                    source.onmessage = function(e) {
                        console.log(e.data);
                        var parts = e.data.split("]: ", 2);
                        if (parts.length === 2) {
                            var user = parts[0].slice(1);
                            var message = parts[1];
                            worker.postMessage({execute: "receive('" + message.replace(/'/g, "\\'") + "');", user: user});
                        }
                    };
                })
                .fail(function(data) {
                    console.log(data);
                    alertify.error("Could not load chat room, sorry.");
                });
            form.submit(function() {
                var plaintext = $(this).find("input[name=message]").val();
                worker.postMessage({execute: "send('" + plaintext.replace(/'/g, "\\'") + "');"});
                return false;
            });
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
    workers: {},
    init: function(name) {
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
    names: ["encrypt", "decrypt", "hack", "comms"],
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

