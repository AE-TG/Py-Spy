import * as vscode from 'vscode';
import * as spyInputs from './spyInputs';
import * as spyUI from './spyUI';
import { PythonShell } from 'python-shell'

let intervalID: NodeJS.Timeout;
export function run(ctx: vscode.ExtensionContext, enable: boolean, intervalSeconds: number = 15) {
    if (intervalID) {
        console.log("stopping spy");
        clearInterval(intervalID);
    }
    if (enable) {
        console.log("starting spy");
        runAll(ctx);
        intervalID = setInterval(() => {
            runAll(ctx)
        }, intervalSeconds * 1000);
    }
}

export function setupUI(ctx: vscode.ExtensionContext) {
    spyUI.createDecorations(ctx);
    spyUI.updateDecorations(ctx, 1);
}
export function scanUI(ctx: vscode.ExtensionContext) {
    spyUI.updateDecorations(ctx, 1000);
}

function runAll(ctx: vscode.ExtensionContext) {
    //TODO check timing loop and adjust or run on user trigger

    // Start producing a list of all decorated functions in the workspace.
    // TODO This is asynchronous so later operations may operate on stale data.
    updateSpyFns();

    // Precompile python code as a simple way to check syntax errors.
    pyCompile();

    // Perform static analysis.
    analyze(ctx);
    //TODO yes this is unbelievably drastically simplified for now

    // For decorated functions, test interesting input values to check for edge cases or unintended values/throws.
    functionAnalysis(ctx);
    
    /*
    decoratedFns.forEach(fn => {
        let inputTypes = spyInputs.getInputTypes(fn);
        if (spyInputs.isPODInput(inputTypes)) {
            spyInputs.testInputs(fn, spyInputs.generateInputs(inputTypes));
        }
    });
    */

    // Compute some statistics.
    getStatistics();
}

type decoFnType = [file: string, func: string, ...args: string[]]
let spyFnList: decoFnType[] = [];
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

function pyCompile() {
    vscode.window.showInformationMessage('PySpy: compiling in background.');
    const opt = {} as vscode.TerminalOptions;
    opt.location = vscode.TerminalLocation.Panel;
    opt.hideFromUser = true;
    opt.isTransient = true;
    const term = vscode.window.createTerminal(opt);
    const spySet = new Set(spyFnList.map(decoType => decoType[0]));
    spySet.forEach(file => {
        console.log("PySpy: attempting to compile " + file);
        term.sendText('python -m py_compile ' + file, true);
    });
    //term.dispose();

    //TODO AST here?
}

function analyze(ctx: vscode.ExtensionContext) {
    return false;
}

async function functionAnalysis(ctx: vscode.ExtensionContext) {
    let wsPath = vscode.workspace.rootPath;
    let options = {
        scriptPath: ctx.extensionPath,
        args: ["-f", wsPath+"/__pycache__/main.cpython-312.pyc"]
        // TODO hardcoded build :(
    };

    let fList: string[] = []
    await PythonShell.run("src/spyMarshal.py", options).then(messages => {
        messages.forEach(msg => {
            console.log("spyMarshal found python function: " + msg);
            fList.push(msg);
        });
    });
    fList = fList.filter((fn) => spyFnList.map(decoType => decoType[1]).includes(fn));
    console.log(fList);
    return fList;
}

function getStatistics() {
    //TODO complexity
    //TODO code coverage
    //TODO % decorated functions
    //TODO const literals
    //TODO nested calls
    //TODO timing?
    return 0;
}

function trimFunctionName(line: string) {
    let rv: string = line.split("def ")[1].split("(")[0];
    console.log(rv);
    return rv;
}
