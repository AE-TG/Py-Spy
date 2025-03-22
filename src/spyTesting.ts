import * as vscode from 'vscode';


export function generateTestCache(files: Set<string> | string[]) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let doTests = cfg.get("TestingEnabled", false);

    if (doTests) {

    }
}


