import hashlib
import os

import redis

from flask.ext.login import UserMixin


class User(UserMixin):

    REDIS = redis.StrictRedis()

    @staticmethod
    def getall():
        for user in User.REDIS.smembers('users'):
            yield User(user)

    @staticmethod
    def add(username, password, colour):
        salt = os.urandom(16).encode('hex')
        phash = hashlib.sha256(password + salt).digest().encode('hex')
        User.REDIS.hmset('user:%s' % username, dict(password=phash, salt=salt, colour=colour))
        User.REDIS.sadd('users', username)
        return User(username)

    def __init__(self, username):
        details = User.REDIS.hmget('user:%s' % username, ['salt', 'password', 'colour'])
        self.id = username
        self.salt = details[0]
        self.hash = details[1]
        self.colour = details[2]
        self.isadmin = username in ['Billy', 'Zaiba']

    def correct_password(self, password):
        return self.hash == hashlib.sha256(password + self.salt).digest().encode('hex')

    def __eq__(self, other):
        return self.id == other.id

if __name__ == '__main__':
    User.REDIS = redis.StrictRedis(db=1)
    User.REDIS.flushdb()

    a = User.getall()
    assert list(a) == [], 'Test DB not empty'

    u = User.add('one', 'p', 'c')

    b = list(User.getall())
    assert len(b) == 1, 'Getall matched more than one thing'
    assert b[0] == u, 'Contents of getall not correct'

    c = User(u.id)
    assert c.salt == u.salt, 'Contents of get not correct'
    assert c.hash == u.hash, 'Contents of get not correct'
    assert c.colour == u.colour, 'Contents of get not correct'
    assert c.isadmin == u.isadmin, 'Contents of get not correct'

    assert c.correct_password('p')
    assert not c.correct_password('p1')

    try:
        User('not')
        assert False
    except:
        pass

    User.REDIS.flushdb()
