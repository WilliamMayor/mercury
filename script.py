import html

def info(message):
    doc["console_output"] <= html.LI(message, CLASS='info')

def success(message):
    doc["console_output"] <= html.LI(message, CLASS='success')

def error(message):
    doc["console_output"] <= html.LI(message, CLASS='error')

def run_encrypt():
    src = doc["encrypt_code"].value
    try:
        info('Loading encryption script')
        exec(src)
        success('Loaded')
        plaintext = doc["plaintext"].value
        info('Encrypting plaintext: ' + plaintext)
        ciphertext = encrypt(plaintext)
        success('Encrypted into: ' + ciphertext)
        doc["ciphertext"].innerText = ciphertext
    except Exception as exc:
        error(exc)
