import * as spyCompile from './spyCompile';
import * as spyFS from './spyFS';
import * as spyStatistics from './spyStatistics';
import * as spyTesting from './spyTesting';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';


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
        spyStatistics.generateRadonCache([doc.fileName]);
        spyCompile.build(doc.fileName);
        spyTesting.generateTestResults(spyUI.getSpyDecos(doc));
        spyUI.updateDecorations(ctx); // update again to collect the test results
    }
    else {
        spyStatistics.generateRadonCache(spyFS.getSpyFiles());
        const spySet = spyFS.getSpyFiles();
        spySet.forEach(file => {
            spyCompile.build(file);
        });
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
