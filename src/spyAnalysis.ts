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
        const json = JSON.parse(JSON.stringify(reportJson));
        console.log(json);
    }
    else if (retry < 5)
    {
        setTimeout(parsePylintReport, 1000, file, retry+1)
        return;
    }
}
