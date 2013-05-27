import getpass
import hashlib
import os

import redis

if __name__ == '__main__':
    username = raw_input('Username: ')

    password = getpass.getpass('Password: ')
    salt = os.urandom(16).encode('hex')
    passwordhash = hashlib.sha256(password + salt).digest().encode('hex')

    colour = raw_input('Color: ')
    if colour == '':
        color = '1abc9c'

    red = redis.StrictRedis()
    red.hmset('user:%s' % username, dict(password=passwordhash, salt=salt, colour=colour))
