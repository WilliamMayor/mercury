import hashlib
import os

from flask import (
    Flask,
    render_template,
    request,
    flash,
    url_for,
    redirect,
    jsonify)
from flask.ext.login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
    UserMixin,
    AnonymousUser,
    confirm_login,
    fresh_login_required)


class User(UserMixin):

    def __init__(self, _id, name, salt, _hash):
        self.id = _id
        self.name = name
        self.salt = salt
        self.hash = _hash

    def correct_password(self, password):
        return self.hash == hashlib.sha256(password + self.salt).digest()


class Config:
    DEBUG = False
    SECRET_KEY = 'Dl^\x01\x88\xe2w\x93\xab\xccP\x04\xb1\xeb~\xf6v\xe2u\x82\xcc5\x7fk'
    USERS = [
        (1, u'User 1', 'abcde', '\x85\t\x15\xeb\xef\x89\xde\xc1\xd0\xf4O\x80\ryT\xf0\x07\xe6\x0bP\xa0\x18?;H\xcb\xa9\xf0\xfe\xd1z\x06'),
        (2, u'User 2', 'fghij', '\xee\xa3\xa1\xb1\xa8w*\xfd\xdfW\xd7\xa8\xbaL\xb4\x9e\xb3\xd7bN\xb0\x04\xe7\xa8f5\xc5\x1f\xa1\xc9H\x9b'),
    ]
    MODULE_PATH = './modules/'

app = Flask(__name__)
app.config.from_object('mercury.Config')
app.config.from_envvar('MERCURY_CONFIG_PATH')

USERS = dict((_id, User(_id, name, salt, _hash)) for _id, name, salt, _hash in app.config['USERS'])
USER_NAMES = dict((u.name, u) for u in USERS.itervalues())

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.login_message = u'Please log in to access this page.'


@login_manager.user_loader
def load_user(id):
    return USERS.get(int(id))

login_manager.setup_app(app)


@app.route('/login/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        username = request.form['username']
        password = request.form['password']
        if username in USER_NAMES and USER_NAMES[username].correct_password(password):
            if login_user(USER_NAMES[username], remember=True):
                flash('Logged in!', 'success')
                return redirect(url_for('index'))
            else:
                flash('Sorry, but you could not log in.', 'error')
        else:
            flash('Invalid username or password', 'error')
    return render_template('login.html', page='login')


@app.route('/logout/')
@login_required
def logout():
    logout_user()
    flash('Logged out.', 'success')
    return redirect(url_for('login'))


@app.route('/')
@login_required
def index():
    current_user.modules = get_available_modules()
    return render_template('index.html', user=current_user, page='index')


def get_available_modules():
    '''
    {user: {module: {version: id}, ...}, public: {module: {version: id}, ...}}
    '''
    modules = dict(public={}, user={})
    try:
        path_n = app.config['MODULE_PATH']
        for name in os.listdir(path_n):
            try:
                path_m = os.path.join(path_n, name)
                for module in os.listdir(path_m):
                    try:
                        path_v = os.path.join(path_m, module)
                        for version in os.listdir(path_v):
                            if not os.path.isdir(os.path.join(path_v, version)):
                                continue
                            mid = '-'.join([name, module, version])
                            if name == current_user.name:
                                try:
                                    modules['user'][module][version] = mid
                                except KeyError:
                                    modules['user'][module] = {version: mid}
                            elif version.endswith('p'):
                                try:
                                    modules['public'][name][module][version] = mid
                                except KeyError:
                                    try:
                                        modules['public'][name][module] = {version: mid}
                                    except KeyError:
                                        modules['public'][name] = {module: {version: mid}}
                    except:
                        pass
            except:
                pass
    except:
        pass
    return modules


@app.route('/api/modules/')
@app.route('/api/modules/<_id>/')
def modules(_id=None, methods=['GET', 'POST', 'PUT']):
    if request.method == 'GET':
        modules = get_available_modules()
        if _id is None:
            return jsonify(modules=modules)
        else:
            if id_in_modules(modules, _id):
                parts = _id.split('-')
                path = os.path.join(app.config['MODULE_PATH'], parts[0], parts[1], parts[2])
                return jsonify(module=get_module(path, _id))
            return jsonify(error='no module of that name'), 404


def id_in_modules(modules, _id):
    if isinstance(modules, basestring):
        return modules == _id
    else:
        is_in = False
        for val in modules.values():
            is_in |= id_in_modules(val, _id)
        return is_in


def get_module(path, name):
    m = dict(name=name)
    for p in ['encrypt', 'decrypt', 'hack']:
        with open(os.path.join(path, p + '.py'), 'r') as f:
            m[p] = f.read()
    return m

if __name__ == '__main__':
    app.run()
