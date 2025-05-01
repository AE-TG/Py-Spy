import inspect
import itertools
import math
import sys

# Python 3 implies UTF8 even if consoles suggest otherwise.
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def typehints(code_obj, func):
    """
    Returns a 4-tuple of lists of types and constants in the provided code object argument using the
    signature of the function that is the second argument. Unfortunately Python does not have any way
    of translating a code object representing a function into that function so we make no guarantee
    that the two arguments are related and just do the best we can.
    - First element is a list of the types of arguments to the function that the code object represents.
    - Second element is a list of integer constants found in the code object.
    - Third element is a list of the float constants found in the code object.
    - Fourth element is a list of the string constants found in the code object.
    Any list in the resultant 4-tuple may be empty.
    """

    typelist = []
    sig = inspect.signature(func)
    for p in sig.parameters.values():
        # ref PEP 362
        type_ = p.annotation
        if type_ is p.empty or not inspect.isclass(type_):
            # Missing annotation or not a type
            # Check for default value and assume from that
            if p.default is not p.empty:
                type_ = type(p.default)
            else:
                type_ = None
        typelist.append(type_)

    all_consts = code_obj.co_consts
    intlist = []
    floatlist = []
    strlist = []
    for c in all_consts:
        if (c is None):
            pass
        elif (type(c) is int):
            intlist.append(c)
        elif (type(c) is float):
            floatlist.append(c)
        elif (type(c) is str):
            strlist.append(c)
        # else is an unsupported type, we just have to assume it is correct

    return (typelist, intlist, floatlist, strlist)


def generate_inputs(args, ints=[], floats=[], strs=[], dangerous_strings=False):
    """
    For each element in the input arguments, attempt to determine its type.
    Returns a list with length matching the number of input arguments,
    where each element is itself a list of:
     - commonly mishandled values of the detected type, plus any provided additional special
       test values for the main builtin numeric types (`int`s and `float`s) or text type (`str`s),
       plus commonly mishandled values related to the provided special test values.
     - if the type is not one of the basic types or a bool, attempts to return a default-constructed
       object of that type, or nothing (an empty list) if not possible.
    """
    outputs = []
    for arg in args:
        if (arg is None or type(arg) is None):
            outputs.append([])
        if (arg is bool or type(arg) is bool):
            booltypes = [True, False]
            outputs.append(booltypes)
        elif (arg is int or type(arg) is int):
            # In Python, unlike other languages, `None` is a NoneType and not a lack of value in some other type (looking at you, C). We exclude it from testing to avoid spurious errors in user code.
            inttypes = [-1, 1, 0, sys.maxsize, -sys.maxsize - 1, 13, 255, 256, 257, 65535, 65536, 65537, 2147483647]
            inttypes.extend(ints)
            inttypes.extend(list(map(lambda x: x + 1, ints)))
            inttypes.extend(list(map(lambda x: x - 1, ints)))
            outputs.append(inttypes)
        elif (arg is float or type(arg) is float):
            # A similar argument can be made that float('nan') float('inf') are not useful floats to test with and thus should not be tested to avoid spurious errors.
            # A user concerned with nans/infs really should be implementing their own tests and guards anyway.
            floattypes = [0, 1, sys.float_info.epsilon, sys.float_info.min, sys.float_info.max, math.e, math.ulp(0)]
            floattypes.extend(list(map(lambda x: -x, floattypes)))
            floattypes.extend(floats)
            floattypes.extend(list(map(lambda x: x + math.ulp(0), floats)))
            floattypes.extend(list(map(lambda x: x - math.ulp(0), floats)))
            floattypes.extend(list(map(lambda x: x + sys.float_info.epsilon, floats)))
            floattypes.extend(list(map(lambda x: x - sys.float_info.epsilon, floats)))
            outputs.append(floattypes)
        elif (arg is str or type(arg) is str):
            strtypes = ["", "'", "\"", "\r\n", "\n", "admin", "password", "12345", "\0", "\0foo", "\\", "\u0394", "a\xac\u1234\u20ac\U00008000", "None", "null", "False", "True"]
            strtypes.extend(strs)
            strtypes.extend(list(map(lambda x: str(x), ints)))
            strtypes.extend(list(map(lambda x: str("x"*x), ints)))
            strtypes.extend(list(map(lambda x: str("x"*(x + 1)), ints)))
            strtypes.extend(list(map(lambda x: str("x"*(x - 1)), ints)))
            # Mangling string literals is unlikely to provide additional useful values to test, so don't do anything weird with the special test values.
            if (dangerous_strings):
                danger_strs = ["*", "**", "*.*", "**.**", "**/**", ".*", "(.*)", "(?s).*", "[^]*", "[\s\S]*"]
                strtypes.extend(danger_strs)
            outputs.append(strtypes)
        else: # attempt to default construct the type
            t = None
            try:
                t = arg.__new__()
            except:
                try:
                    t = type(arg).__new__(type(arg))
                except:
                    pass
            finally:
                if (t is not None):
                    outputs.append([t])
                else:
                    outputs.append([])
        # TODO - it's probably possible to extend this to sequence types (list, tuple, range) by making some assumptions based on
        # the first element of the argument, but then we get into recursive resolution and exponential explosion.
        # Maybe limit to depth 1 which probably covers most code.
    return outputs

def input_iterator(inputlistoflists):
    return itertools.product(*inputlistoflists)
