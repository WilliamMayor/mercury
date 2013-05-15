whitespace = ' '
ascii_lowercase = 'abcdefghijklmnopqrstuvwxyz'
ascii_uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
ascii_letters = ascii_lowercase + ascii_uppercase
digits = '0123456789'
punctuation = """!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""
printable = digits + ascii_letters + punctuation + whitespace

key = 14


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