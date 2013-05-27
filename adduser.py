import getpass
import hashlib
import os

import redis

if __name__ == '__main__':
    red = redis.StrictRedis()

    username = raw_input('Username: ')
    if red.sismember('users', username):
        print 'Username taken! Try again'
        exit(1)

    password = getpass.getpass('Password: ')
    salt = os.urandom(16).encode('hex')
    passwordhash = hashlib.sha256(password + salt).digest().encode('hex')

    colour = raw_input('Color: ')
    if colour == '':
        colour = '1abc9c'

    red.hmset('user:%s' % username, dict(password=passwordhash, salt=salt, colour=colour))
    red.sadd('users', username)
