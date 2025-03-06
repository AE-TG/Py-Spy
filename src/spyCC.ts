import * as vscode from 'vscode';
import * as spyUI from './spyUI';

export function getComplexity(highlight: spyUI.spyDeco, cancel: vscode.CancellationToken) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let radon = cfg.get("RadonInstallLocation", false);

    if (radon) {
        const opt = {} as vscode.TerminalOptions;
        opt.location = vscode.TerminalLocation.Panel;
        opt.hideFromUser = true;
        opt.isTransient = true;
        const term = vscode.window.createTerminal(opt);

        vscode.window.onDidChangeTerminalShellIntegration(async ({ terminal, shellIntegration }) => {
            if (terminal === term) {
                const cd = shellIntegration.executeCommand('cd ' + radon);
                cd.read();
                const cc = shellIntegration.executeCommand('./radon cc ' + highlight[0]);
                const stream = cc.read();
                for await(const data of stream) {
                    console.log(data);
                    // TODO - Radon works when called from a terminal in the workspace by hand
                    // but this integration just reads back the cd and some trash data.
                }
            }
          });

        return new vscode.Hover("blablabla", highlight[1]);
    }
    else {
        cancel.isCancellationRequested = true;
        return new vscode.Hover("PySpy Radon not found.", highlight[1]);
    }   
}
