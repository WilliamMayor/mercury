whitespace = ' '
ascii_lowercase = 'abcdefghijklmnopqrstuvwxyz'
ascii_uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
ascii_letters = ascii_lowercase + ascii_uppercase
digits = '0123456789'
punctuation = """!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""
printable = digits + ascii_letters + punctuation + whitespace


def encrypt(plaintext, key=20):
    progress('0%')
    info('Performing Caesar cipher shift')
    info('Using shift of %d' % key)
    ciphertext = []
    for i, c in enumerate(plaintext):
        progress('%d%' % 100*i*len(plaintext))
        index = printable.find(c)
        if index == -1:
            message = 'Character %d in plaintext not shiftable' % (i+1)
            error(message)
            raise Exception(message)
        ciphertext += printable[(index + key) % len(printable)]
    progress('100%')
    return ''.join(ciphertext)
