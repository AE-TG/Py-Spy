export function getInputTypes(fn: ((data: string) => void)) {
    const outputTypes: any[] = [true, 3.33, "blabla", false, -Infinity, ""];
    return outputTypes;
}

export function isPODInput(inputTypes: any[]) {
    return inputTypes.every(type => {
        switch(type.constructor) {
            case Boolean: {
                console.log("spy - boolean argument");
                break;
            }
            case Number: {
                console.log("spy - number argument");
                break;
            }
            case String: {
                console.log("spy - string argument");
                break;
            }
            default: {
                console.log("spy - non-POD argument, breaking");
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
                console.log("spy - generate bools");
                outputTypes.push([true, false, null]);
                break;
            }
            case Number: {
                console.log("spy - generate nums");
                outputTypes.push([0, Number.EPSILON, -Number.EPSILON, Number.MIN_VALUE, Number.MAX_VALUE, null]);
                break;
            }
            case String: {
                console.log("spy - generate strs");
                outputTypes.push(["", "'", "foo", "\n", null]);
                break;
            }
        }
    });
    return outputTypes;
}

export function testInputs(fn: ((data: string) => void), inputs: any[]) {
    return "spy found a possible error!"
}
