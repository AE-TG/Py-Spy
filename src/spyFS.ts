import * as vscode from 'vscode';


// Get a list of all spy decorated functions in the workspace.
// TODO The underlying data is asynchronous so later operations may operate on stale data. It likely returns an empty array the first time it's called.
type decoFnType = [file: string, func: string, ...args: string[]]
let spyFnList: decoFnType[] = [];
export function getSpyFns() {
    updateSpyFns();
    return spyFnList;
}

// Get a set of all python files in the workspace that contain a spy decoration.
// TODO The underlying data is asynchronous so later operations may operate on stale data. It likely returns an empty array the first time it's called.
export function getSpyFiles() {
    updateSpyFns();
    return new Set(spyFnList.map(decoType => decoType[0]));
}

function updateSpyFns() {
    let promisedList: Promise<decoFnType[]> = findSpyDecorators();
    promisedList.then(decoFnList => {
        spyFnList = decoFnList;
    });
}

async function findSpyDecorators() {
    let decoFnList: decoFnType[] = [];
    let pyFiles = vscode.workspace.findFiles("**/*.py");
    (await pyFiles).forEach(async file => {
        let doc: vscode.TextDocument = await vscode.workspace.openTextDocument(file);
        for(var lineIndex = 1; lineIndex < doc.lineCount; lineIndex++) {
            if (doc.lineAt(lineIndex).text.startsWith("def ")) {
                if (doc.lineAt(lineIndex - 1).text.startsWith("@spy")) {
                    let fName: string = trimFunctionName(doc.lineAt(lineIndex).text);
                    decoFnList.push([doc.fileName, fName]);
                }
            }
        }
    });
    return decoFnList;
}

function trimFunctionName(line: string) {
    let rv: string = line.split("def ")[1].split("(")[0];
    return rv;
}
