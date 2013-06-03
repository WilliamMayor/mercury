import os


class Module(object):

    PATH = './'

    @staticmethod
    def getall(current_user):
        for user in [d for d in os.listdir(Module.PATH) if os.path.isdir(os.path.join(Module.PATH, d))]:
            for name in [d for d in os.listdir(os.path.join(Module.PATH, user)) if os.path.isdir(os.path.join(Module.PATH, user, d))]:
                for version in [d for d in os.listdir(os.path.join(Module.PATH, user, name)) if os.path.isdir(os.path.join(Module.PATH, user, name, d))]:
                    if 'p' in version or user == current_user.id or current_user.isadmin:
                        yield Module(user, name, version)

    @staticmethod
    def exists(user, name, version):
        if user in os.listdir(Module.PATH):
            if name in os.listdir(os.path.join(Module.PATH, user)):
                if version in os.listdir(os.path.join(Module.PATH, user, name)):
                    return True
        return False

    def __init__(self, user, name, version):
        self.user = self.clean(user)
        self.name = self.clean(name)
        self.version = self.clean(version)
        self.path = os.path.join(Module.PATH, self.user, self.name, self.version)
        self._code = {}

    def __eq__(self, other):
        return (self.user == other.user) and (self.name == other.name) and (self.version == other.version)

    def __repr__(self):
        return 'Module(%s,%s,%s)' % (self.user, self.name, self.version)

    def clean(self, path):
        return path.replace('/', '')

    @property
    def encrypt(self):
        return self._load_code('encrypt.py')

    @encrypt.setter
    def encrypt(self, value):
        print 'saving encrypt'
        self._save_code('encrypt.py', value)

    @property
    def decrypt(self):
        return self._load_code('decrypt.py')

    @decrypt.setter
    def decrypt(self, value):
        self._save_code('decrypt.py', value)

    @property
    def hack(self):
        return self._load_code('hack.py')

    @hack.setter
    def hack(self, value):
        self._save_code('hack.py', value)

    def _load_code(self, filename):
        if filename not in self._code:
            with open(os.path.join(self.path, filename), 'r') as f:
                self._code[filename] = f.read()
        return self._code[filename]

    def _save_code(self, filename, code):
        if not os.path.exists(self.path):
            os.makedirs(self.path)
        with open(os.path.join(self.path, filename), 'w') as f:
            f.write(code)
        self._code[filename] = code
