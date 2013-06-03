import fcntl

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


class Config:
    DEBUG = True
    SECRET_KEY = 'abc'
    MODULE_PATH = './modules/'
    LOG_DIR = './logs/'

app = Flask(__name__)
app.config.from_object('mercury.Config')
app.config.from_envvar('MERCURY_CONFIG_PATH')
Module.PATH = app.config['MODULE_PATH']

red = redis.StrictRedis()

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


@app.route('/api/modules/', methods=['GET'])
@app.route('/api/modules/<user>/<name>/<version>/', methods=['GET', 'POST'])
@login_required
def modules(user=None, name=None, version=None):
    if None in [user, name]:
        return jsonify(modules=Module.getall(current_user))
    version = request.form.get('version', version)
    m = Module(user, name, version)
    if request.method == 'GET':
        if not (user == current_user.id or current_user.isadmin or (version is not None and version.endswith('p'))):
            return jsonify(error='Not authorised'), 403
        if not Module.exists(user, name, version):
            return jsonify(error='no module of that name'), 404
    else:
        if user != current_user.id:
            return jsonify(error='Not authorised'), 403
        m.encrypt = request.form['encrypt']
        m.decrypt = request.form['decrypt']
        m.hack = request.form['hack']
    return jsonify(module=dict(
        user=user,
        name=name,
        version=version,
        encrypt=m.encrypt,
        decrypt=m.decrypt,
        hack=m.hack))


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
    return jsonify(module=dict(
        user=user,
        name=name,
        version=version,
        encrypt=m.encrypt,
        decrypt=m.decrypt,
        hack=m.hack))


@app.route('/api/chat/', methods=['GET', 'POST'])
@app.route('/api/chat/<path:_id>/', methods=['GET', 'POST'])
@login_required
def chat(_id=None):
    if _id is None:
        if request.method == 'GET':
            return jsonify(rooms=Room.getall())
        name = request.form['name']
        module = Module(request.form['module_user'],
                        request.form['module_name'],
                        request.form['module_version'])
        try:
            Room.get(name)
        except:
            Room.add(name, module)
        return jsonify(room=dict(name=name))
    try:
        Room.get(_id)
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
    except:
        return jsonify(error='No room with that name exists'), 400


@app.route('/api/chat/<path:_id>/code/')
@login_required
def chat_worker(_id):
    r = Room.get(_id)
    if r.module is None:
        return jsonify(error='no module of that name'), 404
    return jsonify(module=dict(
        user=r.module.user,
        name=r.module.name,
        version=r.module.version,
        encrypt=r.module.encrypt,
        decrypt=r.module.decrypt))


def chat_stream(name):
    pubsub = red.pubsub()
    pubsub.subscribe(name)
    # TODO: handle client disconnection.
    for message in pubsub.listen():
        yield 'data: %s\n\n' % message['data']

if __name__ == '__main__':
    app.run(threaded=True)
