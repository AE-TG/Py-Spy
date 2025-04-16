import * as spyMarshal from './spyMarshal';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';
import fs from 'fs';


// !! IMPORTANT !!
// It is on the calling function to provide only a set of inputs for which spyCompile has already built pycache files!
// Otherwise testing will fail because we don't make bytecode for marshaling to run on here in order to save effort.
// TODO There is a relevant note in spyMarshal.py to reflect this now that we are also passing the source file name.
export function generateTestResults(decoFunctions: spyUI.spyDeco[]) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let doTests = cfg.get("TestingEnabled", false);

    if (doTests) {
        if (decoFunctions.length == 0)
        {
            // wait for UI to find tagged functions
            setTimeout(spyUI.getSpyDecos, 2000);
            setTimeout(runTests, 2050, spyUI.getSpyDecos());
        }
        else
        {
            runTests(decoFunctions);
        }
        
        //parseCovReports(fn);
    }
}

function runTests(decoFunctions: spyUI.spyDeco[]) {
    decoFunctions.forEach(fn => {
        unitTest(fn);
        parseCovReports(fn);
    });
}

async function unitTest(fn: spyUI.spyDeco) {
    let fSignature: string = fn[0].lineAt(fn[2]).text;
    console.log("testing " + fSignature + " in " + fn[0].fileName);
    try {
        spyMarshal.coverageTest(fn[0].fileName, fn);
    }
    catch {
        // TODO If you somehow made it here, you crashed the python interpreter itself.
        console.error("err testing " + fn[0].getText(fn[1]));
    }
}

function parseCovReports(fn: spyUI.spyDeco) {
    // concatenate reports
    // TODO get all files matching pattern
    const name = fn[0].fileName + (fn[2] + 1) + ".covjson"
    const covjson: string = fs.readFileSync(name).toString();
    if (covjson.length <= 0) {
        return;
    }
    
    const json = JSON.parse(covjson)
    // get all executed lines from all code called in the file that fn belongs to as an array of distinct lines
    const exec_lines = [... new Set(...find(json, "executed_lines"))] as number[]
    // get all intentionally skipped lines from all code called in the file that fn belongs to as an array of distinct lines
    const skip_lines = [... new Set(...find(json, "excluded_lines"))] as number[]
    // get all not executed lines in the function
    const range = fn[1].end.line - fn[1].start.line
    let miss_lines = [...Array(range).keys()].map(e => e + fn[1].start.line) as number[]
    miss_lines = miss_lines.filter(n => !exec_lines.includes(n)); // miss lines is all lines except executed lines
    miss_lines = miss_lines.filter(n => !skip_lines.includes(n)); // miss lines is all lines except executed lines and skipped lines

    spyUI.resetCoverageDecoLists(fn[0]);
    for(var line of exec_lines) {
        var deco: spyUI.spyDeco = [fn[0], fn[0].lineAt(line-1).range, line]
        spyUI.addCoverageDeco(deco, true);
    }
    for(var line of miss_lines) {
        var deco: spyUI.spyDeco = [fn[0], fn[0].lineAt(line-1).range, line]
        spyUI.addCoverageDeco(deco, false);
    }
}

// Credit: https://stackoverflow.com/questions/69735241/typescript-find-values-of-certain-keys-in-json
// For a json object o, return all values of keys named key.
function find(obj: object, key: string) {
    const ret: any[] = [];
    JSON.stringify(obj, (_, nested) => {
      if (nested && nested[key]) {
        ret.push(nested[key]);
      }
      return nested;
    });
    return ret;
  };