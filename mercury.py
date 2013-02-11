import sys
import socket
import utils

host = ''
nickname = sys.argv[1]

COLOUR_MERCURY = '\033[32m'
COLOUR_THEM = '\033[31m'
COLOUR_ME = '\033[34m'
COLOUR_NORMAL = '\033[0m'

if sys.argv[2] == 'listen':
    print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'listening for incoming requests'
    print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'your IP address is: ' + socket.gethostbyname(socket.gethostname())
    listen_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listen_socket.bind((host, 5353))
    listen_socket.listen(1)
    while True:
        (cs, ca) = listen_socket.accept()
        (message_type, other_nickname, message) = utils.receive(cs)
        if message_type == utils.GREET:
            accept = None
            while accept not in ['y', 'n']:
                accept = raw_input(COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + other_nickname + "@" + ca[0] + ' would like to chat with you, accept? (y/n) ')
            if accept == 'y':
                print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'connecting...'
                listen_chat_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                listen_chat_socket.bind((host, 0))
                listen_chat_socket.listen(1)
                cs.send(utils.handshake(nickname, listen_chat_socket.getsockname()[1]))
                (chat_socket, ca) = listen_chat_socket.accept()
                break
            else:
                cs.shutdown(socket.SHUT_RDWR)
                cs.close()
                print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'request refused'
elif sys.argv[2] == 'connect':
    print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'requesting chat...'
    destination = sys.argv[3]
    request_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    request_socket.connect((host, 5353))
    request_socket.sendall(utils.greet(nickname))
    (message_type, other_nickname, message) = utils.receive(request_socket)
    request_socket.shutdown(socket.SHUT_RDWR)
    request_socket.close()
    if message_type == utils.HANDSHAKE:
        print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'request accepted'
        print COLOUR_MERCURY + '[mercury] ' + COLOUR_NORMAL + 'connecting to ' + other_nickname + '@' + destination + '...'
        chat_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        chat_socket.connect((host, int(message)))

while True:
    message = raw_input(COLOUR_ME + '[' + nickname + ']: ' + COLOUR_NORMAL)
    chat_socket.sendall(utils.message(nickname, message))
    (message_type, other_nickname, message) = utils.receive(chat_socket)
    if message_type == utils.MESSAGE:
        print COLOUR_THEM + '[' + other_nickname + '] ' + COLOUR_NORMAL + message
