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

    def __init__(self, name, salt, _hash, colour):
        self.id = name
        self.salt = salt
        self.hash = _hash
        self.colour = colour

    def correct_password(self, password):
        return self.hash == hashlib.sha256(password + self.salt).digest().encode('hex')


class Config:
    DEBUG = True
    SECRET_KEY = 'abc'
    MODULE_PATH = './modules/'
    LOG_DIR = './logs/'

app = Flask(__name__)
app.config.from_object('mercury.Config')
app.config.from_envvar('MERCURY_CONFIG_PATH')

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.login_message = u'Please log in to access this page.'

red = redis.StrictRedis()


def get_user(username):
    details = red.hmget('user:%s' % username, ['salt', 'password', 'colour'])
    if None in details:
        return None
    return User(username, *details)


def get_rooms():
    return red.smembers('rooms')


def add_room(name):
    red.sadd('rooms', name)


@login_manager.user_loader
def load_user(username):
    return get_user(username)

login_manager.setup_app(app)


@app.route('/login/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        username = request.form['username']
        password = request.form['password']
        user = get_user(username)
        if user is not None and user.correct_password(password):
            if login_user(user, remember=True):
                flash('Logged in!', 'success')
                return redirect(url_for('index'))
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
    return render_template('index.html', user=current_user, page='index', rooms=get_rooms())


@app.route('/theme.css')
@login_required
def theme():
    return Response(render_template('theme.css', color=current_user.colour), mimetype='text/css')


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
    rooms = get_rooms()
    if _id is None:
        if request.method == 'GET':
            return jsonify(rooms=rooms)
        name = request.form['name']
        if name in rooms:
            return jsonify(error='A room with that name already exists'), 400
        add_room(name)
        return jsonify(room=name)
    _id = _id.replace('_', ' ')
    if _id not in rooms:
        return jsonify(error='No room with that name exists'), 400
    if request.method == 'GET':
        return Response(chat_stream(_id), mimetype="text/event-stream")
    user = current_user.id
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
                            if name == current_user.id:
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
    app.run(threaded=True)
