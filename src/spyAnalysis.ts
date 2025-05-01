import * as spyFS from './spyFS';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';
import fs from 'fs';


let lockouts: string[] = []
export function generateAnalysisResults(file: string) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let pylint = cfg.get("AnalysisEnabled", false);

    if (pylint) {
        if(!lockouts.includes(file)) {
            lockouts.push(file);
            const opt = {} as vscode.TerminalOptions;
            opt.location = vscode.TerminalLocation.Panel;
            opt.hideFromUser = true;
            opt.isTransient = true;
            const term = vscode.window.createTerminal(opt);

            try {
                let [path, filename] = spyFS.getFileFromPath(file)
                const outputname = "." + filename + "lintjson";
                const fulloutputname = path + "/" + outputname;
                if (fs.existsSync(fulloutputname)) {
                    console.log("PySpy found old code analysis file, removing " + outputname);
                    vscode.workspace.fs.delete(vscode.Uri.file(fulloutputname));
                }
                clearAnalysisReportHovers(file);
                term.sendText('cd ' + path, true);
                term.sendText('pylint --output-format=json ' + filename + " > " + outputname);
                setTimeout(parsePylintReport, 1000, file);
            }
            catch {
                // If you made it here, you somehow crashed the extension host process.
                vscode.window.showErrorMessage('PySpy error analyzing ' + file + ' - VSCode API crashed!');
            }
        }
        setTimeout(() => { lockouts = lockouts.filter((f) => f != file); }, 1000);
    }
}

export async function deleteCache() {
    const name_glob = "**/*.pylintjson"
    const files = await vscode.workspace.findFiles(name_glob);
    for await (const file of files) {
        console.log("PySpy: removing analysis cache for " + file.toString());
        vscode.workspace.fs.delete(file);
    }
    analysisReports = [];
}

let analysisReports : [string, number, string][] = []
function addAnalysisReportHover(filename: string, line: number, info: string) {
    if (!analysisReports.find(r => r[0] == filename && r[1] == line && r[2] == info)) {
        analysisReports.push([filename, line, info])
    }
}
function clearAnalysisReportHovers(filename: string) {
    analysisReports = analysisReports.filter((doc) => doc[0] != filename);
}
export function getAnalysisReportHovers(filename: string, line: number) : string | undefined {
    const matches = analysisReports.filter((doc) => doc[0] == filename && doc[1] == (line + 1))
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

async function parsePylintReport(file: string, retry: number = 0) {
    let [path, filename] = spyFS.getFileFromPath(file)
    const fulloutputname = path + "/." + filename + "lintjson"
    
    // wait up to 5 times for pylint to complete and the file to exist
    if (fs.existsSync(fulloutputname)) {
        let reportJson: string = fs.readFileSync(fulloutputname, { encoding: 'utf8' }).toString();
        if (reportJson.length <= 0) {
            return;
        }
        let reportLines = reportJson.replace('\r',"").split('\n');
        reportJson = outputFilter(reportLines).join("");

        const json = JSON.parse(reportJson);
        if (json.length > 0) {
            const td = await vscode.workspace.openTextDocument(file);
            const decos = spyUI.getSpyDecos(td);
            decos.forEach(deco => {
                for (var issue of json) {
                    // TODO pylint config / rules filtering?
                    if (deco[1].contains(new vscode.Position(issue["line"] - 1, 0))) {
                        // this issue belongs to this deco (and the tagged fn it represents)
                        addAnalysisReportHover(file, deco[2] + 1, "Line " + issue["line"] + ": " + issue["message"]);
                    }
                }
            });
        }
    }
    else if (retry < 5)
    {
        setTimeout(parsePylintReport, 1000, file, retry+1)
        return;
    }
}

function outputFilter(rawLines: string[]) : string[] {
    // terminal file IO also writes control and escape sequences; remove them.
    let rv: string[] = [];
    const unprintable = new RegExp('[^ -~]+', 'g');
    const extraWhitespace = new RegExp('\\s{2,}', 'gm');
    rawLines.forEach(line => {
        const filt0 = line.replace(unprintable, "");
        const filt1 = filt0.replace(extraWhitespace, " ");
        rv.push(filt1);
    });
    return rv;
}