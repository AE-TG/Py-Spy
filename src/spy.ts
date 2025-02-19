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

    // Precompile python code as a simple way to check syntax errors.
    pyCompile();

    // Perform static analysis.
    analyze(ctx);
    //TODO yes this is unbelievably drastically simplified for now
    let decoratedFns: Array<(data: string) => void> = [];
    decoratedFns.push(pyCompile);

    // For decorated functions, test interesting input values to check for edge cases or unintended values/throws.
    //TODO
    decoratedFns.forEach(fn => {
        let inputTypes = spyInputs.getInputTypes(fn);
        if (spyInputs.isPODInput(inputTypes)) {
            spyInputs.testInputs(fn, spyInputs.generateInputs(inputTypes));
        }
    });

    // Compute some statistics.
    getStatistics();
}

function pyCompile() {
    vscode.window.showInformationMessage('Compiling in background.');
    //TODO only compile decorated fns
    const opt = {} as vscode.TerminalOptions;
    opt.location = vscode.TerminalLocation.Panel;
    opt.hideFromUser = true;
    opt.isTransient = true;
    const term = vscode.window.createTerminal(opt);
    term.sendText('python -m compileall .', true);
    //term.dispose();

    //TODO AST here?
}

function analyze(ctx: vscode.ExtensionContext) {
    let wsPath = vscode.workspace.rootPath;
    let options = {
        scriptPath: ctx.extensionPath,
        args: ["-f", wsPath+"/__pycache__/main.cpython-312.pyc"]
    };
    PythonShell.run("src/spyMarshal.py", options).then(messages => {
        messages.forEach(msg => {
            console.log(msg);
        });
    });
    
    //TODO
    return false;
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
