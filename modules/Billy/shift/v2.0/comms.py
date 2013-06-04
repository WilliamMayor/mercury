def send(message):
    """Applies encryption and adds any metadata to a message"""
    global key, printable
    if key is None:
        key = random(1, len(printable))
        mercury_server_send('$key:%d' % key)
    ciphertext = encrypt(message)
    mercury_server_send(ciphertext)


def receive(message):
    """Removes any encryption and metadata from a message"""
    global key
    if message.startswith('$key:'):
        key = int(message[5:])
    elif message.startswith('$requestkey'):
        if key is not None:
            mercury_server_send('$key:%d' % key)
    else:
        plaintext = decrypt(message)
        mercury_display(plaintext)
        
def init():
    """Initialises the module so it ready to processes messages"""
    global key
    key = None
