import * as spyAnalysis from './spyAnalysis';
import * as spyCompile from './spyCompile';
import * as spyMarshal from './spyMarshal';
import * as spyFS from './spyFS';
import * as spyStatistics from './spyStatistics';
import * as spyTesting from './spyTesting';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';


export async function setInfo(ctx: vscode.ExtensionContext) {
    spyFS.python.version = spyMarshal.getPyVersion(ctx);
    if ((parseInt(spyFS.python.version.at(0)!) < 3) && ((parseInt(spyFS.python.version)) < 39)) {
        vscode.window.showErrorMessage('PySpy detected Python version ' + spyFS.python.version + " - some features are disabled on versions lower than 3.9!");
    }
}
export function setupUI(ctx: vscode.ExtensionContext) {
    spyUI.createDecorations(ctx);
    spyUI.updateDecorations(0);
}
export function scanUI(ctx: vscode.ExtensionContext) {
    spyUI.updateDecorations();
}
export function removeUI() {
    spyUI.removeDecorations();
}

export function scanCC(ctx?: vscode.ExtensionContext, doc?: vscode.TextDocument) {
    if (ctx && doc) {
        // A specific file was opened or saved.

        spyUI.updateDecorations(0);
        if (doc.fileName.endsWith(".py")) {
            spyStatistics.generateRadonCache([doc.fileName]);
            //spyCompile.build(doc.fileName); // let coverage testing compile instead
            spyAnalysis.generateAnalysisResults(doc.fileName);
            spyTesting.generateTestResults(spyUI.getSpyDecos(doc));
        }
        spyUI.updateDecorations(1000); // update again to collect the test results
    }
    else {
        const spySet = spyFS.getSpyFiles();
        spyStatistics.generateRadonCache(spySet);
        spySet.forEach(file => {
            //spyCompile.build(file); // let coverage testing compile instead
        });
        spyTesting.generateTestResults([]);
        spyUI.updateDecorations(2000);
    }
}
export async function deleteCache() {
    let spySet = spyFS.getSpyFiles();
    spySet = spyFS.getSpyFiles();
    for await (const file of spySet) {
        await spyCompile.removeBuildFile(file);
    }
    await spyAnalysis.deleteCache();
    await spyTesting.deleteTestCache();
    await spyStatistics.deleteRadonCache(spySet);
}

export function provideComplexityHover(file: vscode.TextDocument, pos: vscode.Position, cancel: vscode.CancellationToken) : vscode.ProviderResult<vscode.Hover> {
    for (let highlight of spyUI.getSpyDecos(file)) {
        if (spyUI.getFnTagRange(highlight[0], highlight[1]).contains(pos)) {
            return new Promise<vscode.Hover>(resolve => {
                resolve(spyStatistics.getComplexity(highlight, cancel));
            });
        }
    };
    return undefined;
}

export function provideTestingHover(file: vscode.TextDocument, pos: vscode.Position, cancel: vscode.CancellationToken) : vscode.ProviderResult<vscode.Hover> {
    for (let highlight of spyUI.getSpyDecos(file)) {
        if (spyUI.getFnTagRange(highlight[0], highlight[1]).contains(pos)) {
            return new Promise<vscode.Hover>((resolve, reject) => {
                const str = spyTesting.getTestReportHovers(file.fileName, pos.line + 1); // line is zero-indexed
                if (str)
                {
                    resolve(new vscode.Hover(str, highlight[1]));
                }
                reject(str);
                return str;
            });
        }
    };
    return undefined;
}
