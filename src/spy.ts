import * as vscode from 'vscode';
import * as spyInputs from './spyInputs';
import * as spyUI from './spyUI';

let intervalID: NodeJS.Timeout;
export function run(enable: boolean, intervalSeconds: number = 15 ) {
    if (intervalID) {
        console.log("stopping spy");
        clearInterval(intervalID);
    }
    if (enable) {
        console.log("starting spy");
        runAll();
        intervalID = setInterval(() => {
            runAll()
        }, intervalSeconds * 1000);
    }
}

function runAll() {
    // Add extension UI elements.
    spyUI.scan();

    //TODO check timing loop and adjust or run on user trigger

    // Precompile python code as a simple way to check syntax errors.
    pyCompile();

    // Perform static analysis.
    analyze();
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

//TODO - nothing below this line is real
function getStatistics() {
    //TODO complexity
    //TODO code coverage
    //TODO % decorated functions
    //TODO const literals
    //TODO nested calls
    //TODO timing?
    return 0;
}

function analyze() {
    return false;
}

