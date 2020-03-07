import * as vscode from 'vscode';
import {Builder} from './builder';
import {PreviewPanel} from './viewer';
import {ProblemList} from './problem';

export function activate(context: vscode.ExtensionContext) {	
	context.subscriptions.push(
		vscode.commands.registerCommand('gnuplot.view', () => {
			preview(context.extensionPath);
		})
	);
}

function preview(extensionPath: string) {
    if(!vscode.window.activeTextEditor) {
        return;
	}

	//Get the file to preview
	let document =  vscode.window.activeTextEditor.document;
	//Create a problem list
	let problem = new ProblemList(vscode.languages.createDiagnosticCollection('Gnuplot'));
	//Create a log channel
	let log = vscode.window.createOutputChannel("gnuplot");
    //Watch if the file is changed
	let watcher = vscode.workspace.createFileSystemWatcher(document.uri.fsPath); 
	//Create a preview panel
	let viewer = new PreviewPanel(extensionPath, [watcher,problem,log]);

    //If changed, build figure and update viewer
    watcher.onDidChange(() => {
		Builder.buildFig(document, problem);
		viewer.update(Builder.getContent());
		});
}

export class Extension {

}