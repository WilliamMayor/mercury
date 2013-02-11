import socket
import utils

nick = 'billy'

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('', 5353))

byte_count = s.send(utils.greet(nick))


s.shutdown(socket.SHUT_RDWR)
s.close()
