"""
This module uses a caesar shift to encrypt messages
There is a dynamic key that is picked at random
The key is shared between clients using metadata messages that are not encrypted
It is very easy to hack (slightly better than v1.0 though)
"""

key = None


def send(message):
    """Applies encryption and adds any metadata to a message"""
    global key, printable
    if key is None:
        key = random(1, len(printable))
    ciphertext = encrypt(message, key)
    mercury_server_send(ciphertext)


def receive(message):
    """Removes any encryption and metadata from a message"""
    global key
    if message.startswith('$key:'):
        if key is None:
            key = int(message[5:])
            success('Got key!')
    elif message.startswith('$requestkey'):
        if key is not None:
            mercury_server_send('$key:%d' % key)
    else:
        plaintext = decrypt(message, key)
        mercury_display(plaintext)


def init():
    """Initialises the module so it ready to processes messages"""
    mercury_server_send('$requestkey')
