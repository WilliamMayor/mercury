def error(message):
    print(message)
    doc["console_output"] <= LI(message)

def run_encrypt():
    print('run_encrypt')
    src = doc["encrypt_code"].value
    try:
        exec(src)
    except Exception as exc:
        error(traceback.print_exc())
    plaintext = doc["plaintext"].value
    print(plaintext)
    ciphertext = encrypt(plaintext)
    print(ciphertext)
    doc["ciphertext"].innerText = ciphertext
