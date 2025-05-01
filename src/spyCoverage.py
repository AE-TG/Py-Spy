import argparse
import coverage
import importlib
import marshal
import os
import py_compile
import sys
import spyInputs
import time
import types

# Python 3 implies UTF8 even if consoles suggest otherwise.
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def getcodeobjects(filename):
    pycfile = ""
    try:
        pycfile = py_compile.compile(filename, doraise=True)
    except Exception as ex:
        print("[E} Unable to load compile pycfile " + str(ex))
        time.sleep(0.2) # either the file does not compile (syntax error), or some other process is using it. wait a fraction to hope it gives it up.
    try:
        with open(pycfile, 'rb') as pyc:
            seek_bytes = 8
            if sys.version_info >= (3,2):
                seek_bytes += 4
            if sys.version_info >= (3,8):
                seek_bytes += 4
            pyc.seek(seek_bytes)  # skip over python magic numbers
            # python 3.1- requires 8 bytes
            # python 3.2 to 3.7 requires 12 bytes
            # python 3.8+ requires 16 bytes
            
            code_obj = marshal.load(pyc)
            return code_obj
    except Exception as ex:
        print("[E} Unable to load pyc file " + pycfile + str(ex))

def get_co(filename, ln):
    """
    Extract a code object matching the desired signature from the compiled source
    represented in args
    """
    code = getcodeobjects(filename)
    for byteline in code.co_consts:
        if type(byteline) is types.CodeType:
            if (byteline.co_firstlineno == ln):
                return byteline

def inputs(code_obj, func):
    """
    Helper function to get all possible interesting input combinations to test
    from spyInputs.py
    """
    (typelist, intlist, floatlist, strlist) = spyInputs.typehints(code_obj, func)
    allinputs = spyInputs.generate_inputs(typelist, ints=intlist, floats=floatlist, strs=strlist)
    iter = spyInputs.input_iterator(allinputs)
    return iter

def load_module(args):
    module_name = 'PySpy_test_module'
    spec = importlib.util.spec_from_file_location(module_name, args.filename)
    if spec is None:
        print("[E} Unable to create module from "+ args.filename)
        sys.exit(1)
    
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return mod

def reportname(args):
    return str(args.filename) + ".covjson"

def test(args):
    if sys.version_info < (3,9):
        print("Python version does not support coverage. Please upgrade to Python 3.9 or later!")
        sys.exit(126)
    try:
        mod = load_module(args)
        try:
            cov = coverage.Coverage()
            # exclude comments and exception lines
            # cov.exclude(r"^\s*#.*\n")
            cov.exclude(r"\sexcept .* as .*")
            cov.exclude(r"\sexcept:")
            for ln in args.evallines:
                # iterate over inputs
                try:
                    co_ = get_co(args.filename, ln)
                    for inputset in inputs(co_, getattr(mod, co_.co_name)):
                        try:
                            # run the code
                            cov.start()
                            getattr(mod, co_.co_name)(*inputset)
                            cov.stop()
                            # unary * is the unpack operator in python,
                            # equivalent to ... spread operator in other languages
                        except Exception as ex:
                            print("[W} Testing function at line " + str(ln) + " " + str(ex) + " error with inputs " + str(inputset))
                except Exception as ex:
                    print("[E} " + str(ln) + " Could not generate inputs for test. Function under test may not have been found. " + str(ex))
            try:
                cov.json_report(morfs=args.filename, outfile=reportname(args), pretty_print=True)
            except Exception as ex:
                print("[E} " + str(ln) + " Coverage was unable to output summaryfile. " + str(ex))
                return
        except Exception as ex:
            print("[E} Could not start coverage.py for testing. Is it installed? " + str(ex))
    except Exception as ex:
        for ln in args.evallines:
            print("[E} " + str(ln) + " Unable to load code under test into namespace or module. Check for syntax errors. " + str(ex))


parser = argparse.ArgumentParser()
parser.add_argument('-w', '--workspace', dest='workspace', required=True, action='store', type=str) # workspace for module imports
parser.add_argument('-f', '--file', dest='filename', required=True, action='store', type=str) # python source file
parser.add_argument('-l', '--lines', dest='evallines', required=True, action='store', type=int, nargs='*') # line number of function(s) under test
args = parser.parse_args()
os.chdir(args.workspace)
# python may or may not care what cwd is when it checks for modules, but it does care what the path is.
directory1 = os.path.dirname(args.filename)
directory2 = args.workspace
if directory1 not in sys.path:
    sys.path.insert(0, directory1)
if directory2 not in sys.path:
    sys.path.insert(1, directory2)
test(args)
