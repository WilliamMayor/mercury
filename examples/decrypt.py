def decrypt(ciphertext):
    info('Performing reverse Caesar cipher shift')
    info('Using shift of %d' % key)
    plaintext = []
    for i, c in enumerate(ciphertext):
        index = printable.find(c)
        if index == -1:
            message = 'Character %d in ciphertext not shiftable' % (i+1)
            error(message)
            raise Exception(message)
        plaintext += printable[(index - key) % len(printable)]
    return ''.join(plaintext)