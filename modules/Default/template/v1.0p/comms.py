def send(message):
    """Applies encryption and adds any metadata to a message
    Then sends the message to server using mercury_server_send()"""
    ciphertext = encrypt(message)
    mercury_server_send(ciphertext)


def receive(message):
    """Removes any encryption and metadata from a message
    Can then choose to display the message using mercury_display()"""
    plaintext = decrypt(message)
    mercury_display(plaintext)

def init():
    """Initialises the module so it ready to processes messages"""
    pass
