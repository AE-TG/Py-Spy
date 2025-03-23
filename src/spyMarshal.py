import argparse
import inspect
import marshal
import types

parser = argparse.ArgumentParser()
parser.add_argument('-f', dest='filename', type=str)
args = parser.parse_args()
#print(args.filename)

pyc = open(args.filename, 'rb')
pyc.seek(16)  # skip over python magic numbers
#TODO - python 3.2- requires 8 bytes
#TODO - python 3.3 to 3.6 requires 12 bytes
#TODO - python 3.7+ requires 16 bytes
code_obj = marshal.load(pyc)

for x in code_obj.co_consts:
    if x:
        if type(x) is types.CodeType:
            #TODO package for spyCompile to pick up at higher level
            print("co_name: " + str(x.co_name))
            print("co_argcount: " + str(x.co_argcount))
            print("co_varnames: " + str(x.co_varnames))
            print("co_consts: " + str(x.co_consts))
