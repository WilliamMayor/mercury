error = function(message) {
    $("#console_output").append($("<li class='error'>" + message + "</li>"));
}
success = function(message) {
    $("#console_output").append($("<li class='success'>" + message + "</li>"));
}
info = function(message) {
    $("#console_output").append($("<li class='info'>" + message + "</li>"));
}
$(document).ready(function() {
    brython(1);

    var encrypt_editor = ace.edit("encrypt_editor");
    encrypt_editor.setTheme("ace/theme/pastel_on_dark");
    encrypt_editor.getSession().setMode("ace/mode/python");

    var decrypt_editor = ace.edit("decrypt_editor");
    decrypt_editor.setTheme("ace/theme/pastel_on_dark");
    decrypt_editor.getSession().setMode("ace/mode/python");

    $("#encrypt a.execute").click(function() {
        var plaintext = $("#encrypt input.plaintext").val();
        var src = encrypt_editor.getValue();
        var root = __BRYTHON__.py2js(src);
        var js = root.to_js();
        try {
            info('Loading python code')
            eval(js);
            info('Encrypting ' + plaintext + ' using python code')
            var ciphertext = encrypt(plaintext);
            success('Encrypted into: ' + ciphertext)
            $("#encrypt p.ciphertext span").text(ciphertext);
        } catch (err) {
            error('There was a problem: ' + err);
        }
        return false;
    });

    $("#decrypt a.execute").click(function() {
        var ciphertext = $("#decrypt input.ciphertext").val();
        var src = decrypt_editor.getValue();
        var root = __BRYTHON__.py2js(src);
        var js = root.to_js();
        try {
            info('Loading python code')
            eval(js);
            info('Decrypting ' + ciphertext + ' using python code')
            var plaintext = decrypt(ciphertext);
            success('Decrypted into: ' + plaintext)
            $("#decrypt p.plaintext span").text(plaintext);
        } catch (err) {
            error('There was a problem: ' + err);
        }
        return false;
    });
});

