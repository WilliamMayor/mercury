error = function(message) {
    //$("#console_output").append($("<li class='error'>" + message + "</li>"));
    console.log(message)
}
success = function(message) {
    //$("#console_output").append($("<li class='success'>" + message + "</li>"));
    console.log(message)
}
info = function(message) {
    //$("#console_output").append($("<li class='info'>" + message + "</li>"));
    console.log(message)
}
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
}
evalPython = function(editor) {
    var src = editor.getValue();
    var root = __BRYTHON__.py2js(src);
    var js = root.to_js();
    try {
        eval(js);
    } catch (err) {
        throw "Could not evaluate Python code in " + editor + "\n" + err
    }
}
$(document).ready(function() {
    brython(1);

    var setup_editor = makeEditor("setup", "/examples/setup.py");
    var encrypt_editor = makeEditor("encrypt", "/examples/encrypt.py");
    var decrypt_editor = makeEditor("decrypt", "/examples/decrypt.py");

    $("#encrypt a.execute").click(function() {
        var plaintext = $("#encrypt input.input").val();
        try {
            info('Loading python code');
            evalPython(setup_editor);
            evalPython(encrypt_editor);
            info('Encrypting ' + plaintext + ' using python code')
            var ciphertext = encrypt(plaintext);
            success('Encrypted into: ' + ciphertext)
            $("#encrypt input.output").val(ciphertext);
        } catch (err) {
            error('There was a problem: ' + err);
        }
        return false;
    });

    $("#decrypt a.execute").click(function() {
        var ciphertext = $("#decrypt input.input").val();
        try {
            info('Loading python code');
            evalPython(setup_editor);
            evalPython(decrypt_editor);
            info('Decrypting ' + ciphertext + ' using python code')
            var plaintext = decrypt(ciphertext);
            success('Decrypted into: ' + plaintext)
            $("#decrypt input.output").val(plaintext);
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
    })
});

