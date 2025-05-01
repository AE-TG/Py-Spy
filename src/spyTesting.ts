import * as spyMarshal from './spyMarshal';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';
import fs from 'fs';


export function generateTestResults(decoFunctions: spyUI.spyDeco[]) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let doTests = cfg.get("TestingEnabled", false);

    if (doTests) {
        if (decoFunctions.length > 0)
        {
            type testDict = { [file: string] : number[] }
            let files: testDict = {}
            for (var deco of decoFunctions) {
                if (files[deco[0].fileName]) {
                    files[deco[0].fileName].push(deco[2] + 1)
                }
                else {
                    files[deco[0].fileName] = [deco[2] + 1]
                }
            }
            for (var file in files) {
                try {
                    spyMarshal.coverageTest(file, files[file]);
                }
                catch {
                    // If you made it here, you somehow crashed the spyMarshal/PythonShell interpreter itself.
                    vscode.window.showErrorMessage('PySpy error testing ' + file + ' - Python crashed!');
                }
                parseCovReport(file, decoFunctions);
            }
        }
    }
}

let testReports : [string, number, string][] = []
export function addTestReportHover(filename: string, line: number, info: string) {
    if (!testReports.find(r => r[0] == filename && r[1] == line && r[2] == info)) {
        testReports.push([filename, line, info])
    }
}
export function clearTestReportHovers(filename: string) {
    testReports = testReports.filter((doc) => doc[0] != filename);
}
export function getTestReportHovers(filename: string, line: number) : string | undefined {
    const matches = testReports.filter((doc) => doc[0] == filename && doc[1] == (line + 1))
    if (matches.length > 0)
    {
        let rv = ""
        matches.forEach(report => {
            rv += report[2]
            rv += "  \n"
        });
        return rv;
    }
    return undefined;
}

export async function deleteTestCache() {
    const name_glob = "**/*.py*.covjson"
    const files = await vscode.workspace.findFiles(name_glob);
    for await (const file of files) {
        console.log("PySpy: removing coverage cache for " + file.toString());
        vscode.workspace.fs.delete(file);
    }
    testReports = [];
}

export async function parseCovReport(filename: string, decoFunctions: spyUI.spyDeco[]) {
    const name = filename + ".covjson"
    try {
        const covjson: string = fs.readFileSync(name).toString();
        if (covjson.length <= 0) {
            return;
        }

        const json = JSON.parse(covjson);
        // get all executed lines from all code as an array of distinct line numbers
        const exec_lines = [... new Set(...find(json, "executed_lines"))] as number[]
        // get all intentionally skipped lines from all code as an array of distinct line numbers
        const skip_lines = [... new Set(...find(json, "excluded_lines"))] as number[]
        // get all lines belonging to functions in the file that SHOULD be covered
        let fLines: number[] = []
        for (var fn of decoFunctions) {
            if (fn[0].fileName == filename) {
                fLines.push(...[...Array(fn[1].end.line - fn[1].start.line).keys()].map(e => e + fn[1].start.line))
            }
        }
        let miss_lines = fLines;
        // missed lines are only lines that should be covered but are not executed or skipped
        miss_lines = miss_lines.filter(n => !exec_lines.includes(n));
        miss_lines = miss_lines.filter(n => !skip_lines.includes(n));

        const td = await vscode.workspace.openTextDocument(filename);
        spyUI.resetCoverageDecoLists(td);
        for(var line of exec_lines) {
            var deco: spyUI.spyDeco = [td, td.lineAt(line - 1).range, line - 1]
            spyUI.addCoverageDeco(deco, true);
        }
        for(var line of miss_lines) {
            var deco: spyUI.spyDeco = [td, td.lineAt(line - 1).range, line - 1]
            spyUI.addCoverageDeco(deco, false);
        }
    }
    catch {
        console.warn("Unable to apply coverage test highlights - coverage report " + name + " not found.");
    }
}

// Credit: https://stackoverflow.com/questions/69735241/typescript-find-values-of-certain-keys-in-json
// For a json object obj, return all values of keys named key.
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
