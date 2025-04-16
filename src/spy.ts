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
    spyUI.updateDecorations(ctx, 0);
}
export function scanUI(ctx: vscode.ExtensionContext) {
    spyUI.updateDecorations(ctx);
}
export function removeUI() {
    spyUI.removeDecorations();
}

export function scanCC(ctx?: vscode.ExtensionContext, doc?: vscode.TextDocument) {
    if (ctx && doc) {
        // A specific file was opened or saved.

        spyUI.updateDecorations(ctx, 0);
        if (doc.fileName.endsWith(".py")) {
            spyStatistics.generateRadonCache([doc.fileName]);
            spyCompile.build(doc.fileName);
            spyTesting.generateTestResults(spyUI.getSpyDecos(doc));
        }
        spyUI.updateDecorations(ctx); // update again to collect the test results
    }
    else {
        const spySet = spyFS.getSpyFiles();
        spyStatistics.generateRadonCache(spySet);
        spySet.forEach(file => {
            spyCompile.build(file);
        });
        spyTesting.generateTestResults([]); // TODO because the previous editors are closed, there is an issue with this only finding tags in the previous file because the UI has not updated.
    }
}
export async function deleteCache() {
    let spySet = spyFS.getSpyFiles();
    spySet = spyFS.getSpyFiles();
    for await (const file of spySet) {
        await spyCompile.removeBuildFile(file);
    }
    await spyStatistics.deleteRadonCache(spySet);
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
