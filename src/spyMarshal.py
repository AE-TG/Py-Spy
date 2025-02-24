import argparse
import marshal

def split_module(m):
    return (m.co_consts)

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

#print(code_obj.co_name)
#print(code_obj.co_qualname)
#print(code_obj.co_argcount)
#print(code_obj.co_varnames)
#print(code_obj.co_consts)

rv = split_module(code_obj)
for x in rv:
    if x:
        print(x.co_name)
#    print("consts" + x.co_consts)
#print("consts" + str(rv[0].co_consts))

