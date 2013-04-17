import random

altsep=None
curdir="."

def devnull():
    OSError('Function devnull not supported')

extsep='.'

def getloadavg():
    OSError('Function getloadavg not supported')

linesep="\n"
name="brython"
pathsep=";"
pardir=".."
sep='/'

def urandom(length):
    _c=[]
    for _i in range(length):
        _c.append(ord(random.randint(0,255)))
        
    return ''.join(_c)
