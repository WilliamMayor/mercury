import redis

from Module import Module


class Room:

    REDIS = redis.StrictRedis()

    @staticmethod
    def getall():
        for name in Room.REDIS.smembers('rooms'):
            yield Room.get(name)

    @staticmethod
    def add(name, module):
        Room.REDIS.sadd('rooms', name)
        Room.REDIS.hmset('room:%s' % name, dict(module_user=module.user, module_name=module.name, module_version=module.version))
        return Room(name, module)

    @staticmethod
    def get(name):
        details = Room.REDIS.hmget('room:%s' % name, ['module_user', 'module_name', 'module_version'])
        return Room(name, Module(details[0], details[1], details[2]))

    def __init__(self, name, module):
        self.name = name
        self.module = module

    def __eq__(self, other):
        return (self.name == other.name) and (self.module == other.module)

    def __repr__(self):
        return 'Room(%s,%s)' % (self.name, self.module)

if __name__ == '__main__':
    Room.REDIS = redis.StrictRedis(db=1)
    Room.REDIS.flushdb()

    a = Room.getall()
    assert list(a) == [], 'Test DB not empty'

    r = Room.add('one', Module('a', 'b', 'c'))

    b = list(Room.getall())
    assert len(b) == 1, 'Getall matched more than one thing'
    assert b[0] == r, 'Contents of getall not correct'

    c = Room.get(r.name)
    assert c == r, 'Contents of get not correct'

    Room.REDIS.flushdb()
