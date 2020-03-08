import * as vscode from 'vscode';
import {Extension} from './extension'

export class Watcher implements vscode.Disposable { 
    public readonly config = vscode.workspace.getConfiguration('gnuplot.watcher');

    private _extension: Extension;
    private _watchedFiles: { [file: string]: { lastChange: number; preview: string } } ={};
    private _watcherEvent: vscode.Disposable | undefined;

    public dispose() {
        this._watchedFiles = {};
        this._watcherEvent?.dispose();
        this._watcherEvent = undefined;
    }

    public startWatching() {
        if (!this._watcherEvent) {
            this._watcherEvent = vscode.workspace.onDidChangeTextDocument(
                (e: vscode.TextDocumentChangeEvent) => {this.onFileChange(e.document)}
            )	
        }	
    }

    public onFileChange(document: vscode.TextDocument, waitedDelay?: boolean) {
        // const changeDelay = this.config.get('delay') as number;
        // if (changeDelay === 0) { return }
        if( document.languageId != 'gnuplot')  {
            return;
        }
        
        // vscode.window.showInformationMessage('Hey! Samuri!');

        let changeDelay = 500;
        let timeout     = 2000;

        if (!(document.uri.fsPath in this._watchedFiles)) {
            //vscode.window.showInformationMessage('I am watching you');
            this._watchedFiles[document.uri.fsPath] = { lastChange: +new Date(), preview:'' };
        }      
        
        if ( +new Date() - this._watchedFiles[document.uri.fsPath].lastChange < changeDelay) {
            //vscode.window.showInformationMessage('<');
            if (!waitedDelay) {
                this._watchedFiles[document.uri.fsPath].lastChange = +new Date();
                setTimeout( () => { this.onFileChange(document, true)}, changeDelay)
            }
            return
        }
        
        this._watchedFiles[document.uri.fsPath].lastChange = +new Date();

        if (+new Date() - this._watchedFiles[document.uri.fsPath].lastChange > timeout ) {
            return
        }

        this._extension.builder.buildFig(document);
        this._extension.viewer.update(this._extension.builder.getContent());
    }

    public constructor(extension: Extension) {
        this._extension = extension;
    }
}