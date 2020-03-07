import * as vscode from 'vscode';

export class ProblemList implements vscode.Disposable {
    private _collection: vscode.DiagnosticCollection;


    public update(document: vscode.TextDocument, errOutput: string) {
        this._collection.clear();
        this._collection.set(document.uri, this.parser(errOutput));
    }

    public dispose() {
        this._collection.dispose();
    }

    /** 
     * wrong
     * ^
     * "/file/path" line 7: invalid command
     */
    private parser(errOutput: string) {
        if (errOutput == '') {
            return []
        }

        const lineRegExp:    RegExp = /(?<=line )[0-9]+/;
        const messageRegExp: RegExp = /(?<=[0-9]: ).*/;
        //const messageRegExp: RegExp = /(?<=: ).*$/; why doesn't $ work

        let errLines = errOutput.split('\n');

        let length  = errLines[1].length;
        let start   = errLines[2].length -1;
        let line    = Number(lineRegExp.exec(errLines[3])?.toString())  ?? 1;
        let message = messageRegExp.exec(errLines[3])?.toString() ?? 'Parse Failed, Check Output/Gnuplot';

        return [{
			message: message,
			range: new vscode.Range(new vscode.Position(line-1, start-1), new vscode.Position(line-1, length-1)),
			severity: vscode.DiagnosticSeverity.Error,
			source: 'Gnuplot',
		}]
    }

    public constructor(collection: vscode.DiagnosticCollection) {
        this._collection = collection;
    }
}