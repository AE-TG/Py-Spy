import * as spyInputs from './spyInputs';
import * as spyMarshal from './spyMarshal';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';

// !! IMPORTANT !!
// It is on the calling function to provide only a set of inputs for which spyCompile has already built pycache files!
// Otherwise testing will fail because we don't make bytecode for marshaling to run on here in order to save effort
export function generateTestResults(decoFunctions: spyUI.spyDeco[]) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let doTests = cfg.get("TestingEnabled", false);

    if (doTests) {
        decoFunctions.forEach(fn => {
            unitTest(fn);
        });
    }
}

function unitTest(fn: spyUI.spyDeco) {
    let fSignature: string = fn[0].lineAt(fn[2]).text;
    console.log("testing " + fSignature + " in " + fn[0].fileName);
    
    // TODO generate inputs
    // spyMarshal get inputs
    
    let inputTypes: any[] = spyInputs.getInputTypes(fSignature);
    // inputTypes[0] is `undefined` for void functions.
    if (inputTypes.length == 0)
    {
        vscode.window.showWarningMessage("PySpy: " + fSignature + " has no type hints, unable to construct tests!");
    }

    // TODO run test
    // spyMarshal
    
    // TODO catch/report errors
    /*
    rvs.forEach(rv => {
       if (not type) {
        vscode.window.showInformationMessage('PySpy: compiling in background.');
       } 
    });
    */
    
    // TODO update coverage outputs
    /*
    spyUI.addCoverageDeco(line, true); // pass
    spyUI.addCoverageDeco(line, fail); // pass
    */
}
