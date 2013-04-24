error = function(message) {
    $("#console_output").append($("<li class='error'>" + message + "</li>")).scrollTop($("#console_output")[0].scrollHeight);
};
success = function(message) {
    $("#console_output").append($("<li class='success'>" + message + "</li>")).scrollTop($("#console_output")[0].scrollHeight);
};
info = function(message) {
    $("#console_output").append($("<li class='info'>" + message + "</li>")).scrollTop($("#console_output")[0].scrollHeight);
};
makeEditor = function(id, inputfile) {
    var editor = ace.edit(id + "_editor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/python");
    editor.setPrintMarginColumn(false);
    $.get(inputfile).done(function(src) {
        editor.setValue(src);
        editor.navigateFileStart();
    }).fail(function() {
        error("Could not fetch " + inputfile);
    });
    return editor;
};
evalPython = function(editor) {
    var src = editor.getValue();
    var root = __BRYTHON__.py2js(src);
    var js = root.to_js();
    try {
        eval(js);
    } catch (err) {
        throw "Could not evaluate Python code in " + editor + "\n" + err;
    }
};
$(document).ready(function() {
    brython(1);
    var worker = new Worker("/js/worker.js");
    worker.onmessage = function(event) {
        if ("info" in event.data) info(event.data["info"]);
        if ("error" in event.data) error(event.data["error"]);
        if ("success" in event.data) success(event.data["success"]);
        if ("log" in event.data) console.log(event.data["log"]);
    };
    worker.postMessage({init: true});

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

    $.get("dictionary.txt", function(txt) {
        worker.postMessage({dictionary: txt.split("\n")});
    });
});

