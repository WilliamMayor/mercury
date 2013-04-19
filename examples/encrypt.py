def encrypt(plaintext):
    info('Performing Caesar cipher shift')
    info('Using shift of %d' % key)
    ciphertext = []
    for i, c in enumerate(plaintext):
        index = printable.find(c)
        if index == -1:
            message = 'Character %d in plaintext not shiftable' % (i+1)
            error(message)
            raise Exception(message)
        ciphertext += printable[(index + key) % len(printable)]
    return ''.join(ciphertext)