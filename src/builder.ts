import * as vscode from 'vscode';
import * as cp from 'child_process'
import {ProblemList} from './problem';

export class Builder {
    private static _content: string = 'No output now';

    public static getContent() {
        return Builder._content;
    }

    public static buildFig(document: vscode.TextDocument, problem?: ProblemList, log?: vscode.OutputChannel) {
        let figBuilder = cp.spawnSync('gnuplot',['-e',Builder._setTerm(),document.uri.fsPath]);

        switch (figBuilder.status) {
            case 0    : Builder._content =  figBuilder.stdout.toString();  break;
            case null : vscode.window.showInformationMessage("Too Big");   break;
            default   : break;
        }
        
        log?.appendLine(figBuilder.stderr.toString());
        problem?.update(document, figBuilder.stderr.toString());
    }

    private static _setTerm() {
        return "set terminal canvas name 'gp' standalone mousing jsdir 'EXTGPJS' "
    }
}