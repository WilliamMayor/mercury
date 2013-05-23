import hashlib
import os
import fcntl

import redis

from flask import (
    Flask,
    render_template,
    request,
    flash,
    url_for,
    redirect,
    jsonify,
    Response)
from flask.ext.login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
    UserMixin)


class User(UserMixin):

    def __init__(self, _id, name, salt, _hash):
        self.id = _id
        self.name = name
        self.salt = salt
        self.hash = _hash

    def correct_password(self, password):
        return self.hash == hashlib.sha256(password + self.salt).digest()


class Config:
    DEBUG = True
    SECRET_KEY = 'abc'
    THREADED = True
    USERS = [
        # username: User, password: password
        (1, u'User', 'salt', 'z7\xb8\\\x89\x18\xea\xc1\x9a\x90\x89\xc0\xfaZ*\xb4\xdc\xe3\xf9\x05(\xdc\xde\xec\x10\x8b#\xdd\xf3`{\x99')
    ]
    MODULE_PATH = './modules/'
    ROOMS = []
    LOG_DIR = './logs/'


app = Flask(__name__)
app.config.from_object('mercury.Config')
app.config.from_envvar('MERCURY_CONFIG_PATH')

USERS = dict((_id, User(_id, name, salt, _hash)) for _id, name, salt, _hash in app.config['USERS'])
USER_NAMES = dict((u.name, u) for u in USERS.itervalues())

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.login_message = u'Please log in to access this page.'

red = redis.StrictRedis()


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
    return render_template('index.html', user=current_user, page='index', rooms=app.config['ROOMS'])


@app.route('/api/modules/', methods=['GET', 'POST'])
@app.route('/api/modules/<_id>/', methods=['GET', 'POST'])
@login_required
def modules(_id=None):
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
    path = os.path.join(app.config['MODULE_PATH'], current_user.name, request.form['name'], request.form['version'])
    if not os.path.exists(path):
        os.makedirs(path)
    for m in ['encrypt', 'decrypt', 'hack']:
        with open(os.path.join(path, m + '.py'), 'w') as f:
            f.write(request.form[m])
    return jsonify(modules=get_available_modules())


@app.route('/api/chat/', methods=['GET', 'POST'])
@app.route('/api/chat/<_id>/', methods=['GET', 'POST'])
@login_required
def chat(_id=None):
    if _id is None:
        if request.method == 'GET':
            return jsonify(rooms=app.config['ROOMS'])
        name = request.form['name']
        if name in app.config['ROOMS']:
            return jsonify(error='A room with that name already exists'), 400
        app.config['ROOMS'].append(name)
        return jsonify(room=name)
    if _id not in app.config['ROOMS']:
        return jsonify(error='No room with that name exists'), 400
    if request.method == 'GET':
        return Response(chat_stream(_id), mimetype="text/event-stream")
    user = current_user.name
    message = u'[%s]: %s' % (user, request.form['message'])
    red.publish(_id, message)
    with open(app.config['LOG_DIR'] + '/' + _id + '.log', 'a') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(message + '\n')
        fcntl.flock(f, fcntl.LOCK_UN)
    return jsonify(success='message posted')


def chat_stream(name):
    pubsub = red.pubsub()
    pubsub.subscribe(name)
    # TODO: handle client disconnection.
    for message in pubsub.listen():
        yield 'data: %s\n\n' % message['data']


def get_available_modules():
    '''
    {user: {module: {version: id}, ...}, public: {name: {module: {version: id}, ...}}}
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
    app.run(threaded=True, host='0.0.0.0')
