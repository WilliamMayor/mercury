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

    var executeCodeMirror = CodeMirror.fromTextArea(document.getElementById("encrypt_code"), {
        lineNumbers: true
    });

    $("#encrypt a.execute").click(function() {
        var plaintext = $("#encrypt input.plaintext").val();
        var src = executeCodeMirror.getValue();
        var root = __BRYTHON__.py2js(src);
        var js = root.to_js();
        info('Loading python code')
        eval(js);
        info('Encrypting ' + plaintext + ' using python code')
        var ciphertext = encrypt(plaintext);
        success('Encrypted into: ' + ciphertext)
        $("#encrypt p.ciphertext").text(ciphertext);
    });
});

