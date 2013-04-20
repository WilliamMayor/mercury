whitespace = ' \t\n\r\v\f'
ascii_lowercase = 'abcdefghijklmnopqrstuvwxyz'
ascii_uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
ascii_letters = ascii_lowercase + ascii_uppercase
digits = '0123456789'
punctuation = """!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""
printable = digits + ascii_letters + punctuation + whitespace

def hack(ciphertext):
    info('Hacking a Caesar shifted message')
    bestGuess = None
    bestScore = 0
    for key in range(0, len(printable)):
        info('Using shift of %d' % key)
        guess = []
        for i, c in enumerate(ciphertext):
            index = printable.find(c)
            if index == -1:
                message = 'Character %d in ciphertext not shiftable' % (i+1)
                error(message)
                raise Exception(message)
            guess += printable[(index - key) % len(printable)]
        guess = ''.join(guess)
        score = 0
        for word in guess.strip().split(' '):
            if word.strip() in dictionary: # where does dictionary come from?
                info('    %s is in the dictionary' % word)
                score += 1
        if score > 0:
            success("The message might be '%s' with score %d" % (guess,score))
        if score > bestScore:
            bestScore = score
            bestGuess = guess
    return bestGuess