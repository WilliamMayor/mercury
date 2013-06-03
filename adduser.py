import getpass

from User import User

if __name__ == '__main__':
    users = list(User.getall())

    username = raw_input('Username: ')
    if username in [u.id for u in users]:
        print 'Username taken! Try again'
        exit(1)

    password = getpass.getpass('Password: ')

    colour = raw_input('Colour: ')
    if colour == '':
        colour = '1abc9c'

    User.add(username, password, colour)
