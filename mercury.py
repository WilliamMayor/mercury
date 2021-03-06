import logging
import os

import redis

from Room import Room
from User import User
from Module import Module

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
    logout_user)

from gevent import monkey
monkey.patch_all()


class Config:
    DEBUG = True
    SECRET_KEY = 'abc'
    MODULE_PATH = './modules/'
    LOG_DIR = './logs/'

app = Flask(__name__)
app.config.from_object('mercury.Config')
app.config.from_envvar('MERCURY_CONFIG_PATH')
Module.PATH = app.config['MODULE_PATH']

pool = redis.ConnectionPool()
Room.REDIS = redis.Redis(connection_pool=pool)
User.REDIS = redis.Redis(connection_pool=pool)

for r in Room.getall():
    l = logging.getLogger(r.name)
    h = logging.FileHandler(os.path.join(app.config['LOG_DIR'], r.name + '.log'))
    l.setLevel(logging.INFO)
    l.addHandler(h)


login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.login_message = u'Please log in to access this page.'


@login_manager.user_loader
def load_user(username):
    try:
        return User(username)
    except:
        return None

login_manager.setup_app(app)


@app.route('/login/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        username = request.form['username']
        password = request.form['password']
        try:
            user = User(username)
            if not user.correct_password(password):
                flash('Invalid username or password', 'error')
            if login_user(user, remember=True):
                flash('Logged in!', 'success')
                return redirect(url_for('index'))
        except:
            pass
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
    current_user.modules = list(Module.getall(current_user))
    return render_template('index.html', user=current_user, page='index', rooms=list(Room.getall()))


@app.route('/theme.css')
@login_required
def theme():
    return Response(render_template('theme.css', color=current_user.colour, users=User.getall()), mimetype='text/css')


@app.route('/api/modules/<user>/<name>/<version>/', methods=['GET'])
@login_required
def modules_get(user, name, version):
    if not (user == current_user.id or current_user.isadmin or (version is not None and version.endswith('p'))):
        return jsonify(error='Not authorised'), 403
    if not Module.exists(user, name, version):
        return jsonify(error='no module of that name'), 404
    m = Module(user, name, version)
    return jsonify(module=dict(
        user=user,
        name=name,
        version=version,
        encrypt=m.encrypt,
        decrypt=m.decrypt,
        hack=m.hack,
        comms=m.comms))


@app.route('/api/modules/', methods=['GET'])
@login_required
def modules_list():
    return jsonify(modules=Module.getall(current_user))


@app.route('/api/modules/', methods=['POST'])
@login_required
def modules_save():
    user = current_user.id
    name = request.form['name']
    version = request.form['version']
    m = Module(user, name, version)
    m.encrypt = request.form['encrypt']
    m.decrypt = request.form['decrypt']
    m.hack = request.form['hack']
    m.comms = request.form['comms']
    return jsonify(module=dict(
        user=user,
        name=name,
        version=version,
        encrypt=m.encrypt,
        decrypt=m.decrypt,
        hack=m.hack,
        comms=m.comms))


@app.route('/api/chat/<path:_id>/', methods=['POST'])
@login_required
def chat_add(_id):
    try:
        Room.get(_id)
    except:
        return jsonify(error='No room with that name exists'), 400
    user = current_user.id
    message = u'[%s]: %s' % (user, request.form['message'])
    l = logging.getLogger(_id)
    l.info(message)
    red = redis.Redis(connection_pool=pool)
    red.publish(_id, message)
    return jsonify(success='message posted')


@app.route('/api/chat/', methods=['GET'])
@login_required
def chat_list():
    return jsonify(rooms=Room.getall())


@app.route('/api/chat/', methods=['POST'])
@login_required
def chat_get_or_create():
    name = request.form['name']
    module = Module(request.form['module_user'],
                    request.form['module_name'],
                    request.form['module_version'])
    try:
        Room.get(name)
    except:
        Room.add(name, module)
        l = logging.getLogger(name)
        h = logging.FileHandler(os.path.join(app.config['LOG_DIR'], name + '.log'))
        l.setLevel(logging.INFO)
        l.addHandler(h)
    return jsonify(room=dict(name=name))


def stream(name):
    red = redis.Redis(connection_pool=pool)
    pubsub = red.pubsub()
    try:
        pubsub.subscribe(name)
        for message in pubsub.listen():
            yield 'data: %s\n\n' % message['data']
    except:
        pubsub.unsubscribe(name)


@app.route('/api/chat/<path:_id>/', methods=['GET'])
@login_required
def chat_stream(_id):
    try:
        Room.get(_id)
    except:
        return jsonify(error='No room with that name exists'), 400
    return Response(stream(_id), mimetype="text/event-stream")


@app.route('/api/chat/<path:_id>/code/')
@login_required
def chat_code(_id):
    r = Room.get(_id)
    if r.module is None:
        return jsonify(error='no module of that name'), 404
    return jsonify(module=dict(
        user=r.module.user,
        name=r.module.name,
        version=r.module.version,
        encrypt=r.module.encrypt,
        decrypt=r.module.decrypt,
        comms=r.module.comms))


@app.route('/logs/<path:_id>/', methods=['GET'])
@login_required
def logs(_id):
    if not current_user.isadmin:
        flash('Not permitted', 'error')
        return redirect(url_for('index'))
    with open(app.config['LOG_DIR'] + '/' + _id + '.log', 'r') as f:
        return render_template('logs.html', logs=f.readlines())


@app.route('/adduser/', methods=['POST'])
@login_required
def adduser():
    if not current_user.isadmin:
        flash('Not permitted', 'error')
        return redirect(url_for('index'))
    username = request.form['username']
    password = request.form['password']
    colour = request.form['colour']

    users = list(User.getall())
    if username in [u.id for u in users]:
        flash('Username taken', 'error')
        return redirect(url_for('index'))
    try:
        User.add(username, password, colour)
        flash('User added!', 'success')
        return redirect(url_for('index'))
    except:
        flash('Could no create user', 'error')
        return redirect(url_for('index'))
