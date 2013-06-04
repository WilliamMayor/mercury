"""
This module uses a caesar shift to encrypt messages
There is a fixed, shared key
It is quite easy to hack
"""


def send(message):
    """Applies encryption and adds any metadata to a message"""
    ciphertext = encrypt(message)
    mercury_server_send(ciphertext)


def receive(message):
    """Removes any encryption and metadata from a message"""
    plaintext = decrypt(message)
    mercury_display(plaintext)


def init():
    """Initialises the module so it ready to processes messages"""
    pass
