def run_encrypt(plaintext, src):
    try:
        info('Loading encryption script')
        info(src)
        exec(src)
        success('Loaded')
        info('Encrypting plaintext: ' + plaintext)
        ciphertext = encrypt(plaintext)
        success('Encrypted into: ' + ciphertext)
        return ciphertext
    except Exception as exc:
        error(exc)