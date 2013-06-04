"""
This module uses a caesar shift to encrypt messages
There is a dynamic key that is picked at random
The key is shared between clients using metadata messages that are not encrypted
It is very easy to hack (slightly better than v1.0 though)
"""

key = None


def send(message):
    """Applies encryption and adds any metadata to a message"""
    global key
    ciphertext = encrypt(message, key)
    mercury_server_send(ciphertext)


def receive(message):
    """Removes any encryption and metadata from a message"""
    global key
    plaintext = decrypt(message, key)
    mercury_display(plaintext)


def set_key(new_key):
    global key
    key = int(new_key)
    success('Got key')


def init():
    """Initialises the module so it ready to processes messages"""
    global key
    prompt('What is the key?', set_key)
