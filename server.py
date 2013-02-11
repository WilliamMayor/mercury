import socket
import utils

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('', 5353))
s.listen(5)
while 1:
    (cs, ca) = s.accept()
    utils.prettyprint(*utils.receive(cs))
