UNKNOWN = 0
GREET = 1
HANDSHAKE = 2
MESSAGE = 3
LEAVE = 4


def prettyprint(message_type, nickname, contents):
    if message_type == GREET:
        print 'Greet from ' + nickname
    if message_type == HANDSHAKE:
        print 'Handshake from ' + nickname + ' chat on port ' + contents + '?'
    if message_type == MESSAGE:
        print 'Message from ' + nickname + ':\n'
    if message_type == LEAVE:
        print nickname + ' leaves chat'
    if message_type == UNKNOWN:
        print 'Unknown message type'


def make(message):
    return u'mercury\n' + str(len(message)) + u'\n' + message


def greet(nickname):
    return make(nickname + u'\ngreet')


def handshake(nickname, port):
    return make(nickname + u'\nhandshake\n' + str(port))


def message(nickname, message):
    return make(nickname + u'\nmessage\n' + message)


def leave(nickname):
    return make(nickname + u'\nleave')


def receive(s):
    header = s.recv(len("mercury\n"))
    if header != "mercury\n":
        return (UNKNOWN, None, None)
    else:
        length = ''
        current = s.recv(1)
        while current != '\n':
            length = length + current
            current = s.recv(1)
        message = s.recv(int(length))
        (nickname, _, contents) = message.partition('\n')
        (message_type, _, contents) = contents.partition('\n')
        if message_type == 'greet':
            return (GREET, nickname, None)
        if message_type == 'handshake':
            return (HANDSHAKE, nickname, contents)
        if message_type == 'message':
            return (MESSAGE, nickname, contents)
        if message_type == 'leave':
            return (LEAVE, nickname, None)
        return (UNKNOWN, None, None)
