import * as vscode from 'vscode';
import * as spyCompile from './spyCompile';
import * as spyFS from './spyFS';
import * as spyInputs from './spyInputs';
import * as spyStatistics from './spyStatistics';
import * as spyTesting from './spyTesting';
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
    spyUI.updateDecorations(ctx, 0);
}
export function scanUI(ctx: vscode.ExtensionContext) {
    spyUI.updateDecorations(ctx);
}
export function scanCC(ctx?: vscode.ExtensionContext, doc?: vscode.TextDocument) {
    if (ctx && doc) {
        // A specific file was opened or saved.

        spyUI.updateDecorations(ctx, 0);
        spyStatistics.generateRadonCache([doc.fileName]);
        spyCompile.build(doc);
        // TODO
        spyCompile.functionAnalysis(ctx); // For decorated functions, test interesting input values to check for edge cases or unintended values/throws.
        // end TODO
        spyTesting.generateTestResults(spyUI.getSpyDecos(doc));
        spyUI.updateDecorations(ctx); // update again to collect the test results
    }
    else {
        spyStatistics.generateRadonCache(spyFS.getSpyFiles());
        spyCompile.build();
    }
}
export function provideHover(file: vscode.TextDocument, pos: vscode.Position, cancel: vscode.CancellationToken) : vscode.ProviderResult<vscode.Hover> {
    for (let highlight of spyUI.getSpyDecos(file)) {
        if (highlight[1].contains(pos)) {
            return new Promise<vscode.Hover>(resolve => {
                resolve(spyStatistics.getComplexity(highlight, cancel));
            });
        }
    };
    return null;
}

function runAll(ctx: vscode.ExtensionContext) {
    //TODO check timing loop and adjust or run on user trigger

    /*
    decoratedFns.forEach(fn => {
        let inputTypes = spyInputs.getInputTypes(fn);
        if (spyInputs.isPODInput(inputTypes)) {
            spyInputs.testInputs(fn, spyInputs.generateInputs(inputTypes));
        }
    });
    */

}

