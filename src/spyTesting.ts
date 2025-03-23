import * as spyCompile from './spyCompile';
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
    let fName: string = fn[0].lineAt(fn[2]).text;
    console.log("testing " + fName + " in " + fn[0].fileName);
    
    // TODO compile file
    
    // TODO generate inputs
    
    // TODO run test
    
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
