import * as spyMarshal from './spyMarshal';


export function getInputTypes(fSignature: string) {
    // TODO this needs to rely on python marshalling + inspect to get the arg types
    // and return an array of example output types for generateInputs().

    // for python object methods (ie, `self` as an argument), we must fail a POD check
    // because we can't reasonably construct an object (even if the object is ultimately POD)
    // that represents every combination of data values.

    const outputTypes: any[] = [true, 3.33, "blabla", false, -Infinity, ""];
    return outputTypes;
}

export function isPODInput(inputTypes: any[]) {
    return inputTypes.every(type => {
        switch(type.constructor) {
            case Boolean: {
                break;
            }
            case Number: {
                break;
            }
            case String: {
                break;
            }
            default: {
                return false;
                break;
            }
        }
        return true;
    });
}

export function generateInputs(inputTypes: any[]) {
    let outputTypes: any[] = [];
    inputTypes.forEach(type => {
        switch(type.constructor) {
            case Boolean: {
                outputTypes.push([true, false, null]);
                break;
            }
            case Number: {
                outputTypes.push([0, Number.EPSILON, -Number.EPSILON, Number.MIN_VALUE, Number.MAX_VALUE, null]);
                break;
            }
            case String: {
                outputTypes.push(["", "'", "foo", "\n", null]);
                break;
            }
            case Array: {
                // TODO
                break;
            }
        }
    });
    return outputTypes;
}

export function testInputs(fn: ((data: string) => void), inputs: any[]) {
    return "spy found a possible error!"
}
