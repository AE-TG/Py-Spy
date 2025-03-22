import * as vscode from 'vscode';
import * as spyCompile from './spyCompile';
import * as spyStatistics from './spyStatistics';
import * as spyFS from './spyFS';
import * as spyInputs from './spyInputs';
import * as spyUI from './spyUI';


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
export function scanCC(fileName: string = "") {
    if (fileName) {
        spyStatistics.generateRadonCache([fileName]);
    }
    else {
        spyStatistics.generateRadonCache(spyFS.getSpyFiles());
    }
}
export function provideHover(file: vscode.TextDocument, pos: vscode.Position, cancel: vscode.CancellationToken) : vscode.ProviderResult<vscode.Hover> {
    for (let highlight of spyUI.getSpyDecos()) {
        if (highlight[0] == file) {
            if (highlight[1].contains(pos)) {
                return new Promise<vscode.Hover>(resolve => {
                    resolve(spyStatistics.getComplexity(highlight, cancel));
                });
            }
        }
    };
    return null;
}

function runAll(ctx: vscode.ExtensionContext) {
    //TODO check timing loop and adjust or run on user trigger

    // Precompile python code as a simple way to check syntax errors.
    spyCompile.build();

    // Perform static analysis.
    analyze(ctx);
    //TODO yes this is unbelievably drastically simplified for now

    // For decorated functions, test interesting input values to check for edge cases or unintended values/throws.
    spyCompile.functionAnalysis(ctx);

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

function analyze(ctx: vscode.ExtensionContext) {
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


