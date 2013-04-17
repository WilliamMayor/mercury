error = function(message) {
    $("#console_output").append($("<li class='error'>" + message + "</li>"));
}
success = function(message) {
    $("#console_output").append($("<li class='success'>" + message + "</li>"));
}
info = function(message) {
    $("#console_output").append($("<li class='info'>" + message + "</li>"));
}