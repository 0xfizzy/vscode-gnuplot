import * as vscode from 'vscode'
import { Extension } from './extension'

export class Logger {
    private _extension: Extension
    private _logPanel: vscode.OutputChannel

    constructor(extension: Extension) {
        this._extension = extension
        this._logPanel = vscode.window.createOutputChannel('Gnuplot')
    }

    addLogMessage(message: string) {
        this._logPanel.append(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${message}\n`)
    }

    showErrorMessage(message: string, ...args: any): Thenable<any> | undefined {
        const configuration = vscode.workspace.getConfiguration('Gnuplot')
        if (configuration.get('message.error.show')) {
            return vscode.window.showErrorMessage(message, ...args)
        } else {
            return undefined
        }
    }

    showLog() {
        this._logPanel.show()
    }
}
